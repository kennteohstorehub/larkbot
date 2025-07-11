const winston = require('winston');
const path = require('path');
const config = require('../config');

/**
 * Creates a Winston logger instance with appropriate transports and formatting
 */
const createLogger = () => {
  // Define log format
  const logFormat = winston.format.combine(
    winston.format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    winston.format.errors({ stack: true }),
    winston.format.json()
  );

  // Console format for development
  const consoleFormat = winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({
      format: 'HH:mm:ss'
    }),
    winston.format.printf(({ timestamp, level, message, ...meta }) => {
      let log = `${timestamp} [${level}]: ${message}`;
      
      // Add metadata if present
      if (Object.keys(meta).length > 0) {
        log += ` ${JSON.stringify(meta)}`;
      }
      
      return log;
    })
  );

  // Define transports
  const transports = [];

  // Console transport
  transports.push(
    new winston.transports.Console({
      format: config.isDevelopment() ? consoleFormat : logFormat,
      level: config.app.logLevel
    })
  );

  // File transports for production
  if (config.isProduction()) {
    // Create logs directory if it doesn't exist
    const logsDir = path.join(__dirname, '../../logs');
    
    // General log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'application.log'),
        format: logFormat,
        level: 'info',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );

    // Error log file
    transports.push(
      new winston.transports.File({
        filename: path.join(logsDir, 'error.log'),
        format: logFormat,
        level: 'error',
        maxsize: 5242880, // 5MB
        maxFiles: 5
      })
    );
  }

  // Create and return logger
  return winston.createLogger({
    level: config.app.logLevel,
    format: logFormat,
    transports,
    exitOnError: false
  });
};

// Create logger instance
const logger = createLogger();

/**
 * Logs API requests for debugging
 * @param {string} service - Service name (e.g., 'Intercom', 'Lark')
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {Object} data - Request data
 */
logger.logApiRequest = (service, method, url, data = {}) => {
  if (config.app.debugMode) {
    logger.debug(`[${service}] ${method} ${url}`, {
      service,
      method,
      url,
      data: typeof data === 'object' ? JSON.stringify(data) : data
    });
  }
};

/**
 * Logs API responses for debugging
 * @param {string} service - Service name
 * @param {string} method - HTTP method
 * @param {string} url - Request URL
 * @param {number} status - Response status code
 * @param {Object} data - Response data
 */
logger.logApiResponse = (service, method, url, status, data = {}) => {
  if (config.app.debugMode) {
    logger.debug(`[${service}] ${method} ${url} - ${status}`, {
      service,
      method,
      url,
      status,
      responseSize: JSON.stringify(data).length
    });
  }
};

/**
 * Logs performance metrics
 * @param {string} operation - Operation name
 * @param {number} duration - Duration in milliseconds
 * @param {Object} metadata - Additional metadata
 */
logger.logPerformance = (operation, duration, metadata = {}) => {
  logger.info(`Performance: ${operation} took ${duration}ms`, {
    operation,
    duration,
    ...metadata
  });
};

/**
 * Logs data processing events
 * @param {string} phase - Processing phase
 * @param {string} action - Action performed
 * @param {Object} stats - Processing statistics
 */
logger.logProcessing = (phase, action, stats = {}) => {
  logger.info(`Processing: ${phase} - ${action}`, {
    phase,
    action,
    ...stats
  });
};

/**
 * Logs error with additional context
 * @param {string} context - Error context
 * @param {Error} error - Error object
 * @param {Object} metadata - Additional metadata
 */
logger.logError = (context, error, metadata = {}) => {
  logger.error(`Error in ${context}: ${error.message}`, {
    context,
    error: error.message,
    stack: error.stack,
    ...metadata
  });
};

module.exports = logger; 