const larkService = require('./lark');
const { intercomService } = require('./index');
const logger = require('../utils/logger');

/**
 * Chatbot Service for Ticket Information Sharing
 * Handles automated ticket status updates and information sharing via Lark Suite
 */
class ChatbotService {
  constructor() {
    this.isInitialized = false;
    this.commands = new Map();
    this.subscriptions = new Map();
    this.setupCommands();
  }

  /**
   * Initialize chatbot service
   */
  async initialize() {
    if (this.isInitialized) return;

    logger.info('🤖 Initializing Chatbot service');

    try {
      // Initialize Lark service
      await larkService.initialize();

      this.isInitialized = true;
      logger.info('✅ Chatbot service initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize Chatbot service', { error: error.message });
      throw error;
    }
  }

  /**
   * Setup chatbot commands
   */
  setupCommands() {
    // Ticket status commands
    this.commands.set('/ticket', {
      description: 'Get ticket information',
      usage: '/ticket <ticket_id>',
      handler: this.handleTicketCommand.bind(this)
    });

    this.commands.set('/tickets', {
      description: 'List tickets with filters',
      usage: '/tickets [state=open] [priority=high] [limit=5]',
      handler: this.handleTicketsCommand.bind(this)
    });

    this.commands.set('/status', {
      description: 'Get ticket status updates',
      usage: '/status <ticket_id>',
      handler: this.handleStatusCommand.bind(this)
    });

    // Conversation commands
    this.commands.set('/conversation', {
      description: 'Get conversation details',
      usage: '/conversation <conversation_id>',
      handler: this.handleConversationCommand.bind(this)
    });

    this.commands.set('/conversations', {
      description: 'List recent conversations',
      usage: '/conversations [state=open] [limit=5]',
      handler: this.handleConversationsCommand.bind(this)
    });

    // Summary commands
    this.commands.set('/summary', {
      description: 'Get daily ticket summary',
      usage: '/summary [date=today]',
      handler: this.handleSummaryCommand.bind(this)
    });

    this.commands.set('/stats', {
      description: 'Get ticket statistics',
      usage: '/stats [period=today|week|month]',
      handler: this.handleStatsCommand.bind(this)
    });

    // Subscription commands
    this.commands.set('/subscribe', {
      description: 'Subscribe to ticket updates',
      usage: '/subscribe <ticket_id|filter>',
      handler: this.handleSubscribeCommand.bind(this)
    });

    this.commands.set('/unsubscribe', {
      description: 'Unsubscribe from updates',
      usage: '/unsubscribe <ticket_id|all>',
      handler: this.handleUnsubscribeCommand.bind(this)
    });

    // Enhanced filtering commands
    this.commands.set('/tickets-custom', {
      description: 'Get tickets with custom attribute filtering',
      usage: '/tickets-custom type=bug,feature custom=department:engineering,priority:high',
      handler: this.handleCustomTicketsCommand.bind(this)
    });

    this.commands.set('/tickets-type', {
      description: 'Get tickets by specific type or category',
      usage: '/tickets-type type=bug,technical category=urgent source=email',
      handler: this.handleTicketTypeCommand.bind(this)
    });

    this.commands.set('/filter-tickets', {
      description: 'Advanced ticket filtering with multiple criteria',
      usage: '/filter-tickets [filters_json]',
      handler: this.handleAdvancedFilterCommand.bind(this)
    });

    // Help command
    this.commands.set('/help', {
      description: 'Show available commands',
      usage: '/help [command]',
      handler: this.handleHelpCommand.bind(this)
    });

    logger.info(`✅ Loaded ${this.commands.size} chatbot commands`);
  }

  /**
   * Process incoming message and execute commands
   */
  async processMessage(message) {
    const { content, chatId, userId, messageType } = message;

    logger.info('🤖 Processing message', { chatId, userId, messageType });

    try {
      // Parse command from message
      const command = this.parseCommand(content);

      if (!command) {
        // Not a command, ignore or provide help
        return await this.sendHelpMessage(chatId);
      }

      // Execute command
      const result = await this.executeCommand(command, chatId, userId);
      return result;
    } catch (error) {
      logger.error('❌ Error processing message', { error: error.message });
      return await this.sendErrorMessage(chatId, error.message);
    }
  }

  /**
   * Parse command from message content
   */
  parseCommand(content) {
    if (!content.startsWith('/')) return null;

    const parts = content.trim().split(' ');
    const commandName = parts[0];
    const args = parts.slice(1);

    return {
      name: commandName,
      args,
      raw: content
    };
  }

  /**
   * Execute a command
   */
  async executeCommand(command, chatId, userId) {
    const { name, args } = command;

    const commandHandler = this.commands.get(name);
    if (!commandHandler) {
      return await this.sendMessage(chatId, `❌ Unknown command: ${name}\nUse /help to see available commands.`);
    }

    logger.info(`🤖 Executing command: ${name}`, { args, chatId, userId });

    try {
      return await commandHandler.handler(args, chatId, userId);
    } catch (error) {
      logger.error(`❌ Command execution failed: ${name}`, { error: error.message });
      return await this.sendErrorMessage(chatId, `Failed to execute ${name}: ${error.message}`);
    }
  }

