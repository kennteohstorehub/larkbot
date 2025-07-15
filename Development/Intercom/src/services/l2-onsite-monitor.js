const logger = require('../utils/logger');
const larkService = require('./lark');
const intercomService = require('./intercom');

/**
 * L2 Onsite Support Monitoring Service
 * Specialized service for monitoring and processing L2 onsite support tickets
 */
class L2OnsiteMonitor {
  constructor() {
    this.targetTeamId = '5372074'; // L2 Onsite Support Team
    this.targetOnsiteTypes = [
      'New & Existing Merchant site inspection', // EXACT match from your data
      'Site inspection New and Existing merchants',
      '🔍 Site inspection New and Existing merchants',
      'site inspection',
      'Site Inspection'
    ];
    this.monitoredTicketTypes = [
      'L2 Onsite Support',
      'Onsite Support',
      'Hardware Installation',
      'Site Inspection'
    ];
  }

  /**
   * Check if a conversation/ticket is an L2 onsite support ticket
   * @param {Object} conversation - Intercom conversation object
   * @returns {boolean} - True if it's an L2 onsite support ticket
   */
  isL2OnsiteTicket(conversation) {
    // Check team assignment
    const teamMatch = conversation.team_assignee_id === this.targetTeamId || 
                     conversation.team_assignee_id === parseInt(this.targetTeamId);
    
    // Check ticket type
    const ticketTypeMatch = conversation.ticket?.ticket_type === 'L2 Onsite Support';
    
    // Check custom attributes
    const customAttrs = conversation.custom_attributes || {};
    const tierSupport = customAttrs['🔧Tier 2 Support Type'];
    const tierMatch = tierSupport && tierSupport.includes('Onsite Services');
    
    return teamMatch || ticketTypeMatch || tierMatch;
  }

  /**
   * Check if a ticket is a site inspection request
   * @param {Object} conversation - Intercom conversation object
   * @returns {boolean} - True if it's a site inspection request
   */
  isSiteInspectionTicket(conversation) {
    // Check custom attributes
    const customAttrs = conversation.custom_attributes || {};
    const ticketAttrs = conversation.ticket?.custom_attributes || {};
    
    // Check Onsite Request Type
    const onsiteType = customAttrs['Onsite Request Type'] || 
                      ticketAttrs['Onsite Request Type']?.value || '';
    
    // Check for site inspection in various fields
    const titleMatch = (conversation.title || '').toLowerCase().includes('site inspection');
    const bodyMatch = (conversation.source?.body || '').toLowerCase().includes('site inspection');
    const onsiteTypeMatch = this.targetOnsiteTypes.some(type => 
      onsiteType.toLowerCase().includes(type.toLowerCase())
    );
    
    // Check description
    const description = ticketAttrs['Onsite request description']?.value || '';
    const descriptionMatch = description.toLowerCase().includes('site inspection');
    
    return titleMatch || bodyMatch || onsiteTypeMatch || descriptionMatch;
  }

  /**
   * Check if we should process this ticket (SITE INSPECTION ONLY)
   * @param {Object} conversation - Intercom conversation object
   * @returns {boolean} - True if we should process this ticket
   */
  shouldProcessTicket(conversation) {
    // MODIFIED: Only process if it's BOTH L2 onsite AND site inspection
    const isL2 = this.isL2OnsiteTicket(conversation);
    const isSiteInspection = this.isSiteInspectionTicket(conversation);
    
    // Only process if it's a site inspection request
    return isL2 && isSiteInspection;
  }

