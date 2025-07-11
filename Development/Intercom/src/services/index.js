const config = require('../config');
const exportService = require('./export');
const logger = require('../utils/logger');

// Use mock service if no token is available or if it's a mock token
let intercomService;
const mockTokens = ['your_intercom_access_token_here', 'mock_token_for_development'];
if (config.intercom.token && !mockTokens.includes(config.intercom.token)) {
  intercomService = require('./intercom');
  logger.info('Using real Intercom service');
} else {
  intercomService = require('./intercom-mock');
  logger.info('🎭 Using mock Intercom service (no token configured)');
}

/**
 * Services Manager
 * Handles initialization and management of all services
 */
class ServicesManager {
  constructor() {
    this.services = {
      intercom: intercomService,
      export: exportService
    };
    this.initialized = false;
  }

  /**
   * Initializes all services
   */
  async initializeServices() {
    try {
      logger.info('Initializing services...');

      // Initialize Intercom service
      await this.services.intercom.initialize();

      // Initialize Export service
      await this.services.export.initialize();

      this.initialized = true;
      logger.info('All services initialized successfully');
    } catch (error) {
      logger.logError('ServicesManager.initializeServices', error);
      throw error;
    }
  }

  /**
   * Gets health status of all services
   * @returns {Object} Health status
   */
  getHealthStatus() {
    return {
      initialized: this.initialized,
      services: {
        intercom: this.services.intercom.getHealthStatus(),
        export: this.services.export.getHealthStatus()
      }
    };
  }

  /**
   * Gets a specific service
   * @param {string} serviceName - Name of the service
   * @returns {Object} Service instance
   */
  getService(serviceName) {
    if (!this.services[serviceName]) {
      throw new Error(`Service '${serviceName}' not found`);
    }
    return this.services[serviceName];
  }

  /**
   * Cleanup services on shutdown
   */
  async cleanup() {
    logger.info('Cleaning up services...');
    
    // Add cleanup logic for each service if needed
    for (const [name, service] of Object.entries(this.services)) {
      try {
        if (service.cleanup) {
          await service.cleanup();
        }
      } catch (error) {
        logger.logError(`ServicesManager.cleanup.${name}`, error);
      }
    }
  }
}

// Create singleton instance
const servicesManager = new ServicesManager();

module.exports = {
  initializeServices: () => servicesManager.initializeServices(),
  getHealthStatus: () => servicesManager.getHealthStatus(),
  getService: (name) => servicesManager.getService(name),
  cleanup: () => servicesManager.cleanup(),
  
  // Direct service exports for convenience
  intercomService: servicesManager.services.intercom,
  exportService: servicesManager.services.export
}; 