  /**
   * Handle /ticket command
   */
  async handleTicketCommand(args, chatId, userId) {
    if (args.length === 0) {
      return await this.sendMessage(chatId, '❌ Please provide a ticket ID.\nUsage: /ticket <ticket_id>');
    }

    const ticketId = args[0];
    logger.info('🎫 Getting ticket details', { ticketId, chatId });

    try {
      // Get ticket from Intercom
      const ticket = await this.getTicketDetails(ticketId);

      if (!ticket) {
        return await this.sendMessage(chatId, `❌ Ticket not found: ${ticketId}`);
      }

      // Format and send ticket information
      const message = this.formatTicketMessage(ticket);
      return await this.sendMessage(chatId, message);
    } catch (error) {
      return await this.sendErrorMessage(chatId, `Failed to get ticket ${ticketId}: ${error.message}`);
    }
  }

  /**
   * Handle /tickets command
   */
  async handleTicketsCommand(args, chatId, userId) {
    logger.info('🎫 Getting tickets list', { args, chatId });

    try {
      // Parse filters from args
      const filters = this.parseFilters(args);
      const limit = filters.limit || 5;

      // Get tickets from Intercom
      const tickets = await intercomService.getTickets({ page: 1, perPage: limit });

      if (!tickets.tickets || tickets.tickets.length === 0) {
        return await this.sendMessage(chatId, '📭 No tickets found matching your criteria.');
      }

      // Apply additional filters
      let filteredTickets = tickets.tickets;
      if (filters.state) {
        filteredTickets = filteredTickets.filter((t) =>
          t.ticket_attributes?.state === filters.state
        );
      }
      if (filters.priority) {
        filteredTickets = filteredTickets.filter((t) =>
          t.ticket_attributes?.priority === filters.priority
        );
      }

      // Format and send tickets list
      const message = this.formatTicketsListMessage(filteredTickets, filters);
      return await this.sendMessage(chatId, message);
    } catch (error) {
      return await this.sendErrorMessage(chatId, `Failed to get tickets: ${error.message}`);
    }
  }

  /**
   * Handle /status command
   */
  async handleStatusCommand(args, chatId, userId) {
    if (args.length === 0) {
      return await this.sendMessage(chatId, '❌ Please provide a ticket ID.\nUsage: /status <ticket_id>');
    }

    const ticketId = args[0];
    logger.info('📊 Getting ticket status', { ticketId, chatId });

    try {
      const ticket = await this.getTicketDetails(ticketId);

      if (!ticket) {
        return await this.sendMessage(chatId, `❌ Ticket not found: ${ticketId}`);
      }

      const message = this.formatTicketStatusMessage(ticket);
      return await this.sendMessage(chatId, message);
    } catch (error) {
      return await this.sendErrorMessage(chatId, `Failed to get status for ${ticketId}: ${error.message}`);
    }
  }

  /**
   * Handle /summary command
   */
  async handleSummaryCommand(args, chatId, userId) {
    logger.info('📊 Getting ticket summary', { args, chatId });

    try {
      const date = args[0] || 'today';
      const summary = await this.generateTicketSummary(date);

      const message = this.formatSummaryMessage(summary);
      return await this.sendMessage(chatId, message);
    } catch (error) {
      return await this.sendErrorMessage(chatId, `Failed to generate summary: ${error.message}`);
    }
  }

  /**
   * Handle /conversation command
   */
  async handleConversationCommand(args, chatId, userId) {
    if (args.length === 0) {
      return await this.sendMessage(chatId, '❌ Please provide a conversation ID.\nUsage: /conversation <conversation_id>');
    }

    const conversationId = args[0];
    logger.info('💬 Getting conversation details', { conversationId, chatId });

    try {
      const conversation = await intercomService.getConversation(conversationId);

      if (!conversation) {
        return await this.sendMessage(chatId, `❌ Conversation not found: ${conversationId}`);
      }

      const message = this.formatConversationMessage(conversation);
      return await this.sendMessage(chatId, message);
    } catch (error) {
      return await this.sendErrorMessage(chatId, `Failed to get conversation ${conversationId}: ${error.message}`);
    }
  }

  /**
   * Handle /conversations command
   */
  async handleConversationsCommand(args, chatId, userId) {
    logger.info('💬 Getting conversations list', { args, chatId });

    try {
      const filters = this.parseFilters(args);
      const limit = filters.limit || 5;

      const conversations = await intercomService.getConversations({ page: 1, perPage: limit });

      if (!conversations.conversations || conversations.conversations.length === 0) {
        return await this.sendMessage(chatId, '📭 No conversations found matching your criteria.');
      }

      let filteredConversations = conversations.conversations;
      if (filters.state) {
        filteredConversations = filteredConversations.filter((c) => c.state === filters.state);
      }

      const message = this.formatConversationsListMessage(filteredConversations, filters);
      return await this.sendMessage(chatId, message);
    } catch (error) {
      return await this.sendErrorMessage(chatId, `Failed to get conversations: ${error.message}`);
    }
  }