  /**
   * Extract ticket details for notification
   * @param {Object} conversation - Intercom conversation object
   * @returns {Object} - Formatted ticket details
   */
  extractTicketDetails(conversation) {
    const customAttrs = conversation.custom_attributes || {};
    const ticketAttrs = conversation.ticket?.custom_attributes || {};
    
    return {
      id: conversation.id,
      title: conversation.title || 'L2 Onsite Support Request',
      state: conversation.state,
      priority: conversation.priority,
      created_at: conversation.created_at,
      updated_at: conversation.updated_at,
      
      // Team and assignment
      team_assignee_id: conversation.team_assignee_id,
      admin_assignee_id: conversation.admin_assignee_id,
      
      // Ticket specific attributes
      ticket_type: conversation.ticket?.ticket_type,
      ticket_state: conversation.ticket?.state,
      
      // Custom attributes
      onsiteRequestType: customAttrs['Onsite Request Type'] || ticketAttrs['Onsite Request Type']?.value,
      country: customAttrs['🌎 Country'] || ticketAttrs['Country']?.value,
      merchantName: customAttrs['🆔 Merchant Account Name'] || ticketAttrs['Merchant Account Name']?.value,
      requestor: ticketAttrs['Requestor']?.value,
      requestorDepartment: ticketAttrs['Requestor Department']?.value,
      picName: ticketAttrs['PIC Name']?.value,
      picEmail: ticketAttrs['PIC Email']?.value,
      picContact: ticketAttrs['PIC Contact Number']?.value,
      storeAddress: ticketAttrs['FULL Store Address']?.value,
      description: ticketAttrs['Onsite request description']?.value,
      expressRequest: ticketAttrs['Express Request - 3 hours Onsite Request']?.value,
      
      // Additional context
      businessType: customAttrs['🧸Business Type'],
      reasonForOnsite: customAttrs['📫 Reason for Onsite'],
      tierSupportType: customAttrs['🔧Tier 2 Support Type'],
      
      // URL
      url: conversation.ticket?.url || `https://app.intercom.com/a/apps/***REMOVED***/conversations/${conversation.id}`
    };
  }

  /**
   * Format ticket for Lark notification
   * @param {Object} ticketDetails - Extracted ticket details
   * @returns {string} - Formatted message for Lark
   */
  formatLarkMessage(ticketDetails) {
    const isSiteInspection = this.targetOnsiteTypes.some(type => 
      (ticketDetails.onsiteRequestType || '').toLowerCase().includes(type.toLowerCase())
    );
    
    const urgencyIcon = ticketDetails.expressRequest ? '🚨' : '📋';
    const typeIcon = isSiteInspection ? '🔍' : '🔧';
    
    let message = `${urgencyIcon} ${typeIcon} **L2 Onsite Support Request**\n\n`;
    
    // ENHANCED: Add express request alert at the top if it's an express request
    if (ticketDetails.expressRequest) {
      message += `🚨🚨🚨 **URGENT - EXPRESS REQUEST** 🚨🚨🚨\n`;
      message += `⏰ **3 HOURS ONSITE REQUEST** ⏰\n\n`;
    }
    
    if (isSiteInspection) {
      message += `🎯 **SITE INSPECTION REQUEST** - Priority Alert!\n\n`;
    }
    
    message += `**Ticket ID:** ${ticketDetails.id}\n`;
    message += `**Type:** ${ticketDetails.onsiteRequestType || 'L2 Onsite Support'}\n`;
    message += `**State:** ${ticketDetails.state || ticketDetails.ticket_state}\n`;
    
    // ENHANCED: Show express request status prominently
    if (ticketDetails.expressRequest !== undefined) {
      message += `**Express Request:** ${ticketDetails.expressRequest ? '🚨 YES - 3 HOURS' : '⏱️ NO - STANDARD'}\n`;
    }
    
    if (ticketDetails.merchantName) {
      message += `**Merchant:** ${ticketDetails.merchantName}\n`;
    }
    
    if (ticketDetails.country) {
      message += `**Country:** ${ticketDetails.country}\n`;
    }
    
    if (ticketDetails.requestor) {
      message += `**Requestor:** ${ticketDetails.requestor}`;
      if (ticketDetails.requestorDepartment) {
        message += ` (${ticketDetails.requestorDepartment})`;
      }
      message += `\n`;
    }
    
    if (ticketDetails.picName) {
      message += `**PIC:** ${ticketDetails.picName}\n`;
      if (ticketDetails.picEmail) {
        message += `**Email:** ${ticketDetails.picEmail}\n`;
      }
      if (ticketDetails.picContact) {
        message += `**Contact:** ${ticketDetails.picContact}\n`;
      }
    }
    
    if (ticketDetails.storeAddress) {
      message += `**Address:** ${ticketDetails.storeAddress}\n`;
    }
    
    if (ticketDetails.description) {
      message += `**Description:**\n${ticketDetails.description}\n`;
    }
    
    // ENHANCED: Add express request alert at the bottom as well for emphasis
    if (ticketDetails.expressRequest) {
      message += `\n🚨🚨🚨 **URGENT EXPRESS REQUEST** 🚨🚨🚨\n`;
      message += `⏰ **MUST BE COMPLETED WITHIN 3 HOURS** ⏰\n`;
    }
    
    message += `\n**Created:** ${new Date(ticketDetails.created_at * 1000).toLocaleString()}`;
    message += `\n**Updated:** ${new Date(ticketDetails.updated_at * 1000).toLocaleString()}`;
    message += `\n\n🔗 [View Ticket](${ticketDetails.url})`;
    
    return message;
  }

