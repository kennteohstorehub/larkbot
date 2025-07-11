const fs = require('fs').promises;
const path = require('path');
const readline = require('readline');

/**
 * Interactive setup script for Intercom-Lark automation system
 */
class SetupWizard {
  constructor() {
    this.rl = readline.createInterface({
      input: process.stdin,
      output: process.stdout
    });
    this.config = {};
  }

  /**
   * Prompts user for input
   * @param {string} question - Question to ask
   * @param {string} defaultValue - Default value if user presses enter
   * @returns {Promise<string>} User input
   */
  async prompt(question, defaultValue = '') {
    return new Promise((resolve) => {
      const displayQuestion = defaultValue 
        ? `${question} (${defaultValue}): `
        : `${question}: `;
      
      this.rl.question(displayQuestion, (answer) => {
        resolve(answer.trim() || defaultValue);
      });
    });
  }

  /**
   * Prompts user for password/secret input (hidden)
   * @param {string} question - Question to ask
   * @returns {Promise<string>} User input
   */
  async promptSecret(question) {
    return new Promise((resolve) => {
      this.rl.question(`${question}: `, (answer) => {
        resolve(answer.trim());
      });
    });
  }

  /**
   * Runs the setup wizard
   */
  async run() {
    console.log('\n🚀 Welcome to Intercom-Lark Automation Setup');
    console.log('==========================================\n');
    
    console.log('This wizard will help you configure the application.\n');
    console.log('You can find the required values in:');
    console.log('- Intercom: Settings → Developers → Your App → Configure');
    console.log('- Lark Suite: Developer Console → Your App → Credentials\n');

    try {
      // Collect configuration
      await this.collectIntercomConfig();
      await this.collectLarkConfig();
      await this.collectApplicationConfig();
      await this.collectFeatureConfig();

      // Create .env file
      await this.createEnvFile();

      // Create directory structure
      await this.createDirectories();

      // Display summary
      await this.displaySummary();

      console.log('\n✅ Setup completed successfully!');
      console.log('\nNext steps:');
      console.log('1. npm install');
      console.log('2. npm run phase1');
      console.log('3. Check the exports/ directory for generated files\n');

    } catch (error) {
      console.error('\n❌ Setup failed:', error.message);
    } finally {
      this.rl.close();
    }
  }

  /**
   * Collects Intercom configuration
   */
  async collectIntercomConfig() {
    console.log('📨 Intercom Configuration');
    console.log('------------------------');
    
    this.config.INTERCOM_TOKEN = await this.promptSecret('Intercom Access Token');
    this.config.INTERCOM_APP_ID = await this.prompt('Intercom App ID (optional)');
    this.config.INTERCOM_API_VERSION = await this.prompt('Intercom API Version', '2.11');
    
    console.log('');
  }

  /**
   * Collects Lark Suite configuration
   */
  async collectLarkConfig() {
    console.log('🐦 Lark Suite Configuration');
    console.log('--------------------------');
    
    this.config.LARK_APP_ID = await this.prompt('Lark App ID (optional for Phase 1)');
    this.config.LARK_APP_SECRET = await this.promptSecret('Lark App Secret (optional for Phase 1)');
    this.config.LARK_BOT_TOKEN = await this.promptSecret('Lark Bot Token (optional for Phase 1)');
    
    console.log('');
  }

  /**
   * Collects application configuration
   */
  async collectApplicationConfig() {
    console.log('⚙️  Application Configuration');
    console.log('-----------------------------');
    
    this.config.NODE_ENV = await this.prompt('Environment', 'development');
    this.config.PORT = await this.prompt('Server Port', '3001');
    this.config.LOG_LEVEL = await this.prompt('Log Level', 'info');
    this.config.WEBHOOK_SECRET = await this.promptSecret('Webhook Secret (generate a random string)');
    this.config.WEBHOOK_PORT = await this.prompt('Webhook Port', '3000');
    
    console.log('');
  }

