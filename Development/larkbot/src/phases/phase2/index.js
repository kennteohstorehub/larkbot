const path = require('path');
const { intercomService, exportService } = require('../../services');
const logger = require('../../utils/logger');

/**
 * Phase 2: Advanced Filtering & Data Processing
 *
 * This phase focuses on:
 * - Advanced filtering mechanisms
 * - Data transformation pipelines
 * - Automated categorization
 * - Smart data processing
 */

class Phase2Implementation {
  constructor() {
    this.filters = new Map();
    this.processors = new Map();
    this.categories = new Map();
    this.rules = [];
  }

  /**
   * Initialize Phase 2 with advanced filtering capabilities
   */
  async initialize() {
    logger.info('🔍 Initializing Phase 2: Advanced Filtering & Data Processing');

    // Initialize services
    await intercomService.initialize();
    await exportService.initialize();

    // Setup default filters
    this.setupDefaultFilters();

    // Setup data processors
    this.setupDataProcessors();

    // Setup categorization rules
    this.setupCategorizationRules();

    logger.info('✅ Phase 2 initialized successfully');
  }

  /**
   * Setup default filtering mechanisms
   */
  setupDefaultFilters() {
    // Priority-based filters
    this.filters.set('priority', {
      name: 'Priority Filter',
      description: 'Filter conversations by priority level',
      apply: (data, criteria) => {
        const { priority } = criteria;
        return data.filter((item) =>
          item.priority === priority ||
          (item.ticket_attributes && item.ticket_attributes.priority === priority)
        );
      }
    });

    // Date range filters
    this.filters.set('dateRange', {
      name: 'Date Range Filter',
      description: 'Filter by creation or update date range',
      apply: (data, criteria) => {
        const { startDate, endDate, field = 'created_at' } = criteria;
        const start = new Date(startDate).getTime();
        const end = new Date(endDate).getTime();

        return data.filter((item) => {
          const itemDate = new Date(item[field]).getTime();
          return itemDate >= start && itemDate <= end;
        });
      }
    });

    // State-based filters
    this.filters.set('state', {
      name: 'State Filter',
      description: 'Filter by conversation or ticket state',
      apply: (data, criteria) => {
        const { states } = criteria;
        return data.filter((item) =>
          states.includes(item.state) ||
          (item.ticket_attributes && states.includes(item.ticket_attributes.state))
        );
      }
    });

    // Tag-based filters
    this.filters.set('tags', {
      name: 'Tag Filter',
      description: 'Filter by tags',
      apply: (data, criteria) => {
        const { tags, mode = 'any' } = criteria; // 'any' or 'all'

        return data.filter((item) => {
          const itemTags = item.tags?.tags?.map((tag) => tag.name) || [];

          if (mode === 'all') {
            return tags.every((tag) => itemTags.includes(tag));
          }
          return tags.some((tag) => itemTags.includes(tag));
        });
      }
    });

    // Assignee filters
    this.filters.set('assignee', {
      name: 'Assignee Filter',
      description: 'Filter by assigned team member',
      apply: (data, criteria) => {
        const { assigneeIds, includeUnassigned = false } = criteria;

        return data.filter((item) => {
          if (!item.assignee && includeUnassigned) return true;
          if (!item.assignee) return false;

          return assigneeIds.includes(item.assignee.id);
        });
      }
    });

    // Customer filters
    this.filters.set('customer', {
      name: 'Customer Filter',
      description: 'Filter by customer attributes',
      apply: (data, criteria) => {
        const { email, name, customAttributes } = criteria;

        return data.filter((item) => {
          const contacts = item.contacts?.contacts || [];

          return contacts.some((contact) => {
            if (email && contact.email && contact.email.includes(email)) return true;
            if (name && contact.name && contact.name.includes(name)) return true;

            if (customAttributes) {
              for (const [key, value] of Object.entries(customAttributes)) {
                if (contact.custom_attributes?.[key] === value) return true;
              }
            }

            return false;
          });
        });
      }
    });

    // Custom data attributes filter
    this.filters.set('customAttributes', {
      name: 'Custom Attributes Filter',
      description: 'Filter by ticket custom data attributes',
      apply: (data, criteria) => {
        const { attributes, matchMode = 'any' } = criteria; // 'any' or 'all'

        return data.filter((item) => {
          const ticketAttributes = item.custom_attributes || {};
          const contactAttributes = item.contacts?.contacts?.[0]?.custom_attributes || {};
          const allAttributes = { ...ticketAttributes, ...contactAttributes };

          const matches = Object.entries(attributes).map(([key, expectedValue]) => {
            const actualValue = allAttributes[key];

            // Support different comparison modes
            if (Array.isArray(expectedValue)) {
              return expectedValue.includes(actualValue);
            } if (typeof expectedValue === 'object' && expectedValue.operator) {
              return this.compareValues(actualValue, expectedValue.value, expectedValue.operator);
            }
            return actualValue === expectedValue;
          });

          return matchMode === 'all' ? matches.every(Boolean) : matches.some(Boolean);
        });
      }
    });

    // Ticket type filter
    this.filters.set('ticketType', {
      name: 'Ticket Type Filter',
      description: 'Filter by specific ticket types or categories',
      apply: (data, criteria) => {
        const { types, categories, sources } = criteria;

        return data.filter((item) => {
          // Check ticket type
          if (types && types.length > 0) {
            const ticketType = item.ticket_attributes?.type || item.type;
            if (!types.includes(ticketType)) return false;
          }

          // Check category
          if (categories && categories.length > 0) {
            const category = item.ticket_attributes?.category || item.category;
            if (!categories.includes(category)) return false;
          }

          // Check source
          if (sources && sources.length > 0) {
            const source = item.source?.type || item.ticket_attributes?.source;
            if (!sources.includes(source)) return false;
          }

          return true;
        });
      }
    });

    // Advanced compound filter
    this.filters.set('compound', {
      name: 'Compound Filter',
      description: 'Combine multiple filter conditions with AND/OR logic',
      apply: (data, criteria) => {
        const { conditions, logic = 'AND' } = criteria;

        return data.filter((item) => {
          const results = conditions.map((condition) => {
            const filter = this.filters.get(condition.filter);
            if (!filter) return false;

            try {
              const filtered = filter.apply([item], condition.criteria);
              return filtered.length > 0;
            } catch (error) {
              logger.warn(`Filter ${condition.filter} failed`, { error: error.message });
              return false;
            }
          });

          return logic === 'OR' ? results.some(Boolean) : results.every(Boolean);
        });
      }
    });

    logger.info(`✅ Loaded ${this.filters.size} filter types`);
  }

