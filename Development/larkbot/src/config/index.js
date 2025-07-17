const dotenv = require('dotenv');
const path = require('path');

// Load environment variables
dotenv.config();

/**
 * Application Configuration
 * Centralizes all configuration settings for the Intercom-Lark automation system
 */
const config = {
  // Application Settings
  app: {
    name: 'Intercom-Lark Automation',
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
    port: parseInt(process.env.PORT) || 3001,
    logLevel: process.env.LOG_LEVEL || 'info',
    debugMode: process.env.DEBUG_MODE === 'true'
  },

  // Intercom Configuration
  intercom: {
    token: process.env.INTERCOM_TOKEN,
    appId: process.env.INTERCOM_APP_ID,
    apiVersion: process.env.INTERCOM_API_VERSION || '2.11',
    baseUrl: 'https://api.intercom.io',
    rateLimit: {
      maxRequests: 10000,
      windowMs: 60000 // 1 minute
    }
  },

  // Lark Suite Configuration
  lark: {
    appId: process.env.LARK_APP_ID,
    appSecret: process.env.LARK_APP_SECRET,
    botToken: process.env.LARK_BOT_TOKEN,
    baseUrl: 'https://open.larksuite.com'
  },

  // Redis Configuration
  redis: {
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    password: process.env.REDIS_PASSWORD,
    retryAttempts: 3,
    retryDelay: 1000
  },

  // Webhook Configuration
  webhook: {
    secret: process.env.WEBHOOK_SECRET,
    port: parseInt(process.env.WEBHOOK_PORT) || 3000,
    url: process.env.WEBHOOK_URL,
    timeout: 30000 // 30 seconds
  },

  // Security Settings
  security: {
    jwtSecret: process.env.JWT_SECRET || 'default-secret-change-in-production',
    encryptionKey: process.env.ENCRYPTION_KEY,
    rateLimitWindowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 60000,
    rateLimitMaxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 100
  },

  // Feature Flags
  features: {
    enableWebhooks: process.env.ENABLE_WEBHOOKS === 'true',
    enableChatbot: process.env.ENABLE_CHATBOT === 'true',
    enableMonitoring: process.env.ENABLE_MONITORING !== 'false'
  },

  // External Services
  external: {
    openai: {
      apiKey: process.env.OPENAI_API_KEY
    },
    slack: {
      webhookUrl: process.env.SLACK_WEBHOOK_URL
    },
    sentry: {
      dsn: process.env.SENTRY_DSN
    }
  },

  // Data Processing Settings
  processing: {
    batchSize: 100,
    maxRetries: 3,
    timeoutMs: 30000,
    concurrency: 5
  },

  // Export Settings
  export: {
    outputDir: path.join(__dirname, '../../exports'),
    maxFileSize: '100MB',
    supportedFormats: ['json', 'csv', 'xlsx']
  }
};

/**
 * Validates that required configuration values are present
 * @throws {Error} If required configuration is missing
 */
function validateConfig() {
  const required = [
    'webhook.secret'
  ];

  // Only require Intercom token if not using mock mode
  if (config.intercom.token && config.intercom.token !== 'your_intercom_access_token_here') {
    required.push('intercom.token');
  }

  const missing = [];

  required.forEach((key) => {
    const value = key.split('.').reduce((obj, prop) => obj?.[prop], config);
    if (!value) {
      missing.push(key);
    }
  });

  if (missing.length > 0) {
    throw new Error(`Missing required configuration: ${missing.join(', ')}`);
  }
}

/**
 * Gets configuration value by dot notation path
 * @param {string} path - Dot notation path (e.g., 'intercom.token')
 * @param {*} defaultValue - Default value if path not found
 * @returns {*} Configuration value
 */
function get(path, defaultValue = null) {
  return path.split('.').reduce((obj, prop) => obj?.[prop], config) || defaultValue;
}

/**
 * Checks if the application is running in development mode
 * @returns {boolean} True if in development mode
 */
function isDevelopment() {
  return config.app.environment === 'development';
}

/**
 * Checks if the application is running in production mode
 * @returns {boolean} True if in production mode
 */
function isProduction() {
  return config.app.environment === 'production';
}

/**
 * Gets the current phase based on enabled features
 * @returns {number} Current phase number
 */
function getCurrentPhase() {
  if (config.features.enableChatbot) return 5;
  if (config.lark.appId) return 4;
  if (config.features.enableWebhooks) return 3;
  return 1; // Basic extraction phase
}

module.exports = {
  ...config,
  validateConfig,
  get,
  isDevelopment,
  isProduction,
  getCurrentPhase
};