  /**
   * Collects feature configuration
   */
  async collectFeatureConfig() {
    console.log('🎛️  Feature Configuration');
    console.log('-------------------------');
    
    const enableWebhooks = await this.prompt('Enable Webhooks (true/false)', 'false');
    const enableChatbot = await this.prompt('Enable Chatbot (true/false)', 'false');
    const enableMonitoring = await this.prompt('Enable Monitoring (true/false)', 'true');
    const debugMode = await this.prompt('Debug Mode (true/false)', 'false');
    
    this.config.ENABLE_WEBHOOKS = enableWebhooks;
    this.config.ENABLE_CHATBOT = enableChatbot;
    this.config.ENABLE_MONITORING = enableMonitoring;
    this.config.DEBUG_MODE = debugMode;
    
    console.log('');
  }

  /**
   * Creates the .env file
   */
  async createEnvFile() {
    console.log('📝 Creating .env file...');
    
    const envContent = `# Intercom Configuration
INTERCOM_TOKEN=${this.config.INTERCOM_TOKEN}
INTERCOM_APP_ID=${this.config.INTERCOM_APP_ID}
INTERCOM_API_VERSION=${this.config.INTERCOM_API_VERSION}

# Lark Suite Configuration
LARK_APP_ID=${this.config.LARK_APP_ID}
LARK_APP_SECRET=${this.config.LARK_APP_SECRET}
LARK_BOT_TOKEN=${this.config.LARK_BOT_TOKEN}

# Application Configuration
NODE_ENV=${this.config.NODE_ENV}
PORT=${this.config.PORT}
LOG_LEVEL=${this.config.LOG_LEVEL}
WEBHOOK_SECRET=${this.config.WEBHOOK_SECRET}
WEBHOOK_PORT=${this.config.WEBHOOK_PORT}

# Feature Flags
ENABLE_WEBHOOKS=${this.config.ENABLE_WEBHOOKS}
ENABLE_CHATBOT=${this.config.ENABLE_CHATBOT}
ENABLE_MONITORING=${this.config.ENABLE_MONITORING}
DEBUG_MODE=${this.config.DEBUG_MODE}

# Redis Configuration (for future phases)
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=

# Security (change these in production)
JWT_SECRET=your-jwt-secret-here
ENCRYPTION_KEY=your-encryption-key-here

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# External Services (optional)
OPENAI_API_KEY=
SLACK_WEBHOOK_URL=
SENTRY_DSN=
`;

    const envPath = path.join(__dirname, '..', '.env');
    await fs.writeFile(envPath, envContent);
    
    console.log('✅ .env file created');
  }

  /**
   * Creates necessary directories
   */
  async createDirectories() {
    console.log('📁 Creating directory structure...');
    
    const directories = [
      'exports',
      'logs',
      'tmp',
      'tests/fixtures'
    ];
    
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
  }

  /**
   * Displays configuration summary
   */
  async displaySummary() {
    console.log('\n📋 Configuration Summary');
    console.log('========================');
    
    console.log(`Environment: ${this.config.NODE_ENV}`);
    console.log(`Server Port: ${this.config.PORT}`);
    console.log(`Log Level: ${this.config.LOG_LEVEL}`);
    console.log(`Intercom Token: ${this.config.INTERCOM_TOKEN ? '✅ Configured' : '❌ Missing'}`);
    console.log(`Lark App ID: ${this.config.LARK_APP_ID ? '✅ Configured' : '⚠️  Optional for Phase 1'}`);
    console.log(`Webhooks: ${this.config.ENABLE_WEBHOOKS}`);
    console.log(`Chatbot: ${this.config.ENABLE_CHATBOT}`);
    console.log(`Monitoring: ${this.config.ENABLE_MONITORING}`);
    console.log(`Debug Mode: ${this.config.DEBUG_MODE}`);
  }

  /**
   * Validates required configuration
   */
  validateConfig() {
    const required = ['INTERCOM_TOKEN', 'WEBHOOK_SECRET'];
    const missing = required.filter(key => !this.config[key]);
    
    if (missing.length > 0) {
      throw new Error(`Missing required configuration: ${missing.join(', ')}`);
    }
  }
}

// Run setup wizard if this file is executed directly
if (require.main === module) {
  const wizard = new SetupWizard();
  wizard.run();
}

module.exports = SetupWizard; 