  /**
   * Helper method for value comparison in custom attribute filters
   */
  compareValues(actualValue, expectedValue, operator) {
    switch (operator) {
      case 'equals':
        return actualValue === expectedValue;
      case 'contains':
        return String(actualValue).includes(String(expectedValue));
      case 'startsWith':
        return String(actualValue).startsWith(String(expectedValue));
      case 'endsWith':
        return String(actualValue).endsWith(String(expectedValue));
      case 'greaterThan':
        return Number(actualValue) > Number(expectedValue);
      case 'lessThan':
        return Number(actualValue) < Number(expectedValue);
      case 'greaterThanOrEqual':
        return Number(actualValue) >= Number(expectedValue);
      case 'lessThanOrEqual':
        return Number(actualValue) <= Number(expectedValue);
      case 'regex':
        return new RegExp(expectedValue).test(String(actualValue));
      case 'notEquals':
        return actualValue !== expectedValue;
      default:
        return actualValue === expectedValue;
    }
  }

  /**
   * Setup data processors for transformation
   */
  setupDataProcessors() {
    // Conversation enrichment
    this.processors.set('enrichConversations', {
      name: 'Conversation Enricher',
      description: 'Enrich conversations with additional computed fields',
      process: (conversations) => conversations.map((conv) => ({
        ...conv,
        // Add computed fields
        responseTime: this.calculateResponseTime(conv),
        sentiment: this.analyzeSentiment(conv),
        complexity: this.assessComplexity(conv),
        customerType: this.classifyCustomer(conv),
        urgencyScore: this.calculateUrgencyScore(conv),
        // Add metadata
        processed_at: new Date().toISOString(),
        processing_version: '2.0'
      }))
    });

    // Ticket analysis
    this.processors.set('analyzeTickets', {
      name: 'Ticket Analyzer',
      description: 'Analyze tickets for patterns and insights',
      process: (tickets) => tickets.map((ticket) => ({
        ...ticket,
        // Analysis fields
        resolutionTime: this.calculateResolutionTime(ticket),
        escalationRisk: this.assessEscalationRisk(ticket),
        similarTickets: this.findSimilarTickets(ticket, tickets),
        automationPotential: this.assessAutomationPotential(ticket),
        // Add metadata
        analyzed_at: new Date().toISOString(),
        analysis_version: '2.0'
      }))
    });

    // Contact enhancement
    this.processors.set('enhanceContacts', {
      name: 'Contact Enhancer',
      description: 'Enhance contacts with behavioral insights',
      process: (contacts) => contacts.map((contact) => ({
        ...contact,
        // Behavioral insights
        engagementLevel: this.calculateEngagementLevel(contact),
        supportHistory: this.analyzeSupportHistory(contact),
        riskLevel: this.assessCustomerRisk(contact),
        valueScore: this.calculateCustomerValue(contact),
        // Add metadata
        enhanced_at: new Date().toISOString(),
        enhancement_version: '2.0'
      }))
    });

    logger.info(`✅ Loaded ${this.processors.size} data processors`);
  }

