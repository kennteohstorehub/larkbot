const express = require('express');
const { intercomService, exportService } = require('../services');
const logger = require('../utils/logger');

const router = express.Router();

/**
 * Export conversations to specified format
 * POST /export/conversations
 */
router.post('/conversations', async (req, res) => {
  try {
    const {
      format = 'json',
      limit = 100,
      page = 1,
      perPage = 50
    } = req.body;

    // Validate format
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Format must be either "json" or "csv"'
      });
    }

    logger.info('Starting conversation export', { format, limit, page, perPage });

    // Get conversations
    const conversations = await intercomService.getAllConversations({
      limit: Math.min(limit, 1000) // Cap at 1000 for safety
    });

    // Export to specified format
    const filepath = await exportService.exportConversations(conversations, format);

    res.json({
      success: true,
      message: `Exported ${conversations.length} conversations to ${format.toUpperCase()}`,
      data: {
        recordCount: conversations.length,
        format,
        filepath: filepath.split('/').pop(), // Only return filename for security
        exportedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.logError('Export.conversations', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Export tickets to specified format
 * POST /export/tickets
 */
router.post('/tickets', async (req, res) => {
  try {
    const {
      format = 'json',
      limit = 100,
      page = 1,
      perPage = 50
    } = req.body;

    // Validate format
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Format must be either "json" or "csv"'
      });
    }

    logger.info('Starting ticket export', { format, limit, page, perPage });

    // Get tickets with pagination
    const allTickets = [];
    let currentPage = page;
    let hasMore = true;

    while (hasMore && allTickets.length < limit) {
      const result = await intercomService.getTickets({
        page: currentPage,
        perPage: Math.min(perPage, 150)
      });

      allTickets.push(...result.tickets);
      hasMore = result.hasMore;
      currentPage++;

      if (allTickets.length >= limit) break;
    }

    const tickets = allTickets.slice(0, limit);

    // Export to specified format
    const filepath = await exportService.exportTickets(tickets, format);

    res.json({
      success: true,
      message: `Exported ${tickets.length} tickets to ${format.toUpperCase()}`,
      data: {
        recordCount: tickets.length,
        format,
        filepath: filepath.split('/').pop(),
        exportedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.logError('Export.tickets', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Export contacts to specified format
 * POST /export/contacts
 */
router.post('/contacts', async (req, res) => {
  try {
    const {
      format = 'json',
      limit = 100,
      page = 1,
      perPage = 50
    } = req.body;

    // Validate format
    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Format must be either "json" or "csv"'
      });
    }

    logger.info('Starting contact export', { format, limit, page, perPage });

    // Get contacts with pagination
    const allContacts = [];
    let currentPage = page;
    let hasMore = true;

    while (hasMore && allContacts.length < limit) {
      const result = await intercomService.getContacts({
        page: currentPage,
        perPage: Math.min(perPage, 150)
      });

      allContacts.push(...result.contacts);
      hasMore = result.hasMore;
      currentPage++;

      if (allContacts.length >= limit) break;
    }

    const contacts = allContacts.slice(0, limit);

    // Export to specified format
    const filepath = format === 'csv' 
      ? await exportService.exportToCSV(contacts, 'contacts')
      : await exportService.exportToJSON(contacts, 'contacts');

    res.json({
      success: true,
      message: `Exported ${contacts.length} contacts to ${format.toUpperCase()}`,
      data: {
        recordCount: contacts.length,
        format,
        filepath: filepath.split('/').pop(),
        exportedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.logError('Export.contacts', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * List all exported files
 * GET /export/files
 */
router.get('/files', async (req, res) => {
  try {
    const files = await exportService.listExportedFiles();
    
    res.json({
      success: true,
      data: files.map(file => ({
        filename: file.filename,
        size: file.size,
        sizeKB: file.sizeKB,
        created: file.created,
        modified: file.modified,
        extension: file.extension
      }))
    });
  } catch (error) {
    logger.logError('Export.listFiles', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Cleanup old exported files
 * DELETE /export/cleanup
 */
router.delete('/cleanup', async (req, res) => {
  try {
    const { maxAge = 7 } = req.body;
    
    const deletedCount = await exportService.cleanupOldFiles(maxAge);
    
    res.json({
      success: true,
      message: `Cleaned up ${deletedCount} old files`,
      data: {
        deletedCount,
        maxAge
      }
    });
  } catch (error) {
    logger.logError('Export.cleanup', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Custom data export with filtering
 * POST /export/custom
 */
router.post('/custom', async (req, res) => {
  try {
    const {
      dataType = 'conversations',
      format = 'json',
      filters = {},
      limit = 100,
      filename = null
    } = req.body;

    // Validate inputs
    if (!['conversations', 'tickets', 'contacts'].includes(dataType)) {
      return res.status(400).json({
        success: false,
        error: 'dataType must be one of: conversations, tickets, contacts'
      });
    }

    if (!['json', 'csv'].includes(format)) {
      return res.status(400).json({
        success: false,
        error: 'Format must be either "json" or "csv"'
      });
    }

    logger.info('Starting custom export', { dataType, format, filters, limit });

    let data = [];
    let filepath = '';

    // Get data based on type
    switch (dataType) {
      case 'conversations':
        data = await intercomService.getAllConversations({ limit });
        filepath = await exportService.exportConversations(data, format);
        break;
      case 'tickets':
        const ticketResult = await intercomService.getTickets({ perPage: limit });
        data = ticketResult.tickets;
        filepath = await exportService.exportTickets(data, format);
        break;
      case 'contacts':
        const contactResult = await intercomService.getContacts({ perPage: limit });
        data = contactResult.contacts;
        filepath = format === 'csv' 
          ? await exportService.exportToCSV(data, 'contacts')
          : await exportService.exportToJSON(data, 'contacts');
        break;
    }

    res.json({
      success: true,
      message: `Exported ${data.length} ${dataType} to ${format.toUpperCase()}`,
      data: {
        dataType,
        recordCount: data.length,
        format,
        filepath: filepath.split('/').pop(),
        exportedAt: new Date().toISOString()
      }
    });
  } catch (error) {
    logger.logError('Export.custom', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router; 