  /**
   * Handle /subscribe command
   */
  async handleSubscribeCommand(args, chatId, userId) {
    if (args.length === 0) {
      return await this.sendMessage(chatId, '❌ Please provide a ticket ID or filter.\nUsage: /subscribe <ticket_id>');
    }

    const target = args[0];
    logger.info('🔔 Subscribing to updates', { target, chatId, userId });

    // Add subscription logic here
    this.subscriptions.set(`${chatId}_${target}`, {
      chatId,
      userId,
      target,
      createdAt: new Date().toISOString()
    });

    return await this.sendMessage(chatId, `✅ Subscribed to updates for: ${target}\n\nYou'll receive notifications when this ticket is updated.`);
  }

  /**
   * Handle /unsubscribe command
   */
  async handleUnsubscribeCommand(args, chatId, userId) {
    if (args.length === 0) {
      return await this.sendMessage(chatId, '❌ Please provide a ticket ID or "all".\nUsage: /unsubscribe <ticket_id|all>');
    }

    const target = args[0];
    logger.info('🔕 Unsubscribing from updates', { target, chatId, userId });

    if (target === 'all') {
      // Remove all subscriptions for this chat
      const removed = [];
      for (const [key, subscription] of this.subscriptions.entries()) {
        if (subscription.chatId === chatId) {
          this.subscriptions.delete(key);
          removed.push(subscription.target);
        }
      }
      return await this.sendMessage(chatId, `✅ Unsubscribed from all updates (${removed.length} subscriptions removed).`);
    }
    // Remove specific subscription
    const key = `${chatId}_${target}`;
    if (this.subscriptions.has(key)) {
      this.subscriptions.delete(key);
      return await this.sendMessage(chatId, `✅ Unsubscribed from updates for: ${target}`);
    }
    return await this.sendMessage(chatId, `❌ No subscription found for: ${target}`);
  }

  /**
   * Handle /stats command
   */
  async handleStatsCommand(args, chatId, userId) {
    logger.info('📊 Getting ticket statistics', { args, chatId });

    try {
      const period = args[0] || 'today';
      const stats = await this.generateTicketStats(period);

      const message = this.formatStatsMessage(stats);
      return await this.sendMessage(chatId, message);
    } catch (error) {
      return await this.sendErrorMessage(chatId, `Failed to generate stats: ${error.message}`);
    }
  }

  /**
   * Handle /tickets-custom command - Custom attribute filtering
   */
  async handleCustomTicketsCommand(args, chatId, userId) {
    logger.info('🎫 Getting tickets with custom attributes', { args, chatId });

    try {
      // Parse custom filters from args
      const filters = this.parseCustomFilters(args);

      if (!filters.customAttributes && !filters.ticketType) {
        return await this.sendMessage(chatId,
          '❌ Please specify custom attributes or ticket types.\n' +
          'Usage: /tickets-custom type=bug,feature custom=department:engineering,priority:high'
        );
      }

      // Get tickets from Intercom
      const tickets = await intercomService.getTickets({ page: 1, perPage: 50 });

      if (!tickets.tickets || tickets.tickets.length === 0) {
        return await this.sendMessage(chatId, '📭 No tickets found.');
      }

      // Apply custom filtering using Phase 2 filtering
      const phase2 = require('../phases/phase2');
      await phase2.initialize();

      let filteredTickets = tickets.tickets;

      // Apply custom attributes filter
      if (filters.customAttributes && Object.keys(filters.customAttributes).length > 0) {
        const customFilteredData = await phase2.applyFilters(filteredTickets, {
          customAttributes: {
            attributes: filters.customAttributes,
            matchMode: filters.matchMode || 'any'
          }
        });
        filteredTickets = customFilteredData.filtered;
      }

      // Apply ticket type filter
      if (filters.ticketType && (filters.ticketType.types || filters.ticketType.categories || filters.ticketType.sources)) {
        const typeFilteredData = await phase2.applyFilters(filteredTickets, {
          ticketType: filters.ticketType
        });
        filteredTickets = typeFilteredData.filtered;
      }

      if (filteredTickets.length === 0) {
        return await this.sendMessage(chatId, '📭 No tickets found matching your custom criteria.');
      }

      // Format and send response
      const message = this.formatCustomTicketsMessage(filteredTickets, filters);
      return await this.sendMessage(chatId, message);
    } catch (error) {
      return await this.sendErrorMessage(chatId, `Failed to get custom tickets: ${error.message}`);
    }
  }

  /**
   * Handle /tickets-type command - Ticket type filtering
   */
  async handleTicketTypeCommand(args, chatId, userId) {
    logger.info('🎫 Getting tickets by type', { args, chatId });

    try {
      // Parse type filters from args
      const filters = this.parseTypeFilters(args);

      if (!filters.types && !filters.categories && !filters.sources) {
        return await this.sendMessage(chatId,
          '❌ Please specify ticket types, categories, or sources.\n' +
          'Usage: /tickets-type type=bug,technical category=urgent source=email'
        );
      }

      // Get tickets from Intercom
      const tickets = await intercomService.getTickets({ page: 1, perPage: 50 });

      if (!tickets.tickets || tickets.tickets.length === 0) {
        return await this.sendMessage(chatId, '📭 No tickets found.');
      }

      // Apply type filtering using Phase 2 filtering
      const phase2 = require('../phases/phase2');
      await phase2.initialize();

      const filteredData = await phase2.applyFilters(tickets.tickets, {
        ticketType: filters
      });

      if (filteredData.filtered.length === 0) {
        return await this.sendMessage(chatId, '📭 No tickets found matching your type criteria.');
      }

      // Format and send response
      const message = this.formatTypeTicketsMessage(filteredData.filtered, filters);
      return await this.sendMessage(chatId, message);
    } catch (error) {
      return await this.sendErrorMessage(chatId, `Failed to get tickets by type: ${error.message}`);
    }
  }