  /**
   * Setup automated categorization rules
   */
  setupCategorizationRules() {
    // Technical issue categorization
    this.rules.push({
      name: 'Technical Issues',
      condition: (item) => {
        const text = this.extractText(item).toLowerCase();
        const technicalKeywords = ['bug', 'error', 'crash', 'broken', 'api', 'integration', 'technical'];
        return technicalKeywords.some((keyword) => text.includes(keyword));
      },
      category: 'technical',
      priority: 'high',
      tags: ['technical-support']
    });

    // Billing categorization
    this.rules.push({
      name: 'Billing Issues',
      condition: (item) => {
        const text = this.extractText(item).toLowerCase();
        const billingKeywords = ['payment', 'billing', 'invoice', 'charge', 'refund', 'subscription'];
        return billingKeywords.some((keyword) => text.includes(keyword));
      },
      category: 'billing',
      priority: 'medium',
      tags: ['billing-support']
    });

    // Feature request categorization
    this.rules.push({
      name: 'Feature Requests',
      condition: (item) => {
        const text = this.extractText(item).toLowerCase();
        const featureKeywords = ['feature', 'request', 'enhancement', 'improvement', 'suggestion'];
        return featureKeywords.some((keyword) => text.includes(keyword));
      },
      category: 'feature_request',
      priority: 'low',
      tags: ['feature-request']
    });

    // Urgent issue categorization
    this.rules.push({
      name: 'Urgent Issues',
      condition: (item) => {
        const text = this.extractText(item).toLowerCase();
        const urgentKeywords = ['urgent', 'critical', 'emergency', 'asap', 'immediately'];
        return urgentKeywords.some((keyword) => text.includes(keyword));
      },
      category: 'urgent',
      priority: 'urgent',
      tags: ['urgent', 'escalated']
    });

    logger.info(`✅ Loaded ${this.rules.length} categorization rules`);
  }

  /**
   * Apply multiple filters to data
   */
  async applyFilters(data, filterCriteria) {
    logger.info('🔍 Applying filters to data', {
      dataCount: data.length,
      filters: Object.keys(filterCriteria)
    });

    let filteredData = [...data];
    const filterSummary = {};

    for (const [filterName, criteria] of Object.entries(filterCriteria)) {
      const filter = this.filters.get(filterName);
      if (!filter) {
        logger.warn(`Unknown filter: ${filterName}`);
        continue;
      }

      const beforeCount = filteredData.length;
      filteredData = filter.apply(filteredData, criteria);
      const afterCount = filteredData.length;

      filterSummary[filterName] = {
        before: beforeCount,
        after: afterCount,
        filtered: beforeCount - afterCount
      };

      logger.info(`Filter '${filterName}' applied`, {
        before: beforeCount,
        after: afterCount,
        filtered: beforeCount - afterCount
      });
    }

    return {
      filtered: filteredData,
      summary: {
        totalOriginal: data.length,
        totalFiltered: filteredData.length,
        filtersApplied: Object.keys(filterCriteria),
        filterResults: filterSummary
      }
    };
  }

  /**
   * Process data through transformation pipeline
   */
  async processData(data, processorNames = []) {
    logger.info('⚙️ Processing data through pipeline', {
      dataCount: data.length,
      processors: processorNames
    });

    let processedData = [...data];

    for (const processorName of processorNames) {
      const processor = this.processors.get(processorName);
      if (!processor) {
        logger.warn(`Unknown processor: ${processorName}`);
        continue;
      }

      logger.info(`Applying processor: ${processor.name}`);
      processedData = processor.process(processedData);
    }

    return processedData;
  }

