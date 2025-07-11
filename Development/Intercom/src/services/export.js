const fs = require('fs').promises;
const path = require('path');
const csvWriter = require('csv-writer');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Export Service
 * Handles data export in various formats (JSON, CSV, etc.)
 */
class ExportService {
  constructor() {
    this.isInitialized = false;
    this.outputDir = config.export.outputDir;
    this.supportedFormats = config.export.supportedFormats;
  }

  /**
   * Initializes the export service
   */
  async initialize() {
    try {
      // Create output directory if it doesn't exist
      await this.ensureOutputDirectory();
      
      this.isInitialized = true;
      logger.info('Export service initialized successfully', {
        outputDir: this.outputDir,
        supportedFormats: this.supportedFormats
      });
    } catch (error) {
      logger.logError('ExportService.initialize', error);
      throw error;
    }
  }

  /**
   * Ensures the output directory exists
   */
  async ensureOutputDirectory() {
    try {
      await fs.access(this.outputDir);
    } catch (error) {
      // Directory doesn't exist, create it
      await fs.mkdir(this.outputDir, { recursive: true });
      logger.info('Created output directory', { outputDir: this.outputDir });
    }
  }

  /**
   * Exports data to JSON format
   * @param {Array|Object} data - Data to export
   * @param {string} filename - Output filename (without extension)
   * @param {Object} options - Export options
   * @returns {Promise<string>} File path
   */
  async exportToJSON(data, filename, options = {}) {
    this.ensureInitialized();

    const { pretty = true, metadata = {} } = options;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fullFilename = `${filename}_${timestamp}.json`;
    const filepath = path.join(this.outputDir, fullFilename);

    const exportData = {
      metadata: {
        exportedAt: new Date().toISOString(),
        totalRecords: Array.isArray(data) ? data.length : 1,
        format: 'json',
        ...metadata
      },
      data
    };

    try {
      const jsonString = pretty ? JSON.stringify(exportData, null, 2) : JSON.stringify(exportData);
      await fs.writeFile(filepath, jsonString, 'utf8');
      
      logger.info('Data exported to JSON', {
        filename: fullFilename,
        filepath,
        records: exportData.metadata.totalRecords,
        sizeKB: Math.round(Buffer.byteLength(jsonString, 'utf8') / 1024)
      });

      return filepath;
    } catch (error) {
      logger.logError('ExportService.exportToJSON', error, { filename, filepath });
      throw error;
    }
  }

  /**
   * Exports data to CSV format
   * @param {Array} data - Array of objects to export
   * @param {string} filename - Output filename (without extension)
   * @param {Object} options - Export options
   * @returns {Promise<string>} File path
   */
  async exportToCSV(data, filename, options = {}) {
    this.ensureInitialized();

    if (!Array.isArray(data) || data.length === 0) {
      throw new Error('Data must be a non-empty array for CSV export');
    }

    const { headers = null, flatten = true } = options;
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const fullFilename = `${filename}_${timestamp}.csv`;
    const filepath = path.join(this.outputDir, fullFilename);

    try {
      // Process data for CSV format
      const processedData = flatten ? this.flattenData(data) : data;
      
      // Auto-detect headers if not provided
      const csvHeaders = headers || this.detectHeaders(processedData);
      
      // Create CSV writer
      const writer = csvWriter.createObjectCsvWriter({
        path: filepath,
        header: csvHeaders.map(header => ({
          id: header,
          title: header
        }))
      });

      await writer.writeRecords(processedData);
      
      logger.info('Data exported to CSV', {
        filename: fullFilename,
        filepath,
        records: processedData.length,
        columns: csvHeaders.length
      });

      return filepath;
    } catch (error) {
      logger.logError('ExportService.exportToCSV', error, { filename, filepath });
      throw error;
    }
  }

  /**
   * Exports conversations data with proper formatting
   * @param {Array} conversations - Conversations data
   * @param {string} format - Export format ('json' or 'csv')
   * @param {Object} options - Export options
   * @returns {Promise<string>} File path
   */
  async exportConversations(conversations, format = 'json', options = {}) {
    this.ensureInitialized();

    const filename = `conversations_${conversations.length}_records`;
    const metadata = {
      source: 'Intercom',
      dataType: 'conversations',
      totalRecords: conversations.length,
      extractedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      // Transform conversations for CSV export
      const csvData = conversations.map(conv => this.transformConversationForCSV(conv));
      return await this.exportToCSV(csvData, filename, { ...options, metadata });
    } else {
      return await this.exportToJSON(conversations, filename, { ...options, metadata });
    }
  }

  /**
   * Exports tickets data with proper formatting
   * @param {Array} tickets - Tickets data
   * @param {string} format - Export format ('json' or 'csv')
   * @param {Object} options - Export options
   * @returns {Promise<string>} File path
   */
  async exportTickets(tickets, format = 'json', options = {}) {
    this.ensureInitialized();

    const filename = `tickets_${tickets.length}_records`;
    const metadata = {
      source: 'Intercom',
      dataType: 'tickets',
      totalRecords: tickets.length,
      extractedAt: new Date().toISOString()
    };

    if (format === 'csv') {
      const csvData = tickets.map(ticket => this.transformTicketForCSV(ticket));
      return await this.exportToCSV(csvData, filename, { ...options, metadata });
    } else {
      return await this.exportToJSON(tickets, filename, { ...options, metadata });
    }
  }