  /**
   * Handle /filter-tickets command - Advanced filtering
   */
  async handleAdvancedFilterCommand(args, chatId, userId) {
    logger.info('🎫 Advanced ticket filtering', { args, chatId });

    try {
      // Parse advanced filters from args
      let filterConfig;

      if (args.length === 0) {
        // Show filter examples
        return await this.sendMessage(chatId, this.getFilterExamples());
      }

      try {
        // Try to parse JSON filter config
        const filterJson = args.join(' ');
        filterConfig = JSON.parse(filterJson);
      } catch (parseError) {
        // Fall back to simple key=value parsing
        filterConfig = this.parseAdvancedFilters(args);
      }

      // Get tickets from Intercom
      const tickets = await intercomService.getTickets({ page: 1, perPage: 100 });

      if (!tickets.tickets || tickets.tickets.length === 0) {
        return await this.sendMessage(chatId, '📭 No tickets found.');
      }

      // Apply advanced filtering using Phase 2 filtering
      const phase2 = require('../phases/phase2');
      await phase2.initialize();

      const filteredData = await phase2.applyFilters(tickets.tickets, filterConfig);

      if (filteredData.filtered.length === 0) {
        return await this.sendMessage(chatId, '📭 No tickets found matching your advanced criteria.');
      }

      // Format and send response
      const message = this.formatAdvancedTicketsMessage(filteredData.filtered, filterConfig);
      return await this.sendMessage(chatId, message);
    } catch (error) {
      return await this.sendErrorMessage(chatId, `Failed to apply advanced filters: ${error.message}`);
    }
  }

  /**
   * Handle /help command
   */
  async handleHelpCommand(args, chatId, userId) {
    if (args.length > 0) {
      // Help for specific command
      const commandName = args[0];
      const command = this.commands.get(commandName);

      if (!command) {
        return await this.sendMessage(chatId, `❌ Unknown command: ${commandName}`);
      }

      const message = `📖 **${commandName}**\n\n**Description:** ${command.description}\n**Usage:** ${command.usage}`;
      return await this.sendMessage(chatId, message);
    }

    // General help
    const helpMessage = this.formatHelpMessage();
    return await this.sendMessage(chatId, helpMessage);
  }

