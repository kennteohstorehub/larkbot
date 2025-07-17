const axios = require('axios');
const logger = require('../utils/logger');
const config = require('../config');

/**
 * Lark Suite API Service
 * Handles integration with Lark Suite (Feishu) APIs
 */
class LarkService {
  constructor() {
    this.baseURL = 'https://open.feishu.cn/open-apis';
    this.accessToken = null;
    this.tokenExpiry = null;
    this.isInitialized = false;

    // API endpoints
    this.endpoints = {
      auth: '/auth/v3/tenant_access_token/internal',
      users: '/contact/v3/users',
      departments: '/contact/v3/departments',
      messages: '/im/v1/messages',
      documents: '/docx/v1/documents',
      spreadsheets: '/sheets/v3/spreadsheets',
      bots: '/bot/v3/info',
      webhooks: '/bot/v2/hook'
    };
  }

  /**
   * Initialize Lark service
   */
  async initialize() {
    if (this.isInitialized) return;

    logger.info('🦜 Initializing Lark Suite service');

    if (!config.lark.appId || !config.lark.appSecret) {
      logger.warn('🦜 Lark Suite credentials not configured - using mock mode');
      this.isInitialized = true;
      return;
    }

    try {
      // Get access token
      await this.getAccessToken();

      // Test connection
      await this.testConnection();

      this.isInitialized = true;
      logger.info('✅ Lark Suite service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Lark Suite service', { error: error.message });
      throw error;
    }
  }

  /**
   * Get tenant access token
   */
  async getAccessToken() {
    if (this.accessToken && this.tokenExpiry > Date.now()) {
      return this.accessToken;
    }

    logger.info('🔑 Getting Lark Suite access token');

    try {
      const response = await axios.post(`${this.baseURL}${this.endpoints.auth}`, {
        app_id: config.lark.appId,
        app_secret: config.lark.appSecret
      });

      const { code, msg, tenant_access_token, expire } = response.data;

      if (code !== 0) {
        throw new Error(`Lark API error: ${msg}`);
      }

      this.accessToken = tenant_access_token;
      this.tokenExpiry = Date.now() + (expire * 1000) - 60000; // Refresh 1 minute early

      logger.info('✅ Lark Suite access token obtained');
      return this.accessToken;
    } catch (error) {
      logger.error('❌ Failed to get Lark Suite access token', { error: error.message });
      throw error;
    }
  }