  /**
   * Transforms conversation data for CSV export
   * @param {Object} conversation - Conversation object
   * @returns {Object} Flattened conversation data
   */
  transformConversationForCSV(conversation) {
    return {
      id: conversation.id,
      type: conversation.type,
      subject: conversation.subject || '',
      state: conversation.state,
      open: conversation.open,
      read: conversation.read,
      priority: conversation.priority,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      waiting_since: conversation.waiting_since,
      snoozed_until: conversation.snoozed_until,
      assignee_id: conversation.assignee?.id || '',
      assignee_name: conversation.assignee?.name || '',
      assignee_email: conversation.assignee?.email || '',
      contact_id: conversation.contacts?.contacts?.[0]?.id || '',
      contact_name: conversation.contacts?.contacts?.[0]?.name || '',
      contact_email: conversation.contacts?.contacts?.[0]?.email || '',
      conversation_message_count: conversation.conversation_message?.total_count || 0,
      tags: conversation.tags?.tags?.map(tag => tag.name).join(', ') || '',
      source_type: conversation.source?.type || '',
      source_url: conversation.source?.url || '',
      source_author_name: conversation.source?.author?.name || '',
      source_author_email: conversation.source?.author?.email || ''
    };
  }

  /**
   * Transforms ticket data for CSV export
   * @param {Object} ticket - Ticket object
   * @returns {Object} Flattened ticket data
   */
  transformTicketForCSV(ticket) {
    return {
      id: ticket.id,
      type: ticket.type,
      subject: ticket.ticket_attributes?.subject || '',
      state: ticket.ticket_attributes?.state || '',
      priority: ticket.ticket_attributes?.priority || '',
      category: ticket.ticket_attributes?.category || '',
      created_at: ticket.created_at,
      updated_at: ticket.updated_at,
      assignee_id: ticket.assignee?.id || '',
      assignee_name: ticket.assignee?.name || '',
      assignee_email: ticket.assignee?.email || '',
      contact_id: ticket.contacts?.contacts?.[0]?.id || '',
      contact_name: ticket.contacts?.contacts?.[0]?.name || '',
      contact_email: ticket.contacts?.contacts?.[0]?.email || '',
      tags: ticket.tags?.tags?.map(tag => tag.name).join(', ') || ''
    };
  }

  /**
   * Flattens nested object data for CSV export
   * @param {Array} data - Array of objects
   * @returns {Array} Flattened data
   */
  flattenData(data) {
    return data.map(item => this.flattenObject(item));
  }

  /**
   * Flattens a single object
   * @param {Object} obj - Object to flatten
   * @param {string} prefix - Prefix for nested keys
   * @returns {Object} Flattened object
   */
  flattenObject(obj, prefix = '') {
    const flattened = {};
    
    for (const [key, value] of Object.entries(obj)) {
      const newKey = prefix ? `${prefix}.${key}` : key;
      
      if (value && typeof value === 'object' && !Array.isArray(value)) {
        Object.assign(flattened, this.flattenObject(value, newKey));
      } else if (Array.isArray(value)) {
        flattened[newKey] = value.join(', ');
      } else {
        flattened[newKey] = value;
      }
    }
    
    return flattened;
  }

  /**
   * Detects headers from data array
   * @param {Array} data - Array of objects
   * @returns {Array} Headers array
   */
  detectHeaders(data) {
    if (!data || data.length === 0) return [];
    
    const headers = new Set();
    data.forEach(item => {
      Object.keys(item).forEach(key => headers.add(key));
    });
    
    return Array.from(headers);
  }

  /**
   * Lists all exported files
   * @returns {Promise<Array>} Array of file information
   */
  async listExportedFiles() {
    this.ensureInitialized();

    try {
      const files = await fs.readdir(this.outputDir);
      const fileStats = await Promise.all(
        files.map(async (file) => {
          const filepath = path.join(this.outputDir, file);
          const stats = await fs.stat(filepath);
          return {
            filename: file,
            filepath,
            size: stats.size,
            sizeKB: Math.round(stats.size / 1024),
            created: stats.birthtime,
            modified: stats.mtime,
            extension: path.extname(file)
          };
        })
      );

      return fileStats.sort((a, b) => b.modified - a.modified);
    } catch (error) {
      logger.logError('ExportService.listExportedFiles', error);
      throw error;
    }
  }

  /**
   * Deletes old export files
   * @param {number} maxAge - Maximum age in days
   * @returns {Promise<number>} Number of files deleted
   */
  async cleanupOldFiles(maxAge = 7) {
    this.ensureInitialized();

    try {
      const files = await this.listExportedFiles();
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - maxAge);

      let deletedCount = 0;
      
      for (const file of files) {
        if (file.created < cutoffDate) {
          await fs.unlink(file.filepath);
          deletedCount++;
          logger.info('Deleted old export file', {
            filename: file.filename,
            age: Math.round((Date.now() - file.created) / (1000 * 60 * 60 * 24))
          });
        }
      }

      logger.info('Cleanup completed', { deletedCount, maxAge });
      return deletedCount;
    } catch (error) {
      logger.logError('ExportService.cleanupOldFiles', error);
      throw error;
    }
  }

  /**
   * Checks if the service is initialized
   * @throws {Error} If service is not initialized
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Export service is not initialized. Call initialize() first.');
    }
  }

  /**
   * Gets service health status
   * @returns {Object} Health status
   */
  getHealthStatus() {
    return {
      initialized: this.isInitialized,
      outputDir: this.outputDir,
      supportedFormats: this.supportedFormats
    };
  }
}

// Create singleton instance
const exportService = new ExportService();

module.exports = exportService; 