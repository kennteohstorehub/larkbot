const logger = require('../utils/logger');

/**
 * Mock Intercom Service
 * Provides fake data for development and testing when no real token is available
 */
class MockIntercomService {
  constructor() {
    this.isInitialized = false;
    this.rateLimitInfo = {
      remaining: 9500,
      resetTime: Date.now() + 60000,
      lastCheck: Date.now()
    };
  }

  /**
   * Mock initialization
   */
  async initialize() {
    logger.info('🎭 Mock Intercom service initialized (no real API calls)');
    this.isInitialized = true;
  }

  /**
   * Mock connection test
   */
  async testConnection() {
    logger.info('🎭 Mock connection test');
    return {
      id: 'mock_admin_123',
      name: 'Mock Admin',
      email: 'mock.admin@company.com',
      type: 'admin'
    };
  }

  /**
   * Mock conversations data
   */
  async getConversations(options = {}) {
    const { page = 1, perPage = 50 } = options;

    logger.info('🎭 Mock: Getting conversations', { page, perPage });

    // Generate mock conversations
    const conversations = Array.from({ length: Math.min(perPage, 25) }, (_, i) => ({
      id: `mock_conv_${page}_${i + 1}`,
      type: 'conversation',
      subject: `Mock Conversation ${page}-${i + 1}`,
      state: ['open', 'closed', 'snoozed'][Math.floor(Math.random() * 3)],
      open: Math.random() > 0.5,
      read: Math.random() > 0.3,
      priority: ['low', 'normal', 'high'][Math.floor(Math.random() * 3)],
      created_at: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      updated_at: Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000),
      waiting_since: Date.now() - Math.floor(Math.random() * 12 * 60 * 60 * 1000),
      assignee: {
        id: `mock_admin_${Math.floor(Math.random() * 5) + 1}`,
        name: ['Alice Smith', 'Bob Johnson', 'Carol Davis', 'David Wilson', 'Eve Brown'][Math.floor(Math.random() * 5)],
        email: `agent${Math.floor(Math.random() * 5) + 1}@company.com`
      },
      contacts: {
        contacts: [{
          id: `mock_contact_${i + 1}`,
          name: `Customer ${i + 1}`,
          email: `customer${i + 1}@example.com`
        }]
      },
      conversation_message: {
        total_count: Math.floor(Math.random() * 20) + 1
      },
      tags: {
        tags: [
          { name: 'support' },
          { name: 'billing' },
          { name: 'technical' }
        ].slice(0, Math.floor(Math.random() * 3) + 1)
      },
      source: {
        type: ['email', 'chat', 'phone'][Math.floor(Math.random() * 3)],
        url: 'https://mock.intercom.io',
        author: {
          name: `Customer ${i + 1}`,
          email: `customer${i + 1}@example.com`
        }
      }
    }));

