const { IntercomClient } = require('intercom-client');
const config = require('../config');
const logger = require('../utils/logger');

/**
 * Intercom Service
 * Handles all interactions with the Intercom API
 */
class IntercomService {
  constructor() {
    this.client = null;
    this.isInitialized = false;
    this.rateLimitInfo = {
      remaining: 10000,
      resetTime: null,
      lastCheck: null
    };
  }

  /**
   * Initializes the Intercom client
   */
  async initialize() {
    try {
      if (!config.intercom.token) {
        throw new Error('Intercom token is required');
      }

      this.client = new IntercomClient({
        tokenAuth: { token: config.intercom.token }
      });

      // Test connection
      await this.testConnection();
      
      this.isInitialized = true;
      logger.info('Intercom service initialized successfully');
    } catch (error) {
      logger.logError('IntercomService.initialize', error);
      throw error;
    }
  }

  /**
   * Tests the connection to Intercom API
   */
  async testConnection() {
    try {
      const startTime = Date.now();
      logger.logApiRequest('Intercom', 'GET', '/me');
      
      const response = await this.client.admins.me();
      const duration = Date.now() - startTime;
      
      logger.logApiResponse('Intercom', 'GET', '/me', 200, response);
      logger.logPerformance('Intercom.testConnection', duration);
      
      logger.info('Intercom connection successful', {
        adminName: response.name,
        adminEmail: response.email,
        appId: config.intercom.appId
      });
      
      return response;
    } catch (error) {
      logger.logError('IntercomService.testConnection', error);
      throw error;
    }
  }

