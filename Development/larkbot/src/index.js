const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const path = require('path');
const config = require('./config');
const logger = require('./utils/logger');
const { setupRoutes } = require('./routes');
const { initializeServices } = require('./services');

/**
 * Main Application Entry Point
 * Initializes the Intercom-Lark automation system
 */
class Application {
  constructor() {
    this.app = express();
    this.server = null;
    this.isShuttingDown = false;
  }

  /**
   * Initializes the application with middleware and routes
   */
  async initialize() {
    try {
      // Validate configuration
      config.validateConfig();

      logger.info(`Starting ${config.app.name} v${config.app.version}`);
      logger.info(`Environment: ${config.app.environment}`);
      logger.info(`Current Phase: ${config.getCurrentPhase()}`);

      // Setup middleware
      this.setupMiddleware();

      // Initialize services
      await initializeServices();

      // Setup routes
      setupRoutes(this.app);

      // Setup error handling
      this.setupErrorHandling();

      logger.info('Application initialized successfully');
    } catch (error) {
      logger.error('Failed to initialize application:', error);
      process.exit(1);
    }
  }

  /**
   * Sets up Express middleware
   */
  setupMiddleware() {
    // Security middleware
    this.app.use(helmet());

    // CORS configuration
    this.app.use(cors({
      origin: config.isDevelopment() ? true : [], // Configure for production
      credentials: true
    }));

    // Body parsing
    this.app.use(express.json({ limit: '10mb' }));
    this.app.use(express.urlencoded({ extended: true, limit: '10mb' }));

    // Serve static files
    this.app.use(express.static(path.join(__dirname, '..', 'public')));

    // Request logging
    this.app.use((req, res, next) => {
      logger.info(`${req.method} ${req.path}`, {
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });
      next();
    });
  }

  /**
   * Sets up error handling middleware
   */
  setupErrorHandling() {
    // 404 handler
    this.app.use((req, res) => {
      res.status(404).json({
        error: 'Not Found',
        message: `Route ${req.method} ${req.path} not found`
      });
    });

    // Global error handler
    this.app.use((err, req, res, next) => {
      logger.error('Unhandled error:', err);

      const isDev = config.isDevelopment();
      res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
        ...(isDev && { stack: err.stack })
      });
    });
  }

  /**
   * Starts the application server
   */
  async start() {
    try {
      await this.initialize();

      this.server = this.app.listen(config.app.port, () => {
        logger.info(`Server running on port ${config.app.port}`);
        logger.info(`Health check: http://localhost:${config.app.port}/health`);
      });

      // Setup graceful shutdown
      this.setupGracefulShutdown();
    } catch (error) {
      logger.error('Failed to start server:', error);
      process.exit(1);
    }
  }

  /**
   * Sets up graceful shutdown handlers
   */
  setupGracefulShutdown() {
    const shutdown = async (signal) => {
      if (this.isShuttingDown) return;
      this.isShuttingDown = true;

      logger.info(`Received ${signal}. Starting graceful shutdown...`);

      // Close server
      if (this.server) {
        this.server.close(() => {
          logger.info('Server closed');
        });
      }

      // Add cleanup for services here
      try {
        // await cleanupServices();
        logger.info('Services cleaned up');
      } catch (error) {
        logger.error('Error during cleanup:', error);
      }

      process.exit(0);
    };

    process.on('SIGTERM', () => shutdown('SIGTERM'));
    process.on('SIGINT', () => shutdown('SIGINT'));

    // Handle uncaught exceptions
    process.on('uncaughtException', (error) => {
      logger.error('Uncaught Exception:', error);
      shutdown('UNCAUGHT_EXCEPTION');
    });

    process.on('unhandledRejection', (reason, promise) => {
      logger.error('Unhandled Rejection at:', promise, 'reason:', reason);
      shutdown('UNHANDLED_REJECTION');
    });
  }
}

// Start the application if this file is run directly
if (require.main === module) {
  const app = new Application();
  app.start();
}

module.exports = Application;
