import app from './app.js';
import { config, isNebiusConfigured } from './config/env.js';
import { db } from './storage/db.js';

async function bootstrap() {
  try {
    // Initialize data store
    await db.init();

    app.listen(config.PORT, () => {
      console.log('====================================================');
      console.log('🛡️  CodeSentry AI Backend Engine Online');
      console.log(`📡 Server running on http://localhost:${config.PORT}`);
      console.log(`🤖 Nebius Token Factory: ${isNebiusConfigured() ? 'CONFIGURED' : 'NOT CONFIGURED (Running static & demo mode)'}`);
      console.log(`🧠 NVIDIA Model Target: ${config.NEBIUS_MODEL}`);
      console.log(`🌐 Base URL: ${config.NEBIUS_BASE_URL}`);
      console.log(`💾 Storage: ${config.MONGODB_URI ? 'MongoDB' : 'Local JSON Store'}`);
      console.log('====================================================');
    });
  } catch (err) {
    console.error('Fatal bootstrap error:', err);
    process.exit(1);
  }
}

bootstrap();
