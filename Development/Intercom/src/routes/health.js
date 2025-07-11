const express = require('express');
const { getHealthStatus } = require('../services');
const config = require('../config');

const router = express.Router();

/**
 * Basic health check endpoint
 * GET /health
 */
router.get('/', async (req, res) => {
  try {
    const healthStatus = getHealthStatus();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: config.app.environment,
      phase: config.getCurrentPhase(),
      services: healthStatus.services
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Detailed health check endpoint
 * GET /health/detailed
 */
router.get('/detailed', async (req, res) => {
  try {
    const healthStatus = getHealthStatus();
    
    res.json({
      status: 'ok',
      timestamp: new Date().toISOString(),
      application: {
        name: config.app.name,
        version: config.app.version,
        environment: config.app.environment,
        uptime: process.uptime(),
        phase: config.getCurrentPhase()
      },
      system: {
        nodeVersion: process.version,
        platform: process.platform,
        memory: process.memoryUsage(),
        cpuUsage: process.cpuUsage()
      },
      services: healthStatus.services,
      features: config.features
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Service-specific health check
 * GET /health/service/:serviceName
 */
router.get('/service/:serviceName', async (req, res) => {
  try {
    const { serviceName } = req.params;
    const healthStatus = getHealthStatus();
    
    if (!healthStatus.services[serviceName]) {
      return res.status(404).json({
        status: 'error',
        message: `Service '${serviceName}' not found`
      });
    }
    
    res.json({
      status: 'ok',
      service: serviceName,
      timestamp: new Date().toISOString(),
      details: healthStatus.services[serviceName]
    });
  } catch (error) {
    res.status(503).json({
      status: 'error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

module.exports = router; 