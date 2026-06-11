import express, { type Request, type Response } from 'express';
import cors from 'cors';
import { config, toBaseUnits } from './config.js';
import { underwriterAddress } from './sui.js';
import { fetchAgentTelemetry } from './telemetry.js';
import { evaluateLoanRisk } from './risk-engine.js';
import { storeDecision, readDecision, type DecisionRecord } from './walrus.js';
import { disburse } from './ptb.js';

export function createServer() {
  const app = express();
  app.use(cors());
  app.use(express.json());

  // ACP header logging (OpenClaw Agent Communication Protocol).
  app.use((req, _res, next) => {
    const agentId = req.header('X-Agent-ID');
    if (agentId) console.log(`📡 [ACP] Request from agent: ${agentId}`);
    next();
  });

  app.get('/status', (_req: Request, res: Response) => {
    res.json({
      status: 'ONLINE',
      name: 'M-Fi Underwriter (Sui)',
      network: config.network,
      underwriter: underwriterAddress,
      packageId: config.packageId,
      capabilities: ['risk_assessment', 'micro_lending', 'walrus_audit'],
      acpVersion: '1.0.0',
    });
  });

  // Audit: fetch the Walrus-stored decision behind any loan.
  app.get('/api/v1/decision/:blobId', async (req: Request, res: Response) => {
    try {
      res.json(await readDecision(req.params.blobId));
    } catch (err) {
      res.status(404).json({ error: 'DECISION_NOT_FOUND', message: String(err) });
    }
  });

  // Core: request a loan.
  app.post('/api/v1/loan/request', async (req: Request, res: Response): Promise<void> => {
    const { agentAddress, requestedAmount, collateral, purpose } = req.body ?? {};
    if (!agentAddress || !requestedAmount) {
      res.status(400).json({ error: 'INCOMPLETE_REQUEST', message: 'agentAddress and requestedAmount required.' });
      return;
    }

    try {
      // 1. Gather live on-chain telemetry.
      const telemetry = await fetchAgentTelemetry(agentAddress);

      // 2. LLM underwriting decision.
      const decision = await evaluateLoanRisk(telemetry, Number(requestedAmount), collateral, purpose);

      // 3. Persist the full decision to Walrus -> auditable blob id.
      const record: DecisionRecord = {
        version: '1.0',
        timestamp: new Date().toISOString(),
        agentAddress,
        requestedAmount: Number(requestedAmount),
        purpose: purpose || '',
        telemetry,
        decision,
        model: config.groqModel,
      };
      let decisionBlob = '';
      try {
        decisionBlob = await storeDecision(record);
      } catch (e) {
        console.warn('⚠️ Walrus store failed (continuing without audit blob):', String(e));
      }

      if (decision.decision === 'DENY') {
        res.status(403).json({ status: 'DENIED', reason: decision.reasoning, trustScore: decision.trustScore, decisionBlob });
        return;
      }

      if (decision.decision === 'COUNTER_OFFER') {
        res.status(202).json({
          status: 'COUNTER_OFFER',
          proposedAmount: decision.proposedAmount,
          proposedApy: decision.proposedApy,
          reason: decision.reasoning,
          trustScore: decision.trustScore,
          decisionBlob,
        });
        return;
      }

      // 4. APPROVE -> disburse on-chain in a single PTB.
      const out = await disburse({
        borrower: agentAddress,
        principalBaseUnits: toBaseUnits(Number(requestedAmount)),
        apyBps: 1000, // 10% default for full approvals
        trustScore: decision.trustScore,
        decisionBlob,
        purpose: purpose || '',
      });

      res.status(out.success ? 200 : 500).json({
        status: out.success ? 'APPROVED' : 'FAILED_DISBURSEMENT',
        amount: Number(requestedAmount),
        loanId: out.loanId,
        txDigest: out.digest,
        reason: decision.reasoning,
        trustScore: decision.trustScore,
        decisionBlob,
        error: out.error,
      });
    } catch (err) {
      console.error('🔥 loan/request error:', err);
      res.status(500).json({ error: 'INTERNAL_UNDERWRITER_ERROR', message: String(err) });
    }
  });

  // Accept a counter-offer -> disburse the proposed terms.
  app.post('/api/v1/loan/accept', async (req: Request, res: Response): Promise<void> => {
    const { agentAddress, amount, apy, decisionBlob } = req.body ?? {};
    if (!agentAddress || !amount || !apy) {
      res.status(400).json({ error: 'INVALID_ACCEPTANCE', message: 'agentAddress, amount, apy required.' });
      return;
    }
    try {
      const out = await disburse({
        borrower: agentAddress,
        principalBaseUnits: toBaseUnits(Number(amount)),
        apyBps: Math.round(Number(apy) * 100),
        trustScore: 0,
        decisionBlob: decisionBlob || '',
        purpose: 'Accepted counter-offer',
      });
      res.status(out.success ? 200 : 500).json({
        status: out.success ? 'APPROVED' : 'FAILED_DISBURSEMENT',
        amount: Number(amount),
        loanId: out.loanId,
        txDigest: out.digest,
        error: out.error,
      });
    } catch (err) {
      res.status(500).json({ error: 'INTERNAL_UNDERWRITER_ERROR', message: String(err) });
    }
  });

  return app;
}