  /**
   * Process a webhook notification for L2 onsite support
   * @param {Object} webhookData - Webhook data from Intercom
   * @returns {Promise<boolean>} - True if processed successfully
   */
  async processWebhook(webhookData) {
    try {
      logger.info('Processing L2 onsite webhook', { 
        type: webhookData.type,
        topic: webhookData.topic,
        conversationId: webhookData.data?.item?.id
      });
      
      // Only process conversation-related webhooks
      if (webhookData.type !== 'notification_event' || 
          !webhookData.topic?.includes('conversation')) {
        return false;
      }
      
      const conversation = webhookData.data?.item;
      if (!conversation) {
        return false;
      }
      
      // MODIFIED: Only process site inspection tickets
      const shouldProcess = this.shouldProcessTicket(conversation);
      
      if (!shouldProcess) {
        logger.debug('Not a site inspection ticket, skipping', { 
          conversationId: conversation.id,
          teamId: conversation.team_assignee_id,
          ticketType: conversation.ticket?.ticket_type
        });
        return false;
      }
      
      // Extract ticket details
      const ticketDetails = this.extractTicketDetails(conversation);
      
      // Get conversation update details based on webhook topic
      const updateDetails = this.extractUpdateDetails(webhookData);
      
      // Format message for Lark based on the type of update
      const message = this.formatConversationUpdateMessage(ticketDetails, updateDetails);
      
      // Send to Lark
      const larkChatId = process.env.LARK_CHAT_GROUP_ID;
      
      if (!larkChatId) {
        logger.warn('No Lark chat group configured for L2 onsite notifications');
        return false;
      }
      
      const success = await larkService.sendMessage(larkChatId, { text: message }, 'text');
      
      if (success) {
        logger.info('Site inspection ticket update sent to Lark', { 
          ticketId: ticketDetails.id,
          updateType: updateDetails.type,
          isSiteInspection: true,
          chatId: larkChatId
        });
      } else {
        logger.error('Failed to send site inspection ticket update to Lark', { 
          ticketId: ticketDetails.id,
          updateType: updateDetails.type,
          chatId: larkChatId
        });
      }
      
      return success;
      
    } catch (error) {
      logger.error('Error processing L2 onsite webhook', { error: error.message });
      return false;
    }
  }