  /**
   * Get ticket details from Intercom
   */
  async getTicketDetails(ticketId) {
    try {
      // For mock mode, generate a mock ticket
      if (intercomService.getHealthStatus().mode === 'MOCK') {
        return {
          id: ticketId,
          type: 'ticket',
          ticket_attributes: {
            subject: `Mock Ticket ${ticketId}`,
            state: ['open', 'pending', 'resolved', 'closed'][Math.floor(Math.random() * 4)],
            priority: ['low', 'normal', 'high', 'urgent'][Math.floor(Math.random() * 4)],
            category: 'technical'
          },
          created_at: Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000),
          updated_at: Date.now() - Math.floor(Math.random() * 24 * 60 * 60 * 1000),
          assignee: {
            id: 'mock_agent_1',
            name: 'Support Agent',
            email: 'support@company.com'
          },
          contacts: {
            contacts: [{
              id: 'mock_customer_1',
              name: 'Customer Name',
              email: 'customer@example.com'
            }]
          }
        };
      }

      // For real Intercom API, implement actual ticket lookup
      const tickets = await intercomService.getTickets({ page: 1, perPage: 100 });
      return tickets.tickets.find((t) => t.id === ticketId);
    } catch (error) {
      logger.error('❌ Failed to get ticket details', { ticketId, error: error.message });
      throw error;
    }
  }

  /**
   * Generate ticket summary
   */
  async generateTicketSummary(period = 'today') {
    try {
      const tickets = await intercomService.getTickets({ page: 1, perPage: 100 });

      // Filter by period (simplified for demo)
      const now = new Date();
      const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate());

      const filteredTickets = tickets.tickets.filter((ticket) => {
        const ticketDate = new Date(ticket.created_at);
        return ticketDate >= startOfDay;
      });

      // Generate statistics
      const stats = {
        total: filteredTickets.length,
        byState: {},
        byPriority: {},
        byCategory: {}
      };

      filteredTickets.forEach((ticket) => {
        const state = ticket.ticket_attributes?.state || 'unknown';
        const priority = ticket.ticket_attributes?.priority || 'unknown';
        const category = ticket.ticket_attributes?.category || 'unknown';

        stats.byState[state] = (stats.byState[state] || 0) + 1;
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
        stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
      });

      return {
        period,
        stats,
        tickets: filteredTickets
      };
    } catch (error) {
      logger.error('❌ Failed to generate summary', { error: error.message });
      throw error;
    }
  }

  /**
   * Parse filters from command arguments
   */
  parseFilters(args) {
    const filters = {};

    args.forEach((arg) => {
      if (arg.includes('=')) {
        const [key, value] = arg.split('=');
        filters[key] = value;
      }
    });

    return filters;
  }

  /**
   * Parse custom filters for tickets-custom command
   */
  parseCustomFilters(args) {
    const filters = {
      customAttributes: {},
      ticketType: {},
      matchMode: 'any'
    };

    args.forEach((arg) => {
      const [key, value] = arg.split('=');
      if (!key || !value) return;

      if (key === 'custom') {
        // Parse custom attributes: custom=department:engineering,priority:high
        const pairs = value.split(',');
        pairs.forEach((pair) => {
          const [attrKey, attrValue] = pair.split(':');
          if (attrKey && attrValue) {
            filters.customAttributes[attrKey] = attrValue;
          }
        });
      } else if (key === 'type') {
        // Parse ticket types: type=bug,feature
        filters.ticketType.types = value.split(',');
      } else if (key === 'category') {
        // Parse categories: category=urgent,technical
        filters.ticketType.categories = value.split(',');
      } else if (key === 'source') {
        // Parse sources: source=email,chat
        filters.ticketType.sources = value.split(',');
      } else if (key === 'match') {
        // Parse match mode: match=all|any
        filters.matchMode = value;
      }
    });

    return filters;
  }

  /**
   * Parse type filters for tickets-type command
   */
  parseTypeFilters(args) {
    const filters = {};

    args.forEach((arg) => {
      const [key, value] = arg.split('=');
      if (!key || !value) return;

      if (key === 'type') {
        filters.types = value.split(',');
      } else if (key === 'category') {
        filters.categories = value.split(',');
      } else if (key === 'source') {
        filters.sources = value.split(',');
      }
    });

    return filters;
  }

  /**
   * Parse advanced filters for filter-tickets command
   */
  parseAdvancedFilters(args) {
    const filters = {};

    args.forEach((arg) => {
      const [key, value] = arg.split('=');
      if (!key || !value) return;

      // Support nested filter configuration
      if (key.includes('.')) {
        const [filterType, filterKey] = key.split('.');
        if (!filters[filterType]) filters[filterType] = {};

        // Handle array values
        if (value.includes(',')) {
          filters[filterType][filterKey] = value.split(',');
        } else {
          filters[filterType][filterKey] = value;
        }
      } else {
        // Handle simple key=value
        if (value.includes(',')) {
          filters[key] = value.split(',');
        } else {
          filters[key] = value;
        }
      }
    });

    return filters;
  }

  // Message formatting methods

  formatTicketMessage(ticket) {
    const state = ticket.ticket_attributes?.state || 'unknown';
    const priority = ticket.ticket_attributes?.priority || 'unknown';
    const subject = ticket.ticket_attributes?.subject || 'No subject';
    const assignee = ticket.assignee?.name || 'Unassigned';
    const customer = ticket.contacts?.contacts?.[0]?.name || 'Unknown';

    const stateIcon = {
      open: '🔴',
      pending: '🟡',
      resolved: '🟢',
      closed: '✅'
    }[state] || '⚪';

    const priorityIcon = {
      low: '🔵',
      normal: '🟡',
      high: '🟠',
      urgent: '🔴'
    }[priority] || '⚪';

    return `🎫 **Ticket Details**

**ID:** ${ticket.id}
**Subject:** ${subject}
**Status:** ${stateIcon} ${state.toUpperCase()}
**Priority:** ${priorityIcon} ${priority.toUpperCase()}
**Assignee:** ${assignee}
**Customer:** ${customer}
**Created:** ${new Date(ticket.created_at).toLocaleString()}
**Updated:** ${new Date(ticket.updated_at).toLocaleString()}`;
  }

  formatTicketsListMessage(tickets, filters) {
    const filterText = Object.entries(filters)
      .filter(([key, value]) => key !== 'limit' && value)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');

    let message = `🎫 **Tickets List**${filterText ? ` (${filterText})` : ''}\n\n`;

    if (tickets.length === 0) {
      message += '📭 No tickets found matching your criteria.';
      return message;
    }

    tickets.forEach((ticket, index) => {
      const state = ticket.ticket_attributes?.state || 'unknown';
      const priority = ticket.ticket_attributes?.priority || 'unknown';
      const subject = ticket.ticket_attributes?.subject || 'No subject';

      const stateIcon = {
        open: '🔴',
        pending: '🟡',
        resolved: '🟢',
        closed: '✅'
      }[state] || '⚪';

      message += `${index + 1}. ${stateIcon} **${ticket.id}**\n`;
      message += `   ${subject}\n`;
      message += `   Priority: ${priority} | Updated: ${new Date(ticket.updated_at).toLocaleDateString()}\n\n`;
    });

    return message;
  }

  formatTicketStatusMessage(ticket) {
    const state = ticket.ticket_attributes?.state || 'unknown';
    const priority = ticket.ticket_attributes?.priority || 'unknown';

    const stateIcon = {
      open: '🔴',
      pending: '🟡',
      resolved: '🟢',
      closed: '✅'
    }[state] || '⚪';

    return `📊 **Ticket Status**

**ID:** ${ticket.id}
**Status:** ${stateIcon} ${state.toUpperCase()}
**Priority:** ${priority.toUpperCase()}
**Last Updated:** ${new Date(ticket.updated_at).toLocaleString()}
**Assignee:** ${ticket.assignee?.name || 'Unassigned'}

Use \`/ticket ${ticket.id}\` for full details.`;
  }

  formatSummaryMessage(summary) {
    const { period, stats } = summary;

    let message = `📊 **Daily Ticket Summary** (${period})\n\n`;
    message += `**Total Tickets:** ${stats.total}\n\n`;

    if (stats.total > 0) {
      message += '**By Status:**\n';
      Object.entries(stats.byState).forEach(([state, count]) => {
        const icon = {
          open: '🔴',
          pending: '🟡',
          resolved: '🟢',
          closed: '✅'
        }[state] || '⚪';
        message += `${icon} ${state}: ${count}\n`;
      });

      message += '\n**By Priority:**\n';
      Object.entries(stats.byPriority).forEach(([priority, count]) => {
        const icon = {
          low: '🔵',
          normal: '🟡',
          high: '🟠',
          urgent: '🔴'
        }[priority] || '⚪';
        message += `${icon} ${priority}: ${count}\n`;
      });
    }

    return message;
  }

  formatConversationMessage(conversation) {
    const state = conversation.state || 'unknown';
    const priority = conversation.priority || 'unknown';
    const subject = conversation.subject || 'No subject';
    const assignee = conversation.assignee?.name || 'Unassigned';
    const customer = conversation.contacts?.contacts?.[0]?.name || 'Unknown';
    const messageCount = conversation.conversation_message?.total_count || 0;

    const stateIcon = {
      open: '🔴',
      closed: '✅',
      snoozed: '😴'
    }[state] || '⚪';

    return `💬 **Conversation Details**

**ID:** ${conversation.id}
**Subject:** ${subject}
**Status:** ${stateIcon} ${state.toUpperCase()}
**Priority:** ${priority.toUpperCase()}
**Assignee:** ${assignee}
**Customer:** ${customer}
**Messages:** ${messageCount}
**Created:** ${new Date(conversation.created_at).toLocaleString()}
**Updated:** ${new Date(conversation.updated_at).toLocaleString()}`;
  }

  formatConversationsListMessage(conversations, filters) {
    const filterText = Object.entries(filters)
      .filter(([key, value]) => key !== 'limit' && value)
      .map(([key, value]) => `${key}=${value}`)
      .join(', ');

    let message = `💬 **Conversations List**${filterText ? ` (${filterText})` : ''}\n\n`;

    if (conversations.length === 0) {
      message += '📭 No conversations found matching your criteria.';
      return message;
    }

    conversations.forEach((conversation, index) => {
      const state = conversation.state || 'unknown';
      const subject = conversation.subject || 'No subject';

      const stateIcon = {
        open: '🔴',
        closed: '✅',
        snoozed: '😴'
      }[state] || '⚪';

      message += `${index + 1}. ${stateIcon} **${conversation.id}**\n`;
      message += `   ${subject}\n`;
      message += `   Priority: ${conversation.priority || 'normal'} | Updated: ${new Date(conversation.updated_at).toLocaleDateString()}\n\n`;
    });

    return message;
  }

  /**
   * Format custom tickets message
   */
  formatCustomTicketsMessage(tickets, filters) {
    const customAttrs = Object.entries(filters.customAttributes || {})
      .map(([key, value]) => `${key}:${value}`)
      .join(', ');

    const ticketTypes = filters.ticketType?.types?.join(', ') || '';
    const categories = filters.ticketType?.categories?.join(', ') || '';

    const filterText = [];
    if (customAttrs) filterText.push(`Custom: ${customAttrs}`);
    if (ticketTypes) filterText.push(`Types: ${ticketTypes}`);
    if (categories) filterText.push(`Categories: ${categories}`);

    let message = `🎫 **Custom Filtered Tickets**${filterText.length ? ` (${filterText.join(', ')})` : ''}\n\n`;

    if (tickets.length === 0) {
      message += '📭 No tickets found matching your custom criteria.';
      return message;
    }

    tickets.forEach((ticket, index) => {
      const state = ticket.ticket_attributes?.state || 'unknown';
      const priority = ticket.ticket_attributes?.priority || 'unknown';
      const subject = ticket.ticket_attributes?.subject || 'No subject';
      const customData = ticket.custom_attributes || {};

      const stateIcon = {
        open: '🔴',
        pending: '🟡',
        resolved: '🟢',
        closed: '✅'
      }[state] || '⚪';

      message += `${index + 1}. ${stateIcon} **${ticket.id}**\n`;
      message += `   ${subject}\n`;
      message += `   Priority: ${priority} | State: ${state}\n`;

      // Show matched custom attributes
      if (Object.keys(customData).length > 0) {
        const customDisplay = Object.entries(customData)
          .slice(0, 3) // Limit to first 3 attributes
          .map(([key, value]) => `${key}:${value}`)
          .join(', ');
        message += `   Custom: ${customDisplay}\n`;
      }

      message += `   Updated: ${new Date(ticket.updated_at).toLocaleDateString()}\n\n`;
    });

    return message;
  }

  /**
   * Format type tickets message
   */
  formatTypeTicketsMessage(tickets, filters) {
    const filterParts = [];
    if (filters.types) filterParts.push(`Types: ${filters.types.join(', ')}`);
    if (filters.categories) filterParts.push(`Categories: ${filters.categories.join(', ')}`);
    if (filters.sources) filterParts.push(`Sources: ${filters.sources.join(', ')}`);

    let message = `🎫 **Type Filtered Tickets**${filterParts.length ? ` (${filterParts.join(', ')})` : ''}\n\n`;

    if (tickets.length === 0) {
      message += '📭 No tickets found matching your type criteria.';
      return message;
    }

    tickets.forEach((ticket, index) => {
      const state = ticket.ticket_attributes?.state || 'unknown';
      const priority = ticket.ticket_attributes?.priority || 'unknown';
      const subject = ticket.ticket_attributes?.subject || 'No subject';
      const type = ticket.ticket_attributes?.type || ticket.type || 'unknown';
      const category = ticket.ticket_attributes?.category || ticket.category || 'unknown';
      const source = ticket.source?.type || 'unknown';

      const stateIcon = {
        open: '🔴',
        pending: '🟡',
        resolved: '🟢',
        closed: '✅'
      }[state] || '⚪';

      message += `${index + 1}. ${stateIcon} **${ticket.id}**\n`;
      message += `   ${subject}\n`;
      message += `   Type: ${type} | Category: ${category} | Source: ${source}\n`;
      message += `   Priority: ${priority} | State: ${state}\n`;
      message += `   Updated: ${new Date(ticket.updated_at).toLocaleDateString()}\n\n`;
    });

    return message;
  }

  /**
   * Format advanced tickets message
   */
  formatAdvancedTicketsMessage(tickets, filterConfig) {
    const filterSummary = this.summarizeFilterConfig(filterConfig);

    let message = `🎫 **Advanced Filtered Tickets**${filterSummary ? ` (${filterSummary})` : ''}\n\n`;

    if (tickets.length === 0) {
      message += '📭 No tickets found matching your advanced criteria.';
      return message;
    }

    tickets.forEach((ticket, index) => {
      const state = ticket.ticket_attributes?.state || 'unknown';
      const priority = ticket.ticket_attributes?.priority || 'unknown';
      const subject = ticket.ticket_attributes?.subject || 'No subject';

      const stateIcon = {
        open: '🔴',
        pending: '🟡',
        resolved: '🟢',
        closed: '✅'
      }[state] || '⚪';

      message += `${index + 1}. ${stateIcon} **${ticket.id}**\n`;
      message += `   ${subject}\n`;
      message += `   Priority: ${priority} | State: ${state}\n`;
      message += `   Updated: ${new Date(ticket.updated_at).toLocaleDateString()}\n\n`;
    });

    return message;
  }

  /**
   * Get filter examples for help
   */
  getFilterExamples() {
    return `🔍 **Advanced Filter Examples**

**Custom Attributes:**
\`/tickets-custom custom=department:engineering,priority:high\`
\`/tickets-custom type=bug,feature custom=team:backend\`

**Ticket Types:**
\`/tickets-type type=bug,technical category=urgent\`
\`/tickets-type source=email,chat type=feature\`

**Advanced Filters:**
\`/filter-tickets customAttributes.department=engineering customAttributes.priority=high\`
\`/filter-tickets compound.logic=AND compound.conditions=[{"filter":"priority","criteria":{"priority":"high"}},{"filter":"state","criteria":{"state":"open"}}]\`

**Simple Filters:**
\`/filter-tickets state=open priority=high\`
\`/filter-tickets assignee=agent123 category=technical\`

Use \`/help\` for basic commands or contact support for complex filtering needs.`;
  }

  /**
   * Summarize filter configuration for display
   */
  summarizeFilterConfig(config) {
    const parts = [];

    Object.entries(config).forEach(([key, value]) => {
      if (typeof value === 'object' && value !== null) {
        if (Array.isArray(value)) {
          parts.push(`${key}: ${value.join(', ')}`);
        } else {
          const subParts = Object.entries(value)
            .map(([subKey, subValue]) => `${subKey}:${subValue}`)
            .join(', ');
          parts.push(`${key}: {${subParts}}`);
        }
      } else {
        parts.push(`${key}: ${value}`);
      }
    });

    return parts.join(' | ');
  }

  async generateTicketStats(period) {
    try {
      const tickets = await intercomService.getTickets({ page: 1, perPage: 100 });

      // Filter by period (simplified)
      let filteredTickets = tickets.tickets;
      const now = new Date();

      if (period === 'week') {
        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        filteredTickets = tickets.tickets.filter((ticket) =>
          new Date(ticket.created_at) >= weekAgo
        );
      } else if (period === 'month') {
        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        filteredTickets = tickets.tickets.filter((ticket) =>
          new Date(ticket.created_at) >= monthAgo
        );
      }

      const stats = {
        period,
        total: filteredTickets.length,
        byState: {},
        byPriority: {},
        byAssignee: {},
        avgResolutionTime: 0,
        openTickets: 0,
        resolvedTickets: 0
      };

      filteredTickets.forEach((ticket) => {
        const state = ticket.ticket_attributes?.state || 'unknown';
        const priority = ticket.ticket_attributes?.priority || 'unknown';
        const assignee = ticket.assignee?.name || 'Unassigned';

        stats.byState[state] = (stats.byState[state] || 0) + 1;
        stats.byPriority[priority] = (stats.byPriority[priority] || 0) + 1;
        stats.byAssignee[assignee] = (stats.byAssignee[assignee] || 0) + 1;

        if (state === 'open' || state === 'pending') {
          stats.openTickets++;
        } else if (state === 'resolved' || state === 'closed') {
          stats.resolvedTickets++;
        }
      });

      return stats;
    } catch (error) {
      logger.error('❌ Failed to generate ticket stats', { error: error.message });
      throw error;
    }
  }

  formatStatsMessage(stats) {
    const { period, total } = stats;

    let message = `📊 **Ticket Statistics** (${period})\n\n`;
    message += `**Total Tickets:** ${total}\n`;
    message += `**Open:** ${stats.openTickets} | **Resolved:** ${stats.resolvedTickets}\n\n`;

    if (total > 0) {
      message += '**By Status:**\n';
      Object.entries(stats.byState).forEach(([state, count]) => {
        const icon = {
          open: '🔴',
          pending: '🟡',
          resolved: '🟢',
          closed: '✅'
        }[state] || '⚪';
        message += `${icon} ${state}: ${count}\n`;
      });

      message += '\n**By Priority:**\n';
      Object.entries(stats.byPriority).forEach(([priority, count]) => {
        const icon = {
          low: '🔵',
          normal: '🟡',
          high: '🟠',
          urgent: '🔴'
        }[priority] || '⚪';
        message += `${icon} ${priority}: ${count}\n`;
      });

      message += '\n**Top Assignees:**\n';
      Object.entries(stats.byAssignee)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 5)
        .forEach(([assignee, count]) => {
          message += `👤 ${assignee}: ${count}\n`;
        });
    }

    return message;
  }

  formatHelpMessage() {
    let message = '🤖 **Ticket Bot Commands**\n\n';

    this.commands.forEach((command, name) => {
      message += `**${name}** - ${command.description}\n`;
      message += `   Usage: ${command.usage}\n\n`;
    });

    message += '💡 **Tips:**\n';
    message += '• Use filters like state=open, priority=high\n';
    message += '• Subscribe to get automatic updates\n';
    message += '• Use /ticket <id> for detailed information';

    return message;
  }

  /**
   * Send message to Lark chat
   */
  async sendMessage(chatId, content) {
    try {
      return await larkService.sendMessage(chatId, { text: content }, 'text');
    } catch (error) {
      logger.error('❌ Failed to send message', { chatId, error: error.message });
      throw error;
    }
  }

  /**
   * Send error message
   */
  async sendErrorMessage(chatId, errorMessage) {
    const message = `❌ **Error**\n\n${errorMessage}\n\nUse /help for available commands.`;
    return await this.sendMessage(chatId, message);
  }

  /**
   * Send help message
   */
  async sendHelpMessage(chatId) {
    const message = '👋 **Welcome to Ticket Bot!**\n\nI can help you with ticket information and status updates.\n\nUse /help to see all available commands.';
    return await this.sendMessage(chatId, message);
  }

  /**
   * Send ticket update notification
   */
  async sendTicketUpdate(chatId, ticket, updateType = 'status_change') {
    const message = this.formatTicketUpdateMessage(ticket, updateType);
    return await this.sendMessage(chatId, message);
  }

  formatTicketUpdateMessage(ticket, updateType) {
    const state = ticket.ticket_attributes?.state || 'unknown';
    const stateIcon = {
      open: '🔴',
      pending: '🟡',
      resolved: '🟢',
      closed: '✅'
    }[state] || '⚪';

    return `🔔 **Ticket Update**

**ID:** ${ticket.id}
**Status:** ${stateIcon} ${state.toUpperCase()}
**Update Type:** ${updateType.replace('_', ' ').toUpperCase()}
**Time:** ${new Date().toLocaleString()}

Use \`/ticket ${ticket.id}\` for full details.`;
  }

  /**
   * Get service health status
   */
  getHealthStatus() {
    return {
      initialized: this.isInitialized,
      commandsLoaded: this.commands.size,
      subscriptions: this.subscriptions.size,
      larkService: larkService.getHealthStatus()
    };
  }

  ensureInitialized() {
    if (!this.isInitialized) {
      throw new Error('Chatbot service is not initialized. Call initialize() first.');
    }
  }
}

// Create singleton instance
const chatbotService = new ChatbotService();

module.exports = chatbotService;