  /**
   * Test connection to Lark Suite
   */
  async testConnection() {
    logger.info('🔍 Testing Lark Suite connection');

    try {
      const response = await this.makeRequest('GET', this.endpoints.bots);

      if (response.code === 0) {
        logger.info('✅ Lark Suite connection successful', { bot: response.data });
        return response.data;
      }
      throw new Error(`Connection test failed: ${response.msg}`);
    } catch (error) {
      logger.error('❌ Lark Suite connection test failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Make authenticated request to Lark API
   */
  async makeRequest(method, endpoint, data = null, params = {}) {
    await this.getAccessToken();

    const config = {
      method,
      url: `${this.baseURL}${endpoint}`,
      headers: {
        Authorization: `Bearer ${this.accessToken}`,
        'Content-Type': 'application/json'
      },
      params
    };

    if (data) {
      config.data = data;
    }

    try {
      const response = await axios(config);
      return response.data;
    } catch (error) {
      logger.error('❌ Lark API request failed', {
        method,
        endpoint,
        error: error.response?.data || error.message
      });
      throw error;
    }
  }

  /**
   * Send message to Lark chat
   */
  async sendMessage(chatId, content, messageType = 'text') {
    logger.info('📤 Sending message to Lark chat', { chatId, messageType });

    try {
      const response = await this.makeRequest('POST', this.endpoints.messages, {
        receive_id: chatId,
        msg_type: messageType,
        content: JSON.stringify(content)
      }, {
        receive_id_type: 'chat_id'
      });

      if (response.code === 0) {
        logger.info('✅ Message sent successfully', { messageId: response.data.message_id });
        return response.data;
      }
      throw new Error(`Failed to send message: ${response.msg}`);
    } catch (error) {
      logger.error('❌ Failed to send Lark message', { error: error.message });
      throw error;
    }
  }

  /**
   * Send interactive card message to Lark chat
   */
  async sendInteractiveCard(chatId, cardContent) {
    logger.info('📤 Sending interactive card to Lark chat', { chatId });

    try {
      const response = await this.makeRequest('POST', this.endpoints.messages, {
        receive_id: chatId,
        msg_type: 'interactive',
        content: JSON.stringify(cardContent)
      }, {
        receive_id_type: 'chat_id'
      });

      if (response.code === 0) {
        logger.info('✅ Interactive card sent successfully', { messageId: response.data.message_id });
        return response.data;
      }
      throw new Error(`Failed to send interactive card: ${response.msg}`);
    } catch (error) {
      logger.error('❌ Failed to send Lark interactive card', { error: error.message });
      throw error;
    }
  }

  /**
   * Create document in Lark Docs
   */
  async createDocument(title, content = '') {
    logger.info('📄 Creating Lark document', { title });

    const docData = {
      title,
      content
    };

    try {
      const response = await this.makeRequest('POST', this.endpoints.documents, docData);

      if (response.code === 0) {
        logger.info('✅ Document created successfully', {
          documentId: response.data.document_id,
          url: response.data.url
        });
        return response.data;
      }
      throw new Error(`Failed to create document: ${response.msg}`);
    } catch (error) {
      logger.error('❌ Failed to create Lark document', { error: error.message });
      throw error;
    }
  }

  /**
   * Create spreadsheet in Lark Sheets
   */
  async createSpreadsheet(title, sheets = []) {
    logger.info('📊 Creating Lark spreadsheet', { title });

    const spreadsheetData = {
      title,
      folder_token: '', // Optional: specify folder
      sheets
    };

    try {
      const response = await this.makeRequest('POST', this.endpoints.spreadsheets, spreadsheetData);

      if (response.code === 0) {
        logger.info('✅ Spreadsheet created successfully', {
          spreadsheetId: response.data.spreadsheet_token,
          url: response.data.url
        });
        return response.data;
      }
      throw new Error(`Failed to create spreadsheet: ${response.msg}`);
    } catch (error) {
      logger.error('❌ Failed to create Lark spreadsheet', { error: error.message });
      throw error;
    }
  }

  /**
   * Update spreadsheet data
   */
  async updateSpreadsheetData(spreadsheetToken, range, values) {
    logger.info('📝 Updating spreadsheet data', { spreadsheetToken, range });

    const updateData = {
      range,
      values
    };

    try {
      const endpoint = `${this.endpoints.spreadsheets}/${spreadsheetToken}/values/${range}`;
      const response = await this.makeRequest('PUT', endpoint, updateData);

      if (response.code === 0) {
        logger.info('✅ Spreadsheet updated successfully');
        return response.data;
      }
      throw new Error(`Failed to update spreadsheet: ${response.msg}`);
    } catch (error) {
      logger.error('❌ Failed to update Lark spreadsheet', { error: error.message });
      throw error;
    }
  }

  /**
   * Get user information
   */
  async getUsers(params = {}) {
    logger.info('👥 Getting Lark users', { params });

    try {
      const response = await this.makeRequest('GET', this.endpoints.users, null, params);

      if (response.code === 0) {
        logger.info('✅ Users retrieved successfully', { count: response.data.items?.length });
        return response.data;
      }
      throw new Error(`Failed to get users: ${response.msg}`);
    } catch (error) {
      logger.error('❌ Failed to get Lark users', { error: error.message });
      throw error;
    }
  }

  /**
   * Get departments
   */
  async getDepartments(params = {}) {
    logger.info('🏢 Getting Lark departments', { params });

    try {
      const response = await this.makeRequest('GET', this.endpoints.departments, null, params);

      if (response.code === 0) {
        logger.info('✅ Departments retrieved successfully', { count: response.data.items?.length });
        return response.data;
      }
      throw new Error(`Failed to get departments: ${response.msg}`);
    } catch (error) {
      logger.error('❌ Failed to get Lark departments', { error: error.message });
      throw error;
    }
  }

  /**
   * Export Intercom data to Lark spreadsheet
   */
  async exportToSpreadsheet(data, title, type = 'conversations') {
    logger.info('📊 Exporting data to Lark spreadsheet', {
      title,
      type,
      count: data.length
    });

    try {
      // Create spreadsheet
      const spreadsheet = await this.createSpreadsheet(title);

      // Prepare data for spreadsheet
      const headers = this.getSpreadsheetHeaders(type);
      const rows = this.convertDataToRows(data, type);

      // Update with data
      await this.updateSpreadsheetData(
        spreadsheet.spreadsheet_token,
        'A1:Z1000', // Adjust range as needed
        [headers, ...rows]
      );

      logger.info('✅ Data exported to Lark spreadsheet successfully', {
        spreadsheetId: spreadsheet.spreadsheet_token,
        url: spreadsheet.url
      });

      return {
        spreadsheetId: spreadsheet.spreadsheet_token,
        url: spreadsheet.url,
        rowCount: rows.length
      };
    } catch (error) {
      logger.error('❌ Failed to export to Lark spreadsheet', { error: error.message });
      throw error;
    }
  }

  /**
   * Send Intercom summary to Lark chat
   */
  async sendIntercomSummary(chatId, summary) {
    logger.info('📊 Sending Intercom summary to Lark chat', { chatId });

    const content = {
      text: this.formatSummaryMessage(summary)
    };

    try {
      return await this.sendMessage(chatId, content, 'text');
    } catch (error) {
      logger.error('❌ Failed to send Intercom summary', { error: error.message });
      throw error;
    }
  }

  /**
   * Create Intercom report document
   */
  async createIntercomReport(data, title) {
    logger.info('📄 Creating Intercom report document', { title });

    const content = this.formatReportContent(data);

    try {
      return await this.createDocument(title, content);
    } catch (error) {
      logger.error('❌ Failed to create Intercom report', { error: error.message });
      throw error;
    }
  }

  // Helper methods

  getSpreadsheetHeaders(type) {
    const headers = {
      conversations: [
        'ID', 'Subject', 'State', 'Priority', 'Created', 'Updated',
        'Assignee', 'Customer', 'Tags', 'Message Count'
      ],
      tickets: [
        'ID', 'Subject', 'State', 'Priority', 'Category', 'Created',
        'Updated', 'Assignee', 'Customer', 'Tags'
      ],
      contacts: [
        'ID', 'Name', 'Email', 'Phone', 'Created', 'Last Seen',
        'Location', 'Plan', 'Tags'
      ]
    };

    return headers[type] || headers.conversations;
  }

  convertDataToRows(data, type) {
    return data.map((item) => {
      switch (type) {
        case 'conversations':
          return [
            item.id,
            item.subject || '',
            item.state || '',
            item.priority || '',
            new Date(item.created_at).toISOString(),
            new Date(item.updated_at).toISOString(),
            item.assignee?.name || '',
            item.contacts?.contacts?.[0]?.name || '',
            item.tags?.tags?.map((t) => t.name).join(', ') || '',
            item.conversation_message?.total_count || 0
          ];
        case 'tickets':
          return [
            item.id,
            item.ticket_attributes?.subject || '',
            item.ticket_attributes?.state || '',
            item.ticket_attributes?.priority || '',
            item.ticket_attributes?.category || '',
            new Date(item.created_at).toISOString(),
            new Date(item.updated_at).toISOString(),
            item.assignee?.name || '',
            item.contacts?.contacts?.[0]?.name || '',
            item.tags?.tags?.map((t) => t.name).join(', ') || ''
          ];
        case 'contacts':
          return [
            item.id,
            item.name || '',
            item.email || '',
            item.phone || '',
            new Date(item.created_at).toISOString(),
            item.last_seen_at ? new Date(item.last_seen_at).toISOString() : '',
            `${item.location?.city || ''}, ${item.location?.country || ''}`,
            item.custom_attributes?.plan || '',
            item.tags?.tags?.map((t) => t.name).join(', ') || ''
          ];
        default:
          return Object.values(item);
      }
    });
  }

  formatSummaryMessage(summary) {
    return `📊 Intercom Data Summary

🗓️ Generated: ${new Date(summary.timestamp).toLocaleString()}

📈 Processing Results:
• Conversations: ${summary.processing?.conversations?.total || 0}
• Tickets: ${summary.processing?.tickets?.total || 0}
• Contacts: ${summary.processing?.contacts?.total || 0}

🏷️ Top Categories:
${Object.entries(summary.processing?.conversations?.categories || {})
    .slice(0, 3)
    .map(([cat, count]) => `• ${cat}: ${count}`)
    .join('\n')}

📊 Insights:
• Most Common Category: ${summary.insights?.mostCommonCategory || 'N/A'}
• High Risk Items: ${summary.insights?.highRiskItems || 0}
• Average Urgency: ${summary.insights?.averageUrgencyScore?.toFixed(1) || 'N/A'}

🔧 Processing:
• Filters Applied: ${summary.filters_applied?.join(', ') || 'None'}
• Processors Used: ${summary.processors_used?.join(', ') || 'None'}`;
  }

  formatReportContent(data) {
    // This would create a formatted document content
    // For now, return a simple text format
    return `# Intercom Data Report

Generated: ${new Date().toISOString()}

## Summary
- Total items processed: ${data.length}
- Report generated automatically from Intercom data

## Data Overview
${data.slice(0, 10).map((item, index) =>
    `${index + 1}. ${item.subject || item.name || item.id}`
  ).join('\n')}

${data.length > 10 ? `\n... and ${data.length - 10} more items` : ''}

---
Generated by Intercom-Lark Automation System`;
  }

  /**
   * List all chats where the bot is a member
   */
  async listBotChats(params = {}) {
    logger.info('💬 Getting bot chat groups', { params });

    try {
      const chats = [];
      let hasMore = true;
      let pageToken = '';

      while (hasMore) {
        const response = await this.makeRequest('GET', '/im/v1/chats', null, {
          user_id_type: 'open_id',
          page_size: params.pageSize || 100,
          page_token: pageToken,
          ...params
        });

        if (response.code === 0) {
          const { items, has_more, page_token } = response.data;
          chats.push(...(items || []));
          hasMore = has_more && !params.limit;
          pageToken = page_token;

          // If limit is specified, stop when we have enough
          if (params.limit && chats.length >= params.limit) {
            return {
              success: true,
              chats: chats.slice(0, params.limit),
              totalCount: chats.length
            };
          }
        } else {
          throw new Error(`Failed to list chats: ${response.msg}`);
        }
      }

      logger.info('✅ Bot chat groups retrieved successfully', { count: chats.length });
      return {
        success: true,
        chats,
        totalCount: chats.length
      };
    } catch (error) {
      logger.error('❌ Failed to get bot chat groups', { error: error.message });
      throw error;
    }
  }

  /**
   * Get detailed information about a specific chat
   */
  async getChatInfo(chatId) {
    logger.info('💬 Getting chat info', { chatId });

    try {
      const response = await this.makeRequest('GET', `/im/v1/chats/${chatId}`, null, {
        user_id_type: 'open_id'
      });

      if (response.code === 0) {
        logger.info('✅ Chat info retrieved successfully', { chatId });
        return response.data;
      }
      throw new Error(`Failed to get chat info: ${response.msg}`);
    } catch (error) {
      logger.error('❌ Failed to get chat info', { chatId, error: error.message });
      throw error;
    }
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      initialized: this.isInitialized,
      hasToken: !!this.accessToken,
      tokenExpiry: this.tokenExpiry ? new Date(this.tokenExpiry).toISOString() : null,
      baseURL: this.baseURL,
      lastCheck: new Date().toISOString()
    };
  }

  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Lark service is not initialized. Call initialize() first.');
    }
  }
}

// Create singleton instance
const larkService = new LarkService();

module.exports = larkService;
