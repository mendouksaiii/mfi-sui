import OpenAI from 'openai';
import { config } from './config.js';
import type { AgentTelemetry } from './telemetry.js';

export interface RiskDecision {
  decision: 'APPROVE' | 'DENY' | 'COUNTER_OFFER';
  reasoning: string;
  confidence: number;
  trustScore: number; // 0-1000
  proposedAmount?: number;
  proposedApy?: number; // percent
}

// Groq is OpenAI-compatible.
const groq = new OpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: config.groqApiKey,
});

const SYSTEM_PROMPT = `You are the M-Fi (Machine Finance) Risk Underwriter on the Sui blockchain.
You are an autonomous credit bureau that evaluates micro-loan requests from other AI agents.
Approved loans are disbursed from a shared on-chain Treasury in USDC.

Rules for Approval & Negotiation:
1. DENY if txCount < 1 (Sybil protection) or reputationLayer is "Unknown".
2. If requested amount > 50 USDC and the agent holds < 100 USDC, do NOT deny outright — issue a COUNTER_OFFER.
3. If reputationLayer is "New" or "Medium", prefer a COUNTER_OFFER: lower amount (~50% of request) and higher APY (15-20%).
4. APPROVE fully only when the purpose is economically sound AND reputationLayer is "High".

Trust Score (0-1000): reflects global reliability from balances, owned objects, and tx count.
- 900+ : High reputation, healthy balances.
- 500-899 : Medium.
- <500 : New or suspicious.

Respond STRICTLY as JSON:
{
  "decision": "APPROVE" | "DENY" | "COUNTER_OFFER",
  "reasoning": "concise explanation",
  "confidence": 0.0-1.0,
  "trustScore": <0-1000>,
  "proposedAmount": <number, only for COUNTER_OFFER>,
  "proposedApy": <number percent, only for COUNTER_OFFER>
}`;

export async function evaluateLoanRisk(
  telemetry: AgentTelemetry,
  requestedAmount: number,
  collateral: string,
  purpose: string,
): Promise<RiskDecision> {
  const userPrompt = `AGENT REQUEST:
Address: ${telemetry.address}
Requested Amount: ${requestedAmount} USDC
Collateral/Offer: ${collateral || 'None'}
Purpose: ${purpose}

LIVE ON-CHAIN TELEMETRY:
${JSON.stringify(telemetry, null, 2)}

Provide your decision as JSON.`;

  try {
    const res = await groq.chat.completions.create({
      model: config.groqModel,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userPrompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
    });
    return JSON.parse(res.choices[0].message.content || '{}') as RiskDecision;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error('🔥 Risk engine error:', msg);
    return {
      decision: 'DENY',
      reasoning: 'Risk engine unavailable — automated safety deny.',
      confidence: 1.0,
      trustScore: 0,
    };
  }
}