    return {
      conversations,
      totalCount: 150, // Mock total
      pages: {
        next: page < 6 ? `page_${page + 1}` : null,
        prev: page > 1 ? `page_${page - 1}` : null
      },
      hasMore: page < 6
    };
  }

  /**
   * Mock single conversation
   */
  async getConversation(conversationId) {
    logger.info('🎭 Mock: Getting conversation', { conversationId });

    const conversations = await this.getConversations({ perPage: 1 });
    return {
      ...conversations.conversations[0],
      id: conversationId
    };
  }

  /**
   * Mock tickets data
   */
  async getTickets(options = {}) {
    const { page = 1, perPage = 50 } = options;

    logger.info('🎭 Mock: Getting tickets', { page, perPage });

    const tickets = Array.from({ length: Math.min(perPage, 20) }, (_, i) => ({
      id: `mock_ticket_${page}_${i + 1}`,
      type: 'ticket',
      ticket_attributes: {
        subject: `Mock Support Ticket ${page}-${i + 1}`,
        state: ['open', 'pending', 'resolved', 'closed'][Math.floor(Math.random() * 4)],
        priority: ['low', 'normal', 'high', 'urgent'][Math.floor(Math.random() * 4)],
        category: ['technical', 'billing', 'general', 'feature_request'][Math.floor(Math.random() * 4)]
      },
      created_at: Date.now() - Math.floor(Math.random() * 14 * 24 * 60 * 60 * 1000),
      updated_at: Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000),
      assignee: {
        id: `mock_agent_${Math.floor(Math.random() * 3) + 1}`,
        name: ['Support Agent 1', 'Support Agent 2', 'Support Agent 3'][Math.floor(Math.random() * 3)],
        email: `support${Math.floor(Math.random() * 3) + 1}@company.com`
      },
      contacts: {
        contacts: [{
          id: `mock_customer_${i + 1}`,
          name: `Customer ${i + 1}`,
          email: `customer${i + 1}@example.com`
        }]
      },
      tags: {
        tags: [
          { name: 'urgent' },
          { name: 'follow-up' },
          { name: 'escalated' }
        ].slice(0, Math.floor(Math.random() * 3))
      },
      custom_attributes: {
        department: ['engineering', 'sales', 'marketing', 'support'][Math.floor(Math.random() * 4)],
        priority: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        team: ['frontend', 'backend', 'devops', 'qa'][Math.floor(Math.random() * 4)],
        customer_tier: ['free', 'pro', 'enterprise'][Math.floor(Math.random() * 3)],
        issue_type: ['bug', 'feature', 'billing', 'technical'][Math.floor(Math.random() * 4)],
        severity: ['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)],
        source_system: ['web', 'mobile', 'api', 'integration'][Math.floor(Math.random() * 4)],
        region: ['us-east', 'us-west', 'eu', 'asia'][Math.floor(Math.random() * 4)]
      }
    }));

    return {
      tickets,
      totalCount: 80, // Mock total
      pages: {
        next: page < 4 ? `page_${page + 1}` : null,
        prev: page > 1 ? `page_${page - 1}` : null
      },
      hasMore: page < 4
    };
  }

  /**
   * Mock contacts data
   */
  async getContacts(options = {}) {
    const { page = 1, perPage = 50 } = options;

    logger.info('🎭 Mock: Getting contacts', { page, perPage });

    const contacts = Array.from({ length: Math.min(perPage, 30) }, (_, i) => ({
      id: `mock_contact_${page}_${i + 1}`,
      type: 'contact',
      name: `Customer ${page}-${i + 1}`,
      email: `customer${page}_${i + 1}@example.com`,
      phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
      created_at: Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000),
      updated_at: Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000),
      last_seen_at: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
      location: {
        country: ['United States', 'Canada', 'United Kingdom', 'Australia'][Math.floor(Math.random() * 4)],
        city: ['New York', 'Toronto', 'London', 'Sydney'][Math.floor(Math.random() * 4)]
      },
      custom_attributes: {
        plan: ['free', 'pro', 'enterprise'][Math.floor(Math.random() * 3)],
        signup_date: Date.now() - Math.floor(Math.random() * 365 * 24 * 60 * 60 * 1000)
      },
      tags: {
        tags: [
          { name: 'vip' },
          { name: 'trial' },
          { name: 'churned' }
        ].slice(0, Math.floor(Math.random() * 2))
      }
    }));

    return {
      contacts,
      totalCount: 200, // Mock total
      pages: {
        next: page < 7 ? `page_${page + 1}` : null,
        prev: page > 1 ? `page_${page - 1}` : null
      },
      hasMore: page < 7
    };
  }

  /**
   * Mock bulk conversation extraction
   */
  async getAllConversations(options = {}) {
    const { limit = 1000, onProgress } = options;

    logger.info('🎭 Mock: Getting all conversations', { limit });

    const allConversations = [];
    let page = 1;
    const perPage = 50;

    while (allConversations.length < limit) {
      const result = await this.getConversations({ page, perPage });
      allConversations.push(...result.conversations);

      if (onProgress) {
        onProgress({
          current: allConversations.length,
          total: Math.min(limit, 150),
          page
        });
      }

      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 100));

      if (!result.hasMore || allConversations.length >= limit) break;
      page++;
    }

    return allConversations.slice(0, limit);
  }

  /**
   * Mock rate limit info
   */
  getRateLimitInfo() {
    return { ...this.rateLimitInfo };
  }

  /**
   * Mock health status
   */
  getHealthStatus() {
    return {
      initialized: this.isInitialized,
      rateLimit: this.rateLimitInfo,
      lastCheck: new Date(this.rateLimitInfo.lastCheck).toISOString(),
      mode: 'MOCK'
    };
  }

  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Mock Intercom service is not initialized. Call initialize() first.');
    }
  }
}

// Create singleton instance
const mockIntercomService = new MockIntercomService();

module.exports = mockIntercomService;
