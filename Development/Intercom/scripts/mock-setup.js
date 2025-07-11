const fs = require('fs').promises;
const path = require('path');

/**
 * Quick setup for mock mode development
 */
async function setupMockMode() {
  console.log('🎭 Setting up Mock Mode for Development');
  console.log('=====================================\n');
  
  const envContent = `# Mock Mode Configuration (no real Intercom token needed)
INTERCOM_TOKEN=mock_token_for_development
INTERCOM_APP_ID=mock_app_id
INTERCOM_API_VERSION=2.11

# Lark Suite Configuration (optional for Phase 1)
LARK_APP_ID=
LARK_APP_SECRET=
LARK_BOT_TOKEN=

# Application Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
WEBHOOK_SECRET=mock_webhook_secret_123
WEBHOOK_PORT=3000

# Feature Flags
ENABLE_WEBHOOKS=false
ENABLE_CHATBOT=false
ENABLE_MONITORING=true
DEBUG_MODE=true

# Redis Configuration (for future phases)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Security (change these in production)
JWT_SECRET=mock-jwt-secret-for-development
ENCRYPTION_KEY=mock-encryption-key-for-development

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# External Services (optional)
OPENAI_API_KEY=
SLACK_WEBHOOK_URL=
SENTRY_DSN=
`;

  try {
    // Create .env file
    const envPath = path.join(__dirname, '..', '.env');
    await fs.writeFile(envPath, envContent);
    console.log('✅ Created .env file with mock configuration');
    
    // Create necessary directories
    const directories = ['exports', 'logs', 'tmp'];
    for (const dir of directories) {
      const dirPath = path.join(__dirname, '..', dir);
      try {
        await fs.mkdir(dirPath, { recursive: true });
        console.log(`✅ Created directory: ${dir}`);
      } catch (error) {
        if (error.code !== 'EEXIST') {
          console.error(`❌ Failed to create directory ${dir}:`, error.message);
        }
      }
    }
    
    console.log('\n🎉 Mock mode setup complete!');
    console.log('\nYou can now run:');
    console.log('  npm install');
    console.log('  npm run phase1');
    console.log('  npm start');
    console.log('\nThe system will use mock data instead of real Intercom API calls.');
    console.log('When you get your Intercom token, just replace INTERCOM_TOKEN in .env\n');
    
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

// Run if executed directly
if (require.main === module) {
  setupMockMode();
}

module.exports = setupMockMode; 