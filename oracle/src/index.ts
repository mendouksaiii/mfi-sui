import { config } from './config.js';
import { underwriterAddress } from './sui.js';
import { createServer } from './server.js';

function bootstrap() {
  console.log('███ M-FI UNDERWRITER (SUI) STARTING ███');
  console.log(`   Network:     ${config.network}`);
  console.log(`   Underwriter: ${underwriterAddress}`);
  console.log(`   Package:     ${config.packageId}`);

  const app = createServer();
  app.listen(config.port, () => {
    console.log(`\n🚀 OpenClaw ACP gateway on http://localhost:${config.port}`);
    console.log(`   GET  /status`);
    console.log(`   POST /api/v1/loan/request`);
    console.log(`   POST /api/v1/loan/accept`);
    console.log(`   GET  /api/v1/decision/:blobId`);
    console.log('\n⚡ Online and ready for agent loan requests.');
  });
}

process.on('unhandledRejection', (reason) => console.error('Unhandled rejection:', reason));
bootstrap();
