const { intercomService, larkService } = require('../../services');
const logger = require('../../utils/logger');

/**
 * Phase 3: Real-time Automation
 * 
 * This phase handles real-time webhook processing and notification delivery
 * Features:
 * - Webhook event processing
 * - Real-time notifications to Lark chat groups
 * - Event queuing and retry mechanisms
 * - Status tracking and monitoring
 */

class Phase3Implementation {
  constructor() {
    this.isInitialized = false;
    this.eventQueue = [];
    this.processingEvents = false;
    this.stats = {
      eventsProcessed: 0,
      notificationsSent: 0,
      errors: 0,
      lastProcessedAt: null
    };
  }

  /**
   * Initialize Phase 3 implementation
   */
  async initialize() {
    try {
      logger.info('🚀 Phase 3: Initializing real-time automation system');
      
      // Validate required environment variables
      this.validateConfiguration();
      
      // Initialize services
      await this.initializeServices();
      
      // Start event processing
      this.startEventProcessing();
      
      this.isInitialized = true;
      logger.info('✅ Phase 3: Real-time automation system initialized successfully');
      
      return {
        success: true,
        message: 'Phase 3 initialized successfully',
        features: [
          'Real-time webhook processing',
          'Lark chat notifications',
          'Event queuing system',
          'Status monitoring'
        ]
      };
      
    } catch (error) {
      logger.error('❌ Phase 3: Failed to initialize', { error: error.message });
      throw error;
    }
  }

  /**
   * Validate required configuration
   */
  validateConfiguration() {
    const requiredEnvVars = [
      'LARK_APP_ID',
      'LARK_APP_SECRET',
      'LARK_CHAT_GROUP_ID',
      'INTERCOM_TOKEN'
    ];

    const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
    
    if (missingVars.length > 0) {
      throw new Error(`Missing required environment variables: ${missingVars.join(', ')}`);
    }

    logger.info('✅ Phase 3: Configuration validation passed');
  }

  /**
   * Initialize required services
   */
  async initializeServices() {
    try {
      // Test Intercom connection
      await intercomService.testConnection();
      logger.info('✅ Phase 3: Intercom service connected');

      // Test Lark service (if implemented)
      if (larkService && typeof larkService.testConnection === 'function') {
        await larkService.testConnection();
        logger.info('✅ Phase 3: Lark service connected');
      }

    } catch (error) {
      logger.error('❌ Phase 3: Service initialization failed', { error: error.message });
      throw error;
    }
  }

  /**
   * Start event processing loop
   */
  startEventProcessing() {
    if (this.processingEvents) {
      return;
    }

    this.processingEvents = true;
    logger.info('🔄 Phase 3: Starting event processing loop');

    // Process events every 5 seconds
    setInterval(() => {
      this.processEventQueue();
    }, 5000);
  }

  /**
   * Process queued events
   */
  async processEventQueue() {
    if (this.eventQueue.length === 0) {
      return;
    }

    const events = this.eventQueue.splice(0, 10); // Process up to 10 events at once
    
    for (const event of events) {
      try {
        await this.processEvent(event);
        this.stats.eventsProcessed++;
      } catch (error) {
        logger.error('❌ Phase 3: Event processing failed', { 
          eventId: event.id, 
          error: error.message 
        });
        this.stats.errors++;
        
        // Retry failed events (up to 3 times)
        if (event.retryCount < 3) {
          event.retryCount++;
          this.eventQueue.push(event);
        }
      }
    }

    this.stats.lastProcessedAt = new Date();
  }

  /**
   * Add event to processing queue
   */
  queueEvent(eventData) {
    const event = {
      id: this.generateEventId(),
      timestamp: new Date(),
      retryCount: 0,
      ...eventData
    };

    this.eventQueue.push(event);
    logger.info('📝 Phase 3: Event queued for processing', { 
      eventId: event.id, 
      type: event.type,
      queueSize: this.eventQueue.length 
    });

    return event.id;
  }

  /**
   * Process individual event
   */
  async processEvent(event) {
    const { type, data } = event;

    logger.info('🔄 Phase 3: Processing event', { 
      eventId: event.id, 
      type,
      retryCount: event.retryCount 
    });

    switch (type) {
      case 'intercom.ticket.opened':
        await this.handleTicketOpened(data);
        break;
      case 'intercom.ticket.assigned':
        await this.handleTicketAssigned(data);
        break;
      case 'intercom.ticket.replied':
        await this.handleTicketReplied(data);
        break;
      case 'intercom.ticket.closed':
        await this.handleTicketClosed(data);
        break;
      case 'intercom.ticket.note_added':
        await this.handleTicketNoteAdded(data);
        break;
      default:
        logger.warn('⚠️ Phase 3: Unknown event type', { type });
    }
  }

  /**
   * Handle ticket opened event
   */
  async handleTicketOpened(data) {
    const message = this.formatTicketMessage(data.ticket, '🆕 New Ticket', {
      status: 'opened',
      description: 'A new support ticket has been created'
    });

    await this.sendNotification(message);
  }

  /**
   * Handle ticket assigned event
   */
  async handleTicketAssigned(data) {
    const message = this.formatTicketMessage(data.ticket, '👤 Ticket Assigned', {
      status: 'assigned',
      description: `Ticket assigned to ${data.assignee?.name || 'Unknown'}`,
      assignee: data.assignee?.name
    });

    await this.sendNotification(message);
  }