  /**
   * Automatically categorize data using rules
   */
  async categorizeData(data) {
    logger.info('🏷️ Categorizing data using rules', { dataCount: data.length });

    const categorizedData = data.map((item) => {
      const categories = [];
      const suggestedTags = [];
      let suggestedPriority = item.priority;

      // Apply categorization rules
      for (const rule of this.rules) {
        if (rule.condition(item)) {
          categories.push(rule.category);
          suggestedTags.push(...rule.tags);

          // Update priority if rule suggests higher priority
          if (this.isPriorityHigher(rule.priority, suggestedPriority)) {
            suggestedPriority = rule.priority;
          }
        }
      }

      return {
        ...item,
        // Add categorization results
        auto_categories: categories,
        suggested_tags: [...new Set(suggestedTags)],
        suggested_priority: suggestedPriority,
        categorized_at: new Date().toISOString()
      };
    });

    // Log categorization summary
    const categoryStats = {};
    categorizedData.forEach((item) => {
      item.auto_categories.forEach((category) => {
        categoryStats[category] = (categoryStats[category] || 0) + 1;
      });
    });

    logger.info('✅ Categorization complete', { categoryStats });
    return categorizedData;
  }

  /**
   * Run complete Phase 2 workflow
   */
  async run(options = {}) {
    const {
      demo = false,
      filters = {},
      processors = ['enrichConversations'],
      export_format = 'json',
      limit = demo ? 20 : 100
    } = options;

    logger.info('🚀 Running Phase 2: Advanced Filtering & Data Processing', { options });

    try {
      // Step 1: Extract data
      logger.info('📊 Step 1: Extracting data...');
      const conversations = await intercomService.getConversations({ page: 1, perPage: limit });
      const tickets = await intercomService.getTickets({ page: 1, perPage: limit });

      // Step 2: Apply filters
      logger.info('🔍 Step 2: Applying filters...');
      const conversationFilterResult = await this.applyFilters(conversations.conversations, filters);
      const ticketFilterResult = await this.applyFilters(tickets.tickets, filters);
      const filteredConversations = conversationFilterResult.filtered;
      const filteredTickets = ticketFilterResult.filtered;

      // Step 3: Process data
      logger.info('⚙️ Step 3: Processing data...');
      const processedConversations = await this.processData(filteredConversations, processors);
      const processedTickets = await this.processData(filteredTickets, processors);

      // Step 4: Categorize data
      logger.info('🏷️ Step 4: Categorizing data...');
      const categorizedConversations = await this.categorizeData(processedConversations);
      const categorizedTickets = await this.categorizeData(processedTickets);

      // Step 5: Export results
      logger.info('📤 Step 5: Exporting results...');
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');

      const conversationFile = await exportService.exportConversations(
        categorizedConversations,
        export_format,
        `phase2_conversations_${timestamp}`
      );

      const ticketFile = await exportService.exportTickets(
        categorizedTickets,
        export_format,
        `phase2_tickets_${timestamp}`
      );

      // Step 6: Generate summary
      const summary = this.generateSummary({
        conversations: categorizedConversations,
        tickets: categorizedTickets,
        filters,
        processors
      });

      logger.info('✅ Phase 2 completed successfully', {
        conversationFile,
        ticketFile,
        summary
      });

      return {
        success: true,
        data: {
          conversations: categorizedConversations,
          tickets: categorizedTickets
        },
        exports: {
          conversations: conversationFile,
          tickets: ticketFile
        },
        summary
      };
    } catch (error) {
      logger.error('❌ Phase 2 failed', { error: error.message });
      throw error;
    }
  }

  // Helper methods for data processing
  calculateResponseTime(conversation) {
    // Mock implementation - calculate average response time
    return Math.floor(Math.random() * 24) + 1; // 1-24 hours
  }

  analyzeSentiment(conversation) {
    // Mock sentiment analysis
    return ['positive', 'neutral', 'negative'][Math.floor(Math.random() * 3)];
  }

  assessComplexity(conversation) {
    // Mock complexity assessment
    const messageCount = conversation.conversation_message?.total_count || 1;
    if (messageCount > 10) return 'high';
    if (messageCount > 5) return 'medium';
    return 'low';
  }

  classifyCustomer(conversation) {
    // Mock customer classification
    return ['new', 'returning', 'vip', 'trial'][Math.floor(Math.random() * 4)];
  }

  calculateUrgencyScore(conversation) {
    // Mock urgency scoring (1-10)
    return Math.floor(Math.random() * 10) + 1;
  }

  calculateResolutionTime(ticket) {
    // Mock resolution time calculation
    return Math.floor(Math.random() * 72) + 1; // 1-72 hours
  }

