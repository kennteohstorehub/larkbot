const express = require('express');
const { intercomService } = require('../services');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Get conversations with pagination
 * GET /api/conversations
 */
router.get('/conversations', async (req, res) => {
  try {
    const {
      page = 1,
      perPage = 50,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      perPage: parseInt(perPage),
      sort,
      order
    };

    const result = await intercomService.getConversations(options);
    
    res.json({
      success: true,
      data: result.conversations,
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        pages: result.pages
      }
    });
  } catch (error) {
    logger.logError('API.getConversations', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get a specific conversation
 * GET /api/conversations/:id
 */
router.get('/conversations/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const conversation = await intercomService.getConversation(id);
    
    res.json({
      success: true,
      data: conversation
    });
  } catch (error) {
    logger.logError('API.getConversation', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get tickets with pagination
 * GET /api/tickets
 */
router.get('/tickets', async (req, res) => {
  try {
    const {
      page = 1,
      perPage = 50,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      perPage: parseInt(perPage),
      sort,
      order
    };

    const result = await intercomService.getTickets(options);
    
    res.json({
      success: true,
      data: result.tickets,
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        pages: result.pages
      }
    });
  } catch (error) {
    logger.logError('API.getTickets', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Get contacts with pagination
 * GET /api/contacts
 */
router.get('/contacts', async (req, res) => {
  try {
    const {
      page = 1,
      perPage = 50,
      sort = 'created_at',
      order = 'desc'
    } = req.query;

    const options = {
      page: parseInt(page),
      perPage: parseInt(perPage),
      sort,
      order
    };

    const result = await intercomService.getContacts(options);
    
    res.json({
      success: true,
      data: result.contacts,
      pagination: {
        page: parseInt(page),
        perPage: parseInt(perPage),
        totalCount: result.totalCount,
        hasMore: result.hasMore,
        pages: result.pages
      }
    });
  } catch (error) {
    logger.logError('API.getContacts', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Bulk extract conversations
 * POST /api/conversations/bulk
 */
router.post('/conversations/bulk', async (req, res) => {
  try {
    const { limit = 1000 } = req.body;
    
    // Set up Server-Sent Events for progress tracking
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Headers': 'Cache-Control'
    });

    const conversations = await intercomService.getAllConversations({
      limit,
      onProgress: (progress) => {
        res.write(`data: ${JSON.stringify({
          type: 'progress',
          ...progress
        })}\n\n`);
      }
    });

    res.write(`data: ${JSON.stringify({
      type: 'complete',
      success: true,
      totalRecords: conversations.length
    })}\n\n`);

    res.end();
  } catch (error) {
    logger.logError('API.bulkConversations', error);
    res.write(`data: ${JSON.stringify({
      type: 'error',
      success: false,
      error: error.message
    })}\n\n`);
    res.end();
  }
});

/**
 * Test Intercom connection
 * GET /api/test-connection
 */
router.get('/test-connection', async (req, res) => {
  try {
    const connectionInfo = await intercomService.testConnection();
    
    res.json({
      success: true,
      connected: true,
      data: connectionInfo,
      rateLimit: intercomService.getRateLimitInfo()
    });
  } catch (error) {
    logger.logError('API.testConnection', error);
    res.status(500).json({
      success: false,
      connected: false,
      error: error.message
    });
  }
});

/**
 * Get rate limit information
 * GET /api/rate-limit
 */
router.get('/rate-limit', async (req, res) => {
  try {
    const rateLimitInfo = intercomService.getRateLimitInfo();
    
    res.json({
      success: true,
      rateLimit: rateLimitInfo
    });
  } catch (error) {
    logger.logError('API.getRateLimit', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Advanced filtering endpoint
 * POST /api/tickets/filter
 */
router.post('/tickets/filter', async (req, res) => {
  try {
    const { filters, limit = 50, page = 1 } = req.body;
    
    logger.info('Advanced ticket filtering requested', { filters, limit, page });
    
    // Get tickets from Intercom
    const tickets = await intercomService.getTickets({ page, perPage: limit });
    
    if (!tickets.tickets || tickets.tickets.length === 0) {
      return res.json({ success: true, data: [], pagination: { total: 0 } });
    }

    // Apply Phase 2 filtering
    const phase2 = require('../phases/phase2');
    await phase2.initialize();
    
    const filteredData = await phase2.applyFilters(tickets.tickets, filters);

    res.json({
      success: true,
      data: filteredData.filtered,
      pagination: {
        page,
        perPage: limit,
        totalCount: filteredData.filtered.length,
        hasMore: false
      },
      filterSummary: filteredData.summary
    });

  } catch (error) {
    logger.error('Advanced filtering failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * Custom attribute filtering endpoint
 * POST /api/tickets/custom-filter
 */
router.post('/tickets/custom-filter', async (req, res) => {
  try {
    const { customAttributes, ticketType, matchMode = 'any', limit = 50, page = 1 } = req.body;
    
    logger.info('Custom attribute filtering requested', { customAttributes, ticketType, matchMode, limit, page });
    
    // Get tickets from Intercom
    const tickets = await intercomService.getTickets({ page, perPage: limit });
    
    if (!tickets.tickets || tickets.tickets.length === 0) {
      return res.json({ success: true, data: [], pagination: { total: 0 } });
    }

    // Apply Phase 2 filtering
    const phase2 = require('../phases/phase2');
    await phase2.initialize();
    
    const filterConfig = {};
    
    if (customAttributes) {
      filterConfig.customAttributes = {
        attributes: customAttributes,
        matchMode
      };
    }
    
    if (ticketType) {
      filterConfig.ticketType = ticketType;
    }
    
    const filteredData = await phase2.applyFilters(tickets.tickets, filterConfig);

    res.json({
      success: true,
      data: filteredData.filtered,
      pagination: {
        page,
        perPage: limit,
        totalCount: filteredData.filtered.length,
        hasMore: false
      },
      filterSummary: filteredData.summary
    });

  } catch (error) {
    logger.error('Custom attribute filtering failed', { error: error.message });
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router; 