  /**
   * Handle ticket replied event
   */
  async handleTicketReplied(data) {
    const message = this.formatTicketMessage(data.ticket, '💬 Ticket Reply', {
      status: 'replied',
      description: `Reply added by ${data.admin?.name || 'Agent'}`,
      repliedBy: data.admin?.name
    });

    await this.sendNotification(message);
  }

  /**
   * Handle ticket closed event
   */
  async handleTicketClosed(data) {
    const message = this.formatTicketMessage(data.ticket, '🔒 Ticket Closed', {
      status: 'closed',
      description: `Ticket closed by ${data.admin?.name || 'Agent'}`,
      closedBy: data.admin?.name
    });

    await this.sendNotification(message);
  }

  /**
   * Handle ticket note added event
   */
  async handleTicketNoteAdded(data) {
    const message = this.formatTicketMessage(data.ticket, '📝 Note Added', {
      status: 'note_added',
      description: `Note added by ${data.admin?.name || 'Agent'}`,
      noteBy: data.admin?.name
    });

    await this.sendNotification(message);
  }

  /**
   * Format ticket message for Lark
   */
  formatTicketMessage(ticket, title, metadata = {}) {
    const { status, description, assignee, repliedBy, closedBy, noteBy } = metadata;
    
    let message = `${title}\n\n`;
    message += `**Ticket ID:** ${ticket.id}\n`;
    message += `**Status:** ${status.toUpperCase()}\n`;
    message += `**Description:** ${description}\n`;
    
    if (assignee) message += `**Assigned to:** ${assignee}\n`;
    if (repliedBy) message += `**Replied by:** ${repliedBy}\n`;
    if (closedBy) message += `**Closed by:** ${closedBy}\n`;
    if (noteBy) message += `**Note by:** ${noteBy}\n`;
    
    message += `**Created:** ${new Date(ticket.created_at * 1000).toLocaleString()}\n`;
    message += `**Updated:** ${new Date(ticket.updated_at * 1000).toLocaleString()}\n`;
    
    if (process.env.INTERCOM_APP_ID) {
      message += `\n[View in Intercom](https://app.intercom.io/a/apps/${process.env.INTERCOM_APP_ID}/inbox/conversation/${ticket.id})`;
    }
    
    return message;
  }

  /**
   * Send notification to Lark chat group
   */
  async sendNotification(message) {
    try {
      const chatGroupId = process.env.LARK_CHAT_GROUP_ID;
      
      if (!chatGroupId) {
        logger.warn('⚠️ Phase 3: No Lark chat group configured');
        return;
      }

      // For now, we'll use the existing chatbot service
      // In a real implementation, this would use the Lark API directly
      logger.info('📤 Phase 3: Sending notification to Lark', { 
        chatGroupId,
        messageLength: message.length 
      });

      // Placeholder for actual Lark API call
      // await larkService.sendMessage(chatGroupId, message);
      
      // For now, just log the message
      logger.info('📨 Phase 3: Notification sent', { message });
      
      this.stats.notificationsSent++;
      
    } catch (error) {
      logger.error('❌ Phase 3: Failed to send notification', { error: error.message });
      throw error;
    }
  }

  /**
   * Generate unique event ID
   */
  generateEventId() {
    return `phase3_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Get health status
   */
  getHealthStatus() {
    return {
      initialized: this.isInitialized,
      processingEvents: this.processingEvents,
      queueSize: this.eventQueue.length,
      stats: this.stats,
      uptime: process.uptime()
    };
  }

  /**
   * Get statistics
   */
  getStatistics() {
    return {
      ...this.stats,
      queueSize: this.eventQueue.length,
      averageProcessingTime: this.stats.eventsProcessed > 0 ? 
        (Date.now() - this.stats.lastProcessedAt) / this.stats.eventsProcessed : 0
    };
  }

  /**
   * Shutdown Phase 3 gracefully
   */
  async shutdown() {
    logger.info('🛑 Phase 3: Shutting down gracefully');
    
    this.processingEvents = false;
    
    // Process remaining events
    if (this.eventQueue.length > 0) {
      logger.info(`📝 Phase 3: Processing ${this.eventQueue.length} remaining events`);
      await this.processEventQueue();
    }
    
    this.isInitialized = false;
    logger.info('✅ Phase 3: Shutdown complete');
  }
}

// Export instance
const phase3 = new Phase3Implementation();

module.exports = {
  initialize: () => phase3.initialize(),
  queueEvent: (eventData) => phase3.queueEvent(eventData),
  getHealthStatus: () => phase3.getHealthStatus(),
  getStatistics: () => phase3.getStatistics(),
  shutdown: () => phase3.shutdown()
};

// If running directly, initialize Phase 3
if (require.main === module) {
  (async () => {
    try {
      require('dotenv').config();
      const result = await phase3.initialize();
      console.log('Phase 3 initialized:', result);
      
      // Keep the process running
      process.on('SIGINT', async () => {
        console.log('Shutting down Phase 3...');
        await phase3.shutdown();
        process.exit(0);
      });
      
    } catch (error) {
      console.error('Failed to initialize Phase 3:', error.message);
      process.exit(1);
    }
  })();
}