  assessEscalationRisk(ticket) {
    // Mock escalation risk assessment
    return ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
  }

  findSimilarTickets(ticket, allTickets) {
    // Mock similar ticket finder
    return allTickets.slice(0, 3).map((t) => t.id);
  }

  assessAutomationPotential(ticket) {
    // Mock automation potential assessment
    return ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
  }

  calculateEngagementLevel(contact) {
    // Mock engagement level calculation
    return ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
  }

  analyzeSupportHistory(contact) {
    // Mock support history analysis
    return {
      totalTickets: Math.floor(Math.random() * 20),
      avgResolutionTime: Math.floor(Math.random() * 48) + 1,
      satisfactionScore: Math.floor(Math.random() * 5) + 1
    };
  }

  assessCustomerRisk(contact) {
    // Mock customer risk assessment
    return ['low', 'medium', 'high'][Math.floor(Math.random() * 3)];
  }

  calculateCustomerValue(contact) {
    // Mock customer value calculation
    return Math.floor(Math.random() * 1000) + 100;
  }

  extractText(item) {
    // Extract text from conversation or ticket for analysis
    return [
      item.subject,
      item.ticket_attributes?.subject,
      item.source?.author?.name
    ].filter(Boolean).join(' ');
  }

  isPriorityHigher(priority1, priority2) {
    const priorities = ['low', 'normal', 'medium', 'high', 'urgent'];
    return priorities.indexOf(priority1) > priorities.indexOf(priority2);
  }

  generateSummary(data) {
    const { conversations, tickets, filters, processors } = data;

    return {
      timestamp: new Date().toISOString(),
      phase: 'Phase 2',
      processing: {
        conversations: {
          total: conversations.length,
          categories: this.countCategories(conversations),
          priorities: this.countPriorities(conversations)
        },
        tickets: {
          total: tickets.length,
          categories: this.countCategories(tickets),
          priorities: this.countPriorities(tickets)
        }
      },
      filters_applied: Object.keys(filters),
      processors_used: processors,
      insights: {
        mostCommonCategory: this.getMostCommonCategory([...conversations, ...tickets]),
        averageUrgencyScore: this.getAverageUrgencyScore(conversations),
        highRiskItems: this.countHighRiskItems([...conversations, ...tickets])
      }
    };
  }

  countCategories(items) {
    const counts = {};
    items.forEach((item) => {
      item.auto_categories?.forEach((category) => {
        counts[category] = (counts[category] || 0) + 1;
      });
    });
    return counts;
  }

  countPriorities(items) {
    const counts = {};
    items.forEach((item) => {
      const priority = item.suggested_priority || item.priority || 'unknown';
      counts[priority] = (counts[priority] || 0) + 1;
    });
    return counts;
  }

  getMostCommonCategory(items) {
    const counts = this.countCategories(items);
    return Object.entries(counts).sort(([, a], [, b]) => b - a)[0]?.[0] || 'none';
  }

  getAverageUrgencyScore(conversations) {
    const scores = conversations.map((c) => c.urgencyScore || 0);
    return scores.reduce((a, b) => a + b, 0) / scores.length;
  }

  countHighRiskItems(items) {
    return items.filter((item) =>
      item.escalationRisk === 'high' ||
      item.riskLevel === 'high' ||
      item.urgencyScore > 7
    ).length;
  }
}

// Create and export instance
const phase2 = new Phase2Implementation();

// CLI execution
async function main() {
  const args = process.argv.slice(2);
  const demo = args.includes('--demo');

  try {
    await phase2.initialize();

    // Example filter configuration
    const filters = {
      // dateRange: {
      //   startDate: '2024-01-01',
      //   endDate: '2024-12-31',
      //   field: 'created_at'
      // },
      // priority: { priority: 'high' },
      // state: { states: ['open', 'pending'] }
    };

    const result = await phase2.run({
      demo,
      filters,
      processors: ['enrichConversations', 'analyzeTickets'],
      export_format: 'json',
      limit: demo ? 10 : 50
    });

    console.log('\n🎉 Phase 2 Results:');
    console.log('==================');
    console.log(`✅ Processed ${result.data.conversations.length} conversations`);
    console.log(`✅ Processed ${result.data.tickets.length} tickets`);
    console.log(`📁 Exported to: ${result.exports.conversations}`);
    console.log(`📁 Exported to: ${result.exports.tickets}`);
    console.log('\n📊 Summary:', JSON.stringify(result.summary, null, 2));
  } catch (error) {
    console.error('❌ Phase 2 failed:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}

module.exports = phase2;