  /**
   * Extract update details from webhook data
   * @param {Object} webhookData - Webhook data from Intercom
   * @returns {Object} - Update details
   */
  extractUpdateDetails(webhookData) {
    const topic = webhookData.topic;
    const data = webhookData.data;
    
    const updateDetails = {
      type: topic,
      timestamp: new Date().toISOString(),
      admin: null,
      assignee: null,
      note: null,
      reply: null
    };
    
    // Extract relevant details based on webhook topic
    switch (topic) {
      case 'conversation.admin.opened':
        updateDetails.type = 'ticket_created';
        updateDetails.admin = data.admin;
        break;
        
      case 'conversation.admin.assigned':
        updateDetails.type = 'ticket_assigned';
        updateDetails.assignee = data.assignee;
        updateDetails.admin = data.admin;
        break;
        
      case 'conversation.admin.replied':
        updateDetails.type = 'admin_replied';
        updateDetails.admin = data.admin;
        updateDetails.reply = data.conversation_part;
        break;
        
      case 'conversation.admin.note.created':
        updateDetails.type = 'note_added';
        updateDetails.admin = data.admin;
        updateDetails.note = data.conversation_part;
        break;
        
      case 'conversation.admin.closed':
        updateDetails.type = 'ticket_closed';
        updateDetails.admin = data.admin;
        break;
        
      case 'conversation.admin.snoozed':
        updateDetails.type = 'ticket_snoozed';
        updateDetails.admin = data.admin;
        break;
        
      case 'conversation.admin.unsnoozed':
        updateDetails.type = 'ticket_unsnoozed';
        updateDetails.admin = data.admin;
        break;
        
      default:
        updateDetails.type = 'unknown_update';
    }
    
    return updateDetails;
  }

  /**
   * Format conversation update message for Lark
   * @param {Object} ticketDetails - Extracted ticket details
   * @param {Object} updateDetails - Update details
   * @returns {string} - Formatted message for Lark
   */
  formatConversationUpdateMessage(ticketDetails, updateDetails) {
    const updateEmojis = {
      ticket_created: '🆕',
      ticket_assigned: '👤',
      admin_replied: '💬',
      note_added: '📝',
      ticket_closed: '🔒',
      ticket_snoozed: '😴',
      ticket_unsnoozed: '⏰',
      unknown_update: '📋'
    };
    
    const updateEmoji = updateEmojis[updateDetails.type] || '📋';
    const urgencyIcon = ticketDetails.expressRequest ? '🚨' : '📋';
    
    let message = `${urgencyIcon} 🔍 **SITE INSPECTION UPDATE**\n\n`;
    
    // ENHANCED: Add express request alert at the top if it's an express request
    if (ticketDetails.expressRequest) {
      message += `🚨🚨🚨 **URGENT - EXPRESS REQUEST** 🚨🚨🚨\n`;
      message += `⏰ **3 HOURS ONSITE REQUEST** ⏰\n\n`;
    }
    
    // Add update type header
    switch (updateDetails.type) {
      case 'ticket_created':
        message += `🆕 **NEW SITE INSPECTION REQUEST**\n\n`;
        break;
      case 'ticket_assigned':
        message += `👤 **ASSIGNED TO TECHNICIAN**\n\n`;
        break;
      case 'admin_replied':
        message += `💬 **ADMIN REPLY ADDED**\n\n`;
        break;
      case 'note_added':
        message += `📝 **INTERNAL NOTE ADDED**\n\n`;
        break;
      case 'ticket_closed':
        message += `🔒 **SITE INSPECTION COMPLETED**\n\n`;
        break;
      case 'ticket_snoozed':
        message += `😴 **SITE INSPECTION SNOOZED**\n\n`;
        break;
      case 'ticket_unsnoozed':
        message += `⏰ **SITE INSPECTION RESUMED**\n\n`;
        break;
      default:
        message += `📋 **SITE INSPECTION UPDATED**\n\n`;
    }
    
    // Add ticket details
    message += `**Ticket ID:** ${ticketDetails.id}\n`;
    message += `**State:** ${ticketDetails.state || ticketDetails.ticket_state}\n`;
    
    // ENHANCED: Show express request status prominently
    if (ticketDetails.expressRequest !== undefined) {
      message += `**Express Request:** ${ticketDetails.expressRequest ? '🚨 YES - 3 HOURS' : '⏱️ NO - STANDARD'}\n`;
    }
    
    if (ticketDetails.merchantName) {
      message += `**Merchant:** ${ticketDetails.merchantName}\n`;
    }
    
    if (ticketDetails.country) {
      message += `**Country:** ${ticketDetails.country}\n`;
    }
    
    // Add update-specific information
    if (updateDetails.assignee) {
      message += `**Assigned to:** ${updateDetails.assignee.name || updateDetails.assignee.email}\n`;
    }
    
    if (updateDetails.admin) {
      message += `**Updated by:** ${updateDetails.admin.name || updateDetails.admin.email}\n`;
    }
    
    // Add reply content if available
    if (updateDetails.reply && updateDetails.reply.body) {
      const replyContent = updateDetails.reply.body.replace(/<[^>]*>/g, '').substring(0, 200);
      message += `**Reply:**\n${replyContent}${replyContent.length > 200 ? '...' : ''}\n`;
    }
    
    // Add note content if available
    if (updateDetails.note && updateDetails.note.body) {
      const noteContent = updateDetails.note.body.replace(/<[^>]*>/g, '').substring(0, 200);
      message += `**Note:**\n${noteContent}${noteContent.length > 200 ? '...' : ''}\n`;
    }
    
    if (ticketDetails.picName) {
      message += `**PIC:** ${ticketDetails.picName}\n`;
      if (ticketDetails.picContact) {
        message += `**Contact:** ${ticketDetails.picContact}\n`;
      }
    }
    
    if (ticketDetails.storeAddress) {
      message += `**Address:** ${ticketDetails.storeAddress}\n`;
    }
    
    // ENHANCED: Add express request alert at the bottom as well for emphasis
    if (ticketDetails.expressRequest) {
      message += `\n🚨🚨🚨 **URGENT EXPRESS REQUEST** 🚨🚨🚨\n`;
      message += `⏰ **MUST BE COMPLETED WITHIN 3 HOURS** ⏰\n`;
    }
    
    message += `\n**Updated:** ${new Date().toLocaleString()}`;
    message += `\n\n🔗 [View Ticket](${ticketDetails.url})`;
    
    return message;
  }