  /**
   * Checks if the service is initialized
   * @throws {Error} If service is not initialized
   */
  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Intercom service is not initialized. Call initialize() first.');
    }
  }

  /**
   * Checks rate limit status and waits if necessary
   */
  async checkRateLimit() {
    if (this.rateLimitInfo.remaining <= 100) {
      const waitTime = this.rateLimitInfo.resetTime - Date.now();
      if (waitTime > 0) {
        logger.warn(`Rate limit approaching. Waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
  }

  /**
   * Updates rate limit information from response headers
   * @param {Object} response - HTTP response object
   */
  updateRateLimitInfo(response) {
    if (response.headers) {
      this.rateLimitInfo = {
        remaining: parseInt(response.headers['x-ratelimit-remaining']) || this.rateLimitInfo.remaining,
        resetTime: parseInt(response.headers['x-ratelimit-reset']) * 1000 || this.rateLimitInfo.resetTime,
        lastCheck: Date.now()
      };
    }
  }

  /**
   * Retrieves conversations with pagination support
   * @param {Object} options - Query options
   * @param {number} options.page - Page number (default: 1)
   * @param {number} options.perPage - Items per page (default: 50, max: 150)
   * @param {string} options.sort - Sort order ('created_at' or 'updated_at')
   * @param {string} options.order - Sort direction ('asc' or 'desc')
   * @returns {Promise<Object>} Conversations data
   */
  async getConversations(options = {}) {
    this.ensureInitialized();
    await this.checkRateLimit();

    const params = {
      page: options.page || 1,
      per_page: Math.min(options.perPage || 50, 150),
      sort: options.sort || 'created_at',
      order: options.order || 'desc'
    };

    try {
      const startTime = Date.now();
      logger.logApiRequest('Intercom', 'GET', '/conversations', params);

      const response = await this.client.conversations.list(params);
      const duration = Date.now() - startTime;

      logger.logApiResponse('Intercom', 'GET', '/conversations', 200, response);
      logger.logPerformance('Intercom.getConversations', duration, {
        page: params.page,
        perPage: params.per_page,
        totalCount: response.total_count
      });

      this.updateRateLimitInfo(response);

      return {
        conversations: response.conversations || [],
        totalCount: response.total_count || 0,
        pages: response.pages || {},
        hasMore: response.pages?.next !== null
      };
    } catch (error) {
      logger.logError('IntercomService.getConversations', error, { params });
      throw error;
    }
  }

  /**
   * Retrieves a specific conversation by ID
   * @param {string} conversationId - Conversation ID
   * @returns {Promise<Object>} Conversation data
   */
  async getConversation(conversationId) {
    this.ensureInitialized();
    await this.checkRateLimit();

    try {
      const startTime = Date.now();
      logger.logApiRequest('Intercom', 'GET', `/conversations/${conversationId}`);

      const response = await this.client.conversations.find({ id: conversationId });
      const duration = Date.now() - startTime;

      logger.logApiResponse('Intercom', 'GET', `/conversations/${conversationId}`, 200, response);
      logger.logPerformance('Intercom.getConversation', duration, { conversationId });

      return response;
    } catch (error) {
      logger.logError('IntercomService.getConversation', error, { conversationId });
      throw error;
    }
  }

  /**
   * Retrieves tickets (Help Desk conversations)
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Tickets data
   */
  async getTickets(options = {}) {
    this.ensureInitialized();
    await this.checkRateLimit();

    const params = {
      page: options.page || 1,
      per_page: Math.min(options.perPage || 50, 150),
      sort: options.sort || 'created_at',
      order: options.order || 'desc'
    };

    try {
      const startTime = Date.now();
      logger.logApiRequest('Intercom', 'GET', '/tickets', params);

      const response = await this.client.tickets.list(params);
      const duration = Date.now() - startTime;

      logger.logApiResponse('Intercom', 'GET', '/tickets', 200, response);
      logger.logPerformance('Intercom.getTickets', duration, {
        page: params.page,
        perPage: params.per_page,
        totalCount: response.total_count
      });

      this.updateRateLimitInfo(response);

      return {
        tickets: response.tickets || [],
        totalCount: response.total_count || 0,
        pages: response.pages || {},
        hasMore: response.pages?.next !== null
      };
    } catch (error) {
      logger.logError('IntercomService.getTickets', error, { params });
      throw error;
    }
  }

  /**
   * Retrieves contacts with pagination support
   * @param {Object} options - Query options
   * @returns {Promise<Object>} Contacts data
   */
  async getContacts(options = {}) {
    this.ensureInitialized();
    await this.checkRateLimit();

    const params = {
      page: options.page || 1,
      per_page: Math.min(options.perPage || 50, 150),
      sort: options.sort || 'created_at',
      order: options.order || 'desc'
    };

    try {
      const startTime = Date.now();
      logger.logApiRequest('Intercom', 'GET', '/contacts', params);

      const response = await this.client.contacts.list(params);
      const duration = Date.now() - startTime;

      logger.logApiResponse('Intercom', 'GET', '/contacts', 200, response);
      logger.logPerformance('Intercom.getContacts', duration, {
        page: params.page,
        perPage: params.per_page,
        totalCount: response.total_count
      });

      this.updateRateLimitInfo(response);

      return {
        contacts: response.contacts || [],
        totalCount: response.total_count || 0,
        pages: response.pages || {},
        hasMore: response.pages?.next !== null
      };
    } catch (error) {
      logger.logError('IntercomService.getContacts', error, { params });
      throw error;
    }
  }

  /**
   * Retrieves all conversations with automatic pagination
   * @param {Object} options - Query options
   * @param {number} options.limit - Maximum number of items to retrieve (default: 1000)
   * @param {Function} options.onProgress - Progress callback function
   * @returns {Promise<Array>} All conversations
   */
  async getAllConversations(options = {}) {
    const { limit = 1000, onProgress } = options;
    const allConversations = [];
    let page = 1;
    let hasMore = true;
    const perPage = 150; // Maximum allowed

    logger.logProcessing('Phase1', 'Starting bulk conversation extraction', { limit });

    while (hasMore && allConversations.length < limit) {
      try {
        const response = await this.getConversations({ page, perPage });
        
        allConversations.push(...response.conversations);
        hasMore = response.hasMore;
        page++;

        // Call progress callback if provided
        if (onProgress) {
          onProgress({
            current: allConversations.length,
            total: Math.min(response.totalCount, limit),
            page: page - 1
          });
        }

        logger.logProcessing('Phase1', 'Conversations extracted', {
          page: page - 1,
          extracted: allConversations.length,
          total: response.totalCount
        });

        // Break if we've reached the limit
        if (allConversations.length >= limit) {
          break;
        }

        // Small delay to be respectful to the API
        await new Promise(resolve => setTimeout(resolve, 100));

      } catch (error) {
        logger.logError('IntercomService.getAllConversations', error, { page });
        throw error;
      }
    }

    logger.logProcessing('Phase1', 'Bulk conversation extraction completed', {
      totalExtracted: allConversations.length,
      pages: page - 1
    });

    return allConversations.slice(0, limit);
  }

  /**
   * Gets rate limit information
   * @returns {Object} Rate limit info
   */
  getRateLimitInfo() {
    return { ...this.rateLimitInfo };
  }

  /**
   * Gets service health status
   * @returns {Object} Health status
   */
  getHealthStatus() {
    return {
      initialized: this.isInitialized,
      rateLimit: this.rateLimitInfo,
      lastCheck: new Date(this.rateLimitInfo.lastCheck).toISOString()
    };
  }
}

// Create singleton instance
const intercomService = new IntercomService();

module.exports = intercomService; 