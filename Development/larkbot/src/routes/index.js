const express = require('express');
const path = require('path');
const healthRoutes = require('./health');
const apiRoutes = require('./api');
const exportRoutes = require('./export');
const webhookRoutes = require('./webhook');
const logger = require('../utils/logger');

/**
 * Sets up all application routes
 * @param {express.Application} app - Express application instance
 */
function setupRoutes(app) {
  // Health check routes
  app.use('/health', healthRoutes);

  // API routes
  app.use('/api', apiRoutes);

  // Export routes
  app.use('/export', exportRoutes);

  // Webhook routes
  app.use('/webhook', webhookRoutes);

  // Root route - serve HTML if available, otherwise return JSON
  app.get('/', (req, res) => {
    const htmlPath = path.join(__dirname, '..', '..', 'public', 'index.html');
    const fs = require('fs');
    
    // Check if HTML file exists
    if (fs.existsSync(htmlPath)) {
      res.sendFile(htmlPath);
    } else {
      // Fallback to JSON response
      res.json({
        message: 'Intercom-Lark Automation API',
        version: '1.0.0',
        endpoints: {
          health: '/health',
          api: '/api',
          export: '/export',
          webhook: '/webhook'
        },
        documentation: 'See PRD.md for detailed documentation'
      });
    }
  });

  logger.info('Routes setup completed');
}

module.exports = { setupRoutes };