  /**
   * Monitor for new L2 onsite support tickets
   * @param {Object} options - Monitoring options
   * @returns {Promise<Array>} - Array of found tickets
   */
  async monitorNewTickets(options = {}) {
    try {
      const { limit = 50, includeAll = false } = options;
      
      logger.info('Monitoring for new L2 onsite support tickets', { limit, includeAll });
      
      // Get recent conversations
      const conversations = await intercomService.getConversations({
        page: 1,
        perPage: limit,
        sort: 'created_at',
        order: 'desc'
      });
      
      if (!conversations.conversations) {
        return [];
      }
      
      // Filter for L2 onsite support tickets
      const l2Tickets = conversations.conversations.filter(conv => {
        const isL2 = this.isL2OnsiteTicket(conv);
        const isSiteInspection = this.isSiteInspectionTicket(conv);
        
        return includeAll ? (isL2 || isSiteInspection) : isSiteInspection;
      });
      
      logger.info('Found L2 onsite support tickets', { 
        total: l2Tickets.length,
        siteInspectionOnly: !includeAll
      });
      
      return l2Tickets.map(ticket => this.extractTicketDetails(ticket));
      
    } catch (error) {
      logger.error('Error monitoring L2 onsite support tickets', { error: error.message });
      return [];
    }
  }

  /**
   * Get monitoring statistics
   * @returns {Object} - Monitoring statistics
   */
  getMonitoringStats() {
    return {
      targetTeamId: this.targetTeamId,
      targetOnsiteTypes: this.targetOnsiteTypes,
      monitoredTicketTypes: this.monitoredTicketTypes,
      isActive: true
    };
  }
}

// Create singleton instance
const l2OnsiteMonitor = new L2OnsiteMonitor();

module.exports = l2OnsiteMonitor; 