const express = require('express');

const router = express.Router();
const crypto = require('crypto');
const chatbotService = require('../services/chatbot');
const logger = require('../utils/logger');

/**
 * Webhook Routes for Lark Suite Integration
 * Handles incoming messages and events from Lark Suite
 */

/**
 * Verify webhook signature
 */
function verifySignature(req, res, next) {
  const signature = req.headers['x-lark-signature'];
  const timestamp = req.headers['x-lark-request-timestamp'];
  const nonce = req.headers['x-lark-request-nonce'];

  if (!signature || !timestamp || !nonce) {
    return res.status(401).json({ error: 'Missing required headers' });
  }

  // In production, verify the signature using your webhook secret
  // const expectedSignature = crypto.createHmac('sha256', process.env.LARK_WEBHOOK_SECRET)
  //   .update(timestamp + nonce + JSON.stringify(req.body))
  //   .digest('hex');

  // if (signature !== expectedSignature) {
  //   return res.status(401).json({ error: 'Invalid signature' });
  // }

  next();
}

/**
 * Handle Lark webhook events
 */
router.post('/lark', verifySignature, async (req, res) => {
  try {
    const { type, event } = req.body;

    logger.info('🦜 Received Lark webhook', { type, event: event?.type });

    // Handle different event types
    switch (type) {
      case 'url_verification':
        // Initial webhook verification
        return res.json({ challenge: req.body.challenge });

      case 'event_callback':
        // Handle actual events
        await handleLarkEvent(event);
        break;

      default:
        logger.warn('Unknown Lark webhook type', { type });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('❌ Error handling Lark webhook', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handle Lark events
 */
async function handleLarkEvent(event) {
  const { type } = event;

  switch (type) {
    case 'im.message.receive_v1':
      await handleMessageReceived(event);
      break;

    case 'im.message.message_read_v1':
      await handleMessageRead(event);
      break;

    default:
      logger.info('Unhandled Lark event type', { type });
  }
}

/**
 * Handle incoming messages
 */
async function handleMessageReceived(event) {
  try {
    const { message, sender } = event;

    logger.info('📨 Processing Lark message', {
      messageId: message.message_id,
      chatId: message.chat_id,
      senderId: sender.sender_id?.user_id
    });

    // Skip messages from bots
    if (sender.sender_type === 'bot') {
      return;
    }

    // Parse message content
    const content = parseMessageContent(message);
    if (!content) {
      logger.warn('Could not parse message content', { message });
      return;
    }

    // Process message through chatbot
    const messageData = {
      content,
      chatId: message.chat_id,
      userId: sender.sender_id?.user_id,
      messageType: message.message_type,
      messageId: message.message_id
    };

    await chatbotService.processMessage(messageData);
  } catch (error) {
    logger.error('❌ Error processing Lark message', { error: error.message });
  }
}

/**
 * Handle message read events
 */
async function handleMessageRead(event) {
  logger.info('📖 Message read event', { event });
  // Handle read receipts if needed
}

/**
 * Parse message content based on message type
 */
function parseMessageContent(message) {
  const { message_type, content } = message;

  try {
    const parsedContent = JSON.parse(content);

    switch (message_type) {
      case 'text':
        return parsedContent.text;

      case 'rich_text':
        // Extract text from rich text elements
        return extractTextFromRichText(parsedContent);

      case 'post':
        // Extract text from post content
        return extractTextFromPost(parsedContent);

      default:
        logger.warn('Unsupported message type', { message_type });
        return null;
    }
  } catch (error) {
    logger.error('❌ Error parsing message content', { error: error.message });
    return null;
  }
}

/**
 * Extract text from rich text elements
 */
function extractTextFromRichText(content) {
  if (!content.elements) return '';

  return content.elements
    .map((element) => {
      if (element.tag === 'text') {
        return element.text;
      }
      return '';
    })
    .join(' ')
    .trim();
}

/**
 * Extract text from post content
 */
function extractTextFromPost(content) {
  if (!content.post) return '';

  // Simplified extraction - in practice, you'd need to handle complex post structures
  return JSON.stringify(content.post);
}

/**
 * Handle Intercom webhook events
 * This is what processes ticket status changes from Intercom
 */
router.get('/intercom/version', (req, res) => {
  res.json({ 
    version: '2025-07-17-v3',
    message: 'Webhook handler with all fixes applied',
    timestamp: new Date().toISOString()
  });
});

router.post('/intercom', async (req, res) => {
  try {
    const { type, data, topic } = req.body;

    // Extract the actual event type from either type or topic field
    // When type is "notification_event", use the topic field instead
    const eventType = type === 'notification_event' ? topic : (topic || type);
    
    // DETAILED WEBHOOK PAYLOAD LOGGING
    logger.info('📧 Received Intercom webhook', { 
      type, 
      topic,
      eventType,
      ticketId: data?.item?.id || data?.conversation?.id,
      dataKeys: Object.keys(data || {}),
      hasItem: !!data?.item,
      hasConversation: !!data?.conversation
    });

    // Log if this is being processed as L2 onsite
    const conversationId = data?.item?.id || data?.conversation?.id;
    if (conversationId && type === 'notification_event' && topic) {
      logger.info('Processing L2 onsite webhook', { 
        conversationId,
        topic,
        type
      });
    }

    // Handle different Intercom event types
    switch (eventType) {
      case 'conversation.admin.assigned':
        await handleTicketAssigned(data);
        break;

      case 'conversation.admin.closed':
        await handleTicketClosed(data);
        break;

      case 'conversation.admin.opened':
        await handleTicketOpened(data);
        break;

      case 'conversation.admin.snoozed':
        await handleTicketSnoozed(data);
        break;

      case 'conversation.admin.unsnoozed':
        await handleTicketUnsnoozed(data);
        break;

      case 'conversation.admin.replied':
        await handleTicketReplied(data);
        break;

      case 'conversation.admin.note.created':
      case 'conversation.admin.noted':
        await handleTicketNoteAdded(data);
        break;

      // Additional event types that might contain assignment info
      case 'conversation.state.changed':
        await handleTicketStateChanged(data);
        break;

      case 'conversation.status.changed':
        await handleTicketStatusChanged(data);
        break;

      default:
        logger.info('Unhandled Intercom event type', { 
          type, 
          topic,
          eventType,
          dataStructure: Object.keys(data || {}),
          conversationId: data?.item?.id || data?.conversation?.id
        });
    }

    res.json({ success: true });
  } catch (error) {
    logger.error('❌ Error handling Intercom webhook', { error: error.message });
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * Handle ticket status changes and send to Lark
 */
async function handleTicketAssigned(data) {
  const ticket = data.item;
  const { assignee } = data;

  logger.info('🎫 Ticket assigned', {
    ticketId: ticket.id,
    assignee: assignee?.name,
    teamAssigneeId: ticket.team_assignee_id,
    ticketType: ticket.custom_attributes?.ticket_type,
    isL2Onsite: isL2OnsiteSupport(ticket)
  });

  // Send notification to Lark chat group
  await sendTicketUpdateToLark(ticket, 'assigned', {
    assignee: assignee?.name || 'Unknown',
    status: 'in_progress'
  });
}

async function handleTicketClosed(data) {
  const ticket = data.item;
  const { admin } = data;

  logger.info('🎫 Ticket closed', { ticketId: ticket.id, closedBy: admin?.name });

  await sendTicketUpdateToLark(ticket, 'closed', {
    closedBy: admin?.name || 'System',
    status: 'closed'
  });
}

async function handleTicketOpened(data) {
  const ticket = data.item;

  logger.info('🎫 Ticket opened', { ticketId: ticket.id });

  await sendTicketUpdateToLark(ticket, 'opened', {
    status: 'submitted'
  });
}

async function handleTicketSnoozed(data) {
  const ticket = data.item;

  logger.info('🎫 Ticket snoozed', { ticketId: ticket.id });

  await sendTicketUpdateToLark(ticket, 'snoozed', {
    status: 'pending'
  });
}

async function handleTicketUnsnoozed(data) {
  const ticket = data.item;

  logger.info('🎫 Ticket unsnoozed', { ticketId: ticket.id });

  await sendTicketUpdateToLark(ticket, 'unsnoozed', {
    status: 'in_progress'
  });
}

async function handleTicketReplied(data) {
  const ticket = data.item;
  const { admin } = data;

  logger.info('🎫 Ticket replied', {
    ticketId: ticket.id,
    repliedBy: admin?.name,
    conversationPartsCount: ticket.conversation_parts?.conversation_parts?.length || 0,
    hasConversationParts: !!ticket.conversation_parts
  });

  await sendTicketUpdateToLark(ticket, 'replied', {
    repliedBy: admin?.name || 'Agent',
    status: 'in_progress'
  });
}

async function handleTicketNoteAdded(data) {
  const ticket = data.item;
  const { admin } = data;

  logger.info('🎫 Ticket note added', {
    ticketId: ticket.id,
    noteBy: admin?.name,
    conversationPartsCount: ticket.conversation_parts?.conversation_parts?.length || 0,
    hasConversationParts: !!ticket.conversation_parts
  });

  await sendTicketUpdateToLark(ticket, 'note_added', {
    noteBy: admin?.name || 'Agent',
    status: 'in_progress'
  });
}

async function handleTicketStateChanged(data) {
  const ticket = data.item;
  const { admin } = data;

  logger.info('🎫 Ticket state changed', {
    ticketId: ticket.id,
    state: ticket.state,
    changedBy: admin?.name,
    assignee: ticket.assignee?.name,
    teamAssigneeId: ticket.team_assignee_id
  });

  // If ticket is now assigned, treat as assignment
  if (ticket.assignee || ticket.team_assignee_id) {
    await sendTicketUpdateToLark(ticket, 'assigned', {
      assignee: ticket.assignee?.name || 'Team',
      status: 'in_progress'
    });
  }
}

async function handleTicketStatusChanged(data) {
  const ticket = data.item;
  const { admin } = data;

  logger.info('🎫 Ticket status changed', {
    ticketId: ticket.id,
    state: ticket.state,
    changedBy: admin?.name,
    assignee: ticket.assignee?.name,
    teamAssigneeId: ticket.team_assignee_id
  });

  // If ticket is now assigned, treat as assignment
  if (ticket.assignee || ticket.team_assignee_id) {
    await sendTicketUpdateToLark(ticket, 'assigned', {
      assignee: ticket.assignee?.name || 'Team',
      status: 'in_progress'
    });
  }
}

/**
 * Check if a ticket is for L2 onsite support
 */
function isL2OnsiteSupport(ticket) {
  try {
    // Check if ticket has the required custom attributes
    const customAttributes = ticket.custom_attributes || {};

    // Method 1: Check team assignee ID for L2 Onsite Support Team
    if (ticket.team_assignee_id === '5372074' || ticket.team_assignee_id === 5372074) {
      logger.info('✅ L2 onsite ticket detected by team assignment', { ticketId: ticket.id });
      return true;
    }

    // Method 2: Check ticket type
    if (customAttributes.ticket_type === 'L2 Onsite Support') {
      logger.info('✅ L2 onsite ticket detected by ticket type', { ticketId: ticket.id });
      return true;
    }

    // Method 3: Check custom attribute for Tier 2 Support Type
    const tier2SupportType = customAttributes['🔧Tier 2 Support Type'];
    if (tier2SupportType && (
      tier2SupportType.includes('Onsite Services') ||
      tier2SupportType.toLowerCase().includes('onsite')
    )) {
      logger.info('✅ L2 onsite ticket detected by support type', { ticketId: ticket.id });
      return true;
    }
    
    // Method 3b: Check Ticket category for L2 Onsite
    const ticketCategory = customAttributes['Ticket category'];
    if (ticketCategory && (
      ticketCategory === 'L2 Onsite Support' ||
      ticketCategory.toLowerCase().includes('l2 onsite')
    )) {
      logger.info('✅ L2 onsite ticket detected by ticket category', { ticketId: ticket.id });
      return true;
    }

    // Method 4: Check for site inspection requests (only New or Existing Merchant)
    const onsiteRequestType = customAttributes['Onsite Request Type'];
    const validOnsiteTypes = [
      '👥 Site Inspection - New Merchant',
      '👥 Site Inspection - Existing Merchant'
    ];
    
    if (onsiteRequestType && validOnsiteTypes.includes(onsiteRequestType)) {
      logger.info('✅ L2 onsite ticket detected by onsite request type', { 
        ticketId: ticket.id,
        onsiteRequestType 
      });
      return true;
    }

    // Method 5: Check for keywords in title/body
    const conversationParts = ticket.conversation_parts?.conversation_parts || [];
    const firstPart = conversationParts[0];
    if (firstPart?.body) {
      const bodyText = firstPart.body.toLowerCase();
      if (bodyText.includes('site inspection') || bodyText.includes('onsite support') || bodyText.includes('l2 onsite')) {
        logger.info('✅ L2 onsite ticket detected by keywords in body', { ticketId: ticket.id });
        return true;
      }
    }

    logger.info('❌ Not an L2 onsite support ticket', {
      ticketId: ticket.id,
      teamAssigneeId: ticket.team_assignee_id,
      targetTeamId: '5372074',
      ticketType: customAttributes.ticket_type,
      ticketCategory,
      tier2SupportType,
      onsiteRequestType,
      allCustomAttributes: Object.keys(customAttributes),
      hasConversationParts: !!ticket.conversation_parts,
      checkResults: {
        teamMatch: ticket.team_assignee_id === '5372074' || ticket.team_assignee_id === 5372074,
        ticketTypeMatch: customAttributes.ticket_type === 'L2 Onsite Support',
        ticketCategoryMatch: ticketCategory === 'L2 Onsite Support',
        tier2Match: tier2SupportType && tier2SupportType.toLowerCase().includes('onsite'),
        onsiteMatch: validOnsiteTypes.includes(onsiteRequestType),
        onsiteRequestValue: onsiteRequestType
      }
    });

    return false;
  } catch (error) {
    logger.error('❌ Error checking L2 onsite support status', {
      ticketId: ticket.id,
      error: error.message
    });
    return false;
  }
}

/**
 * Send ticket update to configured Lark chat group
 */
async function sendTicketUpdateToLark(ticket, eventType, metadata = {}) {
  try {
    // Filter: Only send notifications for L2 onsite support tickets
    if (!isL2OnsiteSupport(ticket)) {
      logger.info('⏭️  Skipping non-L2 onsite support ticket', {
        ticketId: ticket.id,
        teamAssigneeId: ticket.team_assignee_id,
        ticketType: ticket.custom_attributes?.ticket_type,
        tier2SupportType: ticket.custom_attributes?.['🔧Tier 2 Support Type']
      });
      return;
    }

    // ENHANCED: Always try to fetch full conversation data from Intercom API
    // Webhook payloads often don't include all conversation parts
    let enrichedTicket = ticket;
    logger.info('🔄 Fetching full conversation data from Intercom API', {
      ticketId: ticket.id,
      eventType,
      hasConversationPartsInWebhook: !!(ticket.conversation_parts && ticket.conversation_parts.conversation_parts && ticket.conversation_parts.conversation_parts.length > 0)
    });

    try {
      // Try to fetch full conversation data from Intercom
      const { intercomService } = require('../services');
      const healthStatus = intercomService?.getHealthStatus?.() || {};
      
      logger.info('📡 Intercom service status - DETAILED', {
        ticketId: ticket.id,
        serviceExists: !!intercomService,
        isInitialized: intercomService?.isInitialized,
        healthStatus,
        environmentCheck: {
          hasIntercomToken: !!process.env.INTERCOM_TOKEN,
          tokenLength: process.env.INTERCOM_TOKEN?.length || 0,
          hasAppId: !!process.env.INTERCOM_APP_ID,
          nodeEnv: process.env.NODE_ENV
        }
      });

      if (intercomService && intercomService.isInitialized) {
        logger.info('🔄 Starting Intercom API call', {
          ticketId: ticket.id,
          apiEndpoint: `/conversations/${ticket.id}`
        });
        
        const fullConversation = await intercomService.getConversation(ticket.id);
        
        logger.info('📥 Intercom API response received', {
          ticketId: ticket.id,
          hasResponse: !!fullConversation,
          responseKeys: fullConversation ? Object.keys(fullConversation) : [],
          hasConversationParts: !!(fullConversation?.conversation_parts),
          conversationPartsCount: fullConversation?.conversation_parts?.conversation_parts?.length || 0,
          // Log the full response structure for debugging
          apiResponse: fullConversation ? JSON.stringify(fullConversation, null, 2) : 'null'
        });
        
        if (fullConversation) {
          // Merge webhook data with API data, preferring API data for conversation_parts
          enrichedTicket = { 
            ...ticket, 
            ...fullConversation,
            // Keep webhook-specific metadata
            team_assignee_id: ticket.team_assignee_id || fullConversation.team_assignee_id,
            custom_attributes: ticket.custom_attributes || fullConversation.custom_attributes
          };
          logger.info('✅ Successfully fetched and merged conversation data from Intercom API', {
            ticketId: ticket.id,
            conversationPartsCount: enrichedTicket.conversation_parts?.conversation_parts?.length || 0,
            hasCustomAttributes: !!enrichedTicket.custom_attributes,
            teamAssigneeId: enrichedTicket.team_assignee_id,
            mergedTicketKeys: Object.keys(enrichedTicket)
          });
        } else {
          logger.warn('⚠️ Intercom API returned empty conversation data', {
            ticketId: ticket.id
          });
        }
      } else {
        logger.warn('⚠️ Intercom service not available for conversation fetching', {
          ticketId: ticket.id,
          serviceExists: !!intercomService,
          isInitialized: intercomService?.isInitialized
        });
      }
    } catch (fetchError) {
      logger.error('❌ Failed to fetch conversation data from Intercom API', {
        ticketId: ticket.id,
        error: fetchError.message,
        stack: fetchError.stack
      });
      // Continue with webhook data only
    }

    // Get the configured Lark chat group IDs from environment
    const allGroups = [
      { name: 'MY/PH FE', id: process.env.LARK_CHAT_GROUP_ID_MYPHFE },
      { name: 'Complex Setup Process', id: process.env.LARK_CHAT_GROUP_ID_COMPLEX_SETUP }
    ];
    
    const chatGroups = allGroups.filter((group) => group.id && group.id !== 'oc_placeholder_for_now' && group.id !== 'oc_myphfe_group_id' && group.id !== 'oc_complex_setup_group_id');
    
    logger.info('🎯 Lark chat group configuration', {
      ticketId: enrichedTicket.id,
      allGroups: allGroups.map(g => ({ name: g.name, id: g.id, isPlaceholder: g.id === 'oc_placeholder_for_now' })),
      filteredGroups: chatGroups.map(g => ({ name: g.name, id: g.id })),
      filteredCount: chatGroups.length,
      environmentVariables: {
        LARK_CHAT_GROUP_ID_MYPHFE: process.env.LARK_CHAT_GROUP_ID_MYPHFE,
        LARK_CHAT_GROUP_ID_COMPLEX_SETUP: process.env.LARK_CHAT_GROUP_ID_COMPLEX_SETUP,
        LARK_CHAT_GROUP_ID: process.env.LARK_CHAT_GROUP_ID
      }
    });

    // FALLBACK: If no specific group IDs are configured, use the main LARK_CHAT_GROUP_ID
    if (chatGroups.length === 0) {
      const fallbackGroupId = process.env.LARK_CHAT_GROUP_ID;
      if (fallbackGroupId && fallbackGroupId !== 'oc_placeholder_for_now') {
        chatGroups.push({ name: 'Main Group', id: fallbackGroupId });
        logger.info('Using fallback Lark chat group', {
          ticketId: ticket.id,
          fallbackGroupId,
          reason: 'No specific group IDs configured'
        });
      } else {
        logger.warn('No valid Lark chat groups configured for ticket updates', {
          ticketId: ticket.id,
          eventType,
          availableGroups: {
            myphfe: process.env.LARK_CHAT_GROUP_ID_MYPHFE,
            complexSetup: process.env.LARK_CHAT_GROUP_ID_COMPLEX_SETUP,
            fallback: process.env.LARK_CHAT_GROUP_ID
          }
        });
        return;
      }
    }

    // Format the message as an interactive card for L2 onsite tickets
    const cardContent = formatTicketAsCard(enrichedTicket, eventType, metadata);
    
    logger.info('📝 Formatted Lark card', {
      ticketId: enrichedTicket.id,
      eventType,
      hasCard: !!cardContent,
      cardTemplate: cardContent?.header?.template
    });

    // Import larkService for sending cards
    const larkService = require('../services/lark');

    // Send to all configured Lark groups
    const sendPromises = chatGroups.map(async (group) => {
      try {
        // Use the new sendInteractiveCard method
        await larkService.sendInteractiveCard(group.id, cardContent);
        logger.info('✅ L2 onsite ticket update sent to Lark group as card', {
          ticketId: enrichedTicket.id,
          eventType,
          chatId: group.id,
          groupName: group.name
        });
      } catch (error) {
        logger.error('❌ Failed to send card to Lark group', {
          ticketId: enrichedTicket.id,
          eventType,
          groupName: group.name,
          chatId: group.id,
          error: error.message
        });
      }
    });

    await Promise.allSettled(sendPromises);
  } catch (error) {
    logger.error('❌ Failed to send ticket update to Lark', {
      ticketId: ticket.id,
      eventType,
      error: error.message
    });
  }
}

/**
 * Format ticket update message for Lark
 */
function formatTicketUpdateMessage(ticket, eventType, metadata = {}) {
  // Check if this is an L2 onsite support ticket
  if (isL2OnsiteSupport(ticket)) {
    return formatL2OnsiteMessage(ticket, eventType, metadata);
  }

  // Regular ticket formatting for non-L2 onsite tickets
  const statusEmojis = {
    submitted: '🆕',
    in_progress: '🔄',
    resolved: '✅',
    closed: '🔒'
  };

  const eventEmojis = {
    opened: '🆕',
    assigned: '👤',
    replied: '💬',
    note_added: '📝',
    snoozed: '😴',
    unsnoozed: '⏰',
    closed: '🔒'
  };

  const status = metadata.status || 'unknown';
  const statusEmoji = statusEmojis[status] || '❓';
  const eventEmoji = eventEmojis[eventType] || '📋';

  let message = `${eventEmoji} **Ticket Update**\n\n`;
  message += `**Ticket ID:** ${ticket.id}\n`;
  message += `**Status:** ${statusEmoji} ${status.replace('_', ' ').toUpperCase()}\n`;
  message += `**Event:** ${eventType.replace('_', ' ').toUpperCase()}\n`;

  if (ticket.conversation_parts && ticket.conversation_parts.conversation_parts) {
    const subject = ticket.conversation_parts.conversation_parts[0]?.body || 'No subject';
    message += `**Subject:** ${subject.substring(0, 100)}${subject.length > 100 ? '...' : ''}\n`;
  }

  if (metadata.assignee) {
    message += `**Assigned to:** ${metadata.assignee}\n`;
  }

  if (metadata.closedBy) {
    message += `**Closed by:** ${metadata.closedBy}\n`;
  }

  if (metadata.repliedBy) {
    message += `**Replied by:** ${metadata.repliedBy}\n`;
  }

  if (metadata.noteBy) {
    message += `**Note by:** ${metadata.noteBy}\n`;
  }

  message += `**Created:** ${new Date(ticket.created_at * 1000).toLocaleString()}\n`;
  message += `**Updated:** ${new Date(ticket.updated_at * 1000).toLocaleString()}\n`;

  // Add all notes/comments if available
  if (ticket.conversation_parts && ticket.conversation_parts.conversation_parts) {
    message += '\n**💬 Recent Activity:**\n';

    const parts = ticket.conversation_parts.conversation_parts
      .slice(-3) // Get last 3 activities
      .reverse(); // Show newest first

    parts.forEach((part, index) => {
      const author = part.author?.name || 'Unknown';
      const body = part.body ? part.body.substring(0, 200) : 'No content';
      const timestamp = new Date(part.created_at * 1000).toLocaleString();

      message += `\n**${author}** (${timestamp}):\n`;
      message += `${body}${body.length > 200 ? '...' : ''}\n`;
    });
  }

  message += `\n[View in Intercom](https://app.intercom.io/a/apps/${process.env.INTERCOM_APP_ID}/inbox/conversation/${ticket.id})`;

  return message;
}

/**
 * Format ticket message as interactive card
 */
function formatTicketAsCard(ticket, eventType, metadata = {}) {
  const customAttrs = ticket.custom_attributes || {};
  
  // Get event type emoji and title
  const eventConfigs = {
    opened: { emoji: '🆕', title: 'NEW SITE INSPECTION REQUEST', template: 'blue' },
    assigned: { emoji: '👤', title: 'SITE INSPECTION ASSIGNED', template: 'blue' },
    replied: { emoji: '💬', title: 'ADMIN REPLY ADDED', template: 'turquoise' },
    note_added: { emoji: '📝', title: 'NOTE ADDED', template: 'yellow' },
    closed: { emoji: '🔒', title: 'SITE INSPECTION CLOSED', template: 'green' },
    reopened: { emoji: '🔄', title: 'SITE INSPECTION REOPENED', template: 'orange' }
  };

  const config = eventConfigs[eventType] || { 
    emoji: '📋', 
    title: 'SITE INSPECTION UPDATE', 
    template: 'blue' 
  };

  // Create card elements
  const elements = [];

  // Basic ticket info section
  const basicInfo = [];
  
  // Add state with color indicator
  const stateColors = {
    open: '🟢',
    closed: '🔴',
    snoozed: '🟡'
  };
  basicInfo.push({
    tag: 'plain_text',
    content: `${stateColors[ticket.state] || '⚪'} State: ${ticket.state || 'open'}`
  });

  // Express request status
  const expressRequest = customAttrs['Express Request - 3 hours Onsite Request'];
  const isExpress = expressRequest && expressRequest.toLowerCase() === 'yes';
  basicInfo.push({
    tag: 'plain_text',
    content: isExpress ? '⚡ EXPRESS (3 HOURS)' : '⏱️ STANDARD REQUEST'
  });

  elements.push({
    tag: 'div',
    fields: basicInfo
  });

  // Merchant details section
  elements.push({
    tag: 'div',
    text: {
      tag: 'lark_md',
      content: `**Merchant Details:**
• **Name:** ${customAttrs['🆔 Merchant Account Name'] || 'Unknown'}
• **Country:** ${customAttrs['🌎 Country'] || 'Unknown'}
• **Contact:** ${customAttrs['PIC Name'] || 'Unknown'} - ${customAttrs['PIC Contact Number'] || 'Unknown'}
• **Address:** ${customAttrs['FULL Store Address'] || 'Unknown'}`
    }
  });

  // Request description if available
  if (customAttrs['Onsite request description']) {
    elements.push({
      tag: 'hr'
    });
    elements.push({
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: `**Request Description:**\n${customAttrs['Onsite request description']}`
      }
    });
  }

  // Conversation and notes section
  if (ticket.conversation_parts && ticket.conversation_parts.conversation_parts && ticket.conversation_parts.conversation_parts.length > 0) {
    elements.push({
      tag: 'hr'
    });
    
    const parts = ticket.conversation_parts.conversation_parts;
    const sortedParts = [...parts].sort((a, b) => a.created_at - b.created_at);
    const recentParts = sortedParts.slice(-5); // Show last 5 for card format

    const conversationContent = recentParts.map(part => {
      const author = part.author?.name || part.author?.email || 'Unknown';
      const timestamp = new Date(part.created_at * 1000).toLocaleString();
      let bodyText = '';
      
      if (part.body) {
        bodyText = part.body
          .replace(/<[^>]*>/g, '')
          .replace(/&nbsp;/g, ' ')
          .replace(/&amp;/g, '&')
          .replace(/&lt;/g, '<')
          .replace(/&gt;/g, '>')
          .replace(/&quot;/g, '"')
          .replace(/&#39;/g, "'")
          .trim();
        
        if (bodyText.length > 300) {
          bodyText = `${bodyText.substring(0, 300)}...`;
        }
      }

      return `**${author}** (${timestamp}):\n${bodyText || '_No content_'}`;
    }).join('\n\n');

    elements.push({
      tag: 'div',
      text: {
        tag: 'lark_md',
        content: `**💬 Recent Activity:**\n\n${conversationContent}`
      }
    });

    if (sortedParts.length > 5) {
      elements.push({
        tag: 'note',
        elements: [{
          tag: 'plain_text',
          content: `... and ${sortedParts.length - 5} more conversation parts`
        }]
      });
    }
  }

  // Add metadata footer
  elements.push({
    tag: 'hr'
  });

  const footerElements = [];
  
  if (metadata.assignee) {
    footerElements.push({
      tag: 'plain_text',
      content: `👤 Assigned to: ${metadata.assignee}`
    });
  }
  
  if (metadata.repliedBy) {
    footerElements.push({
      tag: 'plain_text',
      content: `💬 Replied by: ${metadata.repliedBy}`
    });
  }
  
  if (metadata.noteBy) {
    footerElements.push({
      tag: 'plain_text',
      content: `📝 Note by: ${metadata.noteBy}`
    });
  }

  footerElements.push({
    tag: 'plain_text',
    content: `Updated: ${new Date(ticket.updated_at * 1000).toLocaleString()}`
  });

  elements.push({
    tag: 'note',
    elements: footerElements
  });

  // Add action button
  elements.push({
    tag: 'action',
    actions: [{
      tag: 'button',
      text: {
        tag: 'plain_text',
        content: 'View in Intercom'
      },
      type: 'primary',
      url: `https://app.intercom.io/a/apps/${process.env.INTERCOM_APP_ID}/inbox/conversation/${ticket.id}`
    }]
  });

  // Create the card
  return {
    config: {
      wide_screen_mode: true,
      enable_forward: true
    },
    header: {
      title: {
        content: `${config.emoji} ${config.title}`,
        tag: 'plain_text'
      },
      subtitle: {
        content: `Ticket #${ticket.id}`,
        tag: 'plain_text'
      },
      template: config.template
    },
    elements
  };
}

/**
 * Format L2 onsite support ticket message with enhanced content
 */
function formatL2OnsiteMessage(ticket, eventType, metadata = {}) {
  const customAttrs = ticket.custom_attributes || {};

  // Debug logging to see what data we have
  logger.info('🔍 Formatting L2 onsite message', {
    ticketId: ticket.id,
    eventType,
    hasConversationParts: !!ticket.conversation_parts,
    conversationPartsCount: ticket.conversation_parts?.conversation_parts?.length || 0,
    conversationPartsStructure: ticket.conversation_parts ? Object.keys(ticket.conversation_parts) : 'none',
    ticketKeys: Object.keys(ticket),
    hasBody: !!ticket.body,
    ticketType: ticket.type
  });

  // Get event type emoji and description
  const eventEmojis = {
    opened: '🆕 **NEW SITE INSPECTION REQUEST**',
    assigned: '👤 **SITE INSPECTION ASSIGNED**',
    replied: '💬 **ADMIN REPLY ADDED**',
    note_added: '📝 **NOTE ADDED**',
    closed: '🔒 **SITE INSPECTION CLOSED**',
    reopened: '🔄 **SITE INSPECTION REOPENED**'
  };

  const eventTitle = eventEmojis[eventType] || '📋 **SITE INSPECTION UPDATE**';

  let message = '📋 🔍 **SITE INSPECTION UPDATE**\n\n';
  message += `${eventTitle}\n\n`;

  // Basic ticket information
  message += `**Ticket ID:** ${ticket.id}\n`;
  message += `**State:** ${ticket.state || 'open'}\n`;

  // L2 onsite specific fields
  const expressRequest = customAttrs['Express Request - 3 hours Onsite Request'];
  if (expressRequest && expressRequest.toLowerCase() === 'yes') {
    message += '**Express Request:** ⚡ YES - EXPRESS (3 HOURS)\n';
  } else {
    message += '**Express Request:** ⏱️ NO - STANDARD\n';
  }

  message += `**Merchant:** ${customAttrs['🆔 Merchant Account Name'] || 'Unknown'}\n`;
  message += `**Country:** ${customAttrs['🌎 Country'] || 'Unknown'}\n`;
  message += `**PIC:** ${customAttrs['PIC Name'] || 'Unknown'}\n`;
  message += `**Contact:** ${customAttrs['PIC Contact Number'] || 'Unknown'}\n`;
  message += `**Address:** ${customAttrs['FULL Store Address'] || 'Unknown'}\n`;

  // Add onsite request description if available
  if (customAttrs['Onsite request description']) {
    message += `**Description:** ${customAttrs['Onsite request description']}\n`;
  }

  // Add conversation content and notes - ENHANCED
  logger.info('🔍 Formatting conversation data', {
    ticketId: ticket.id,
    hasConversationParts: !!ticket.conversation_parts,
    conversationPartsStructure: ticket.conversation_parts ? Object.keys(ticket.conversation_parts) : 'none',
    partsCount: ticket.conversation_parts?.conversation_parts?.length || 0
  });

  if (ticket.conversation_parts && ticket.conversation_parts.conversation_parts) {
    const parts = ticket.conversation_parts.conversation_parts;

    if (parts.length > 0) {
      message += '\n💬 **CONVERSATION & NOTES:**\n';

      // Show conversation parts in chronological order (oldest first)
      const sortedParts = [...parts].sort((a, b) => a.created_at - b.created_at);
      
      // Show most recent 10 parts to avoid message being too long
      const recentParts = sortedParts.slice(-10);

      recentParts.forEach((part, index) => {
        const author = part.author?.name || part.author?.email || part.author?.id || 'Unknown';
        const authorType = part.part_type || part.type || 'comment';
        const timestamp = new Date(part.created_at * 1000).toLocaleString();

        // Add type emoji with more types
        const typeEmoji = {
          comment: '💬',
          note: '📝',
          assignment: '👤',
          close: '🔒',
          open: '🔓',
          reply: '↩️',
          user_comment: '👤',
          admin_comment: '👨‍💼',
          ticket_note: '📋'
        }[authorType] || '💬';

        message += `\n${typeEmoji} **${author}** (${authorType}, ${timestamp}):\n`;

        if (part.body) {
          // Clean and format the message body
          let bodyText = part.body
            .replace(/<[^>]*>/g, '') // Remove HTML tags
            .replace(/&nbsp;/g, ' ') // Replace HTML entities
            .replace(/&amp;/g, '&')
            .replace(/&lt;/g, '<')
            .replace(/&gt;/g, '>')
            .replace(/&quot;/g, '"')
            .replace(/&#39;/g, "'")
            .trim();

          // Increased character limit from 300 to 700 for better context
          if (bodyText.length > 700) {
            bodyText = `${bodyText.substring(0, 700)}...`;
          }

          message += `${bodyText}\n`;
        } else {
          message += '_No content_\n';
        }
      });

      if (sortedParts.length > 10) {
        message += `\n_... and ${sortedParts.length - 10} more conversation parts_\n`;
      }
    } else {
      message += '\n💬 **CONVERSATION & NOTES:**\n_No conversation content available_\n';
    }
  } else {
    message += '\n💬 **CONVERSATION & NOTES:**\n_No conversation data available - check Intercom API connectivity_\n';
  }

  // Add metadata if available
  if (eventType === 'replied' && metadata.repliedBy) {
    message += `\n**👨‍💼 Replied by:** ${metadata.repliedBy}\n`;
  }

  if (eventType === 'note_added' && metadata.noteBy) {
    message += `\n**📝 Note by:** ${metadata.noteBy}\n`;
  }

  if (eventType === 'assigned' && metadata.assignee) {
    message += `\n**👤 Assigned to:** ${metadata.assignee}\n`;
  }

  message += `\n**Updated:** ${new Date(ticket.updated_at * 1000).toLocaleString()}\n`;

  // Add link to view ticket
  message += `\n🔗 [View Ticket](https://app.intercom.io/a/apps/${process.env.INTERCOM_APP_ID}/inbox/conversation/${ticket.id})`;

  return message;
}

/**
 * Test endpoint for webhook
 */
router.get('/lark/test', async (req, res) => {
  try {
    await chatbotService.initialize();

    res.json({
      success: true,
      message: 'Lark webhook endpoint is working',
      chatbot: {
        initialized: chatbotService.getHealthStatus().initialized,
        commands: chatbotService.getHealthStatus().commandsLoaded
      }
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

/**
 * Manual message processing endpoint (for testing)
 */
router.post('/lark/test-message', async (req, res) => {
  try {
    const { content, chatId, userId } = req.body;

    if (!content || !chatId) {
      return res.status(400).json({ error: 'Missing required fields: content, chatId' });
    }

    await chatbotService.initialize();

    const messageData = {
      content,
      chatId,
      userId: userId || 'test_user',
      messageType: 'text',
      messageId: `test_${Date.now()}`
    };

    const result = await chatbotService.processMessage(messageData);

    res.json({
      success: true,
      message: 'Message processed successfully',
      result
    });
  } catch (error) {
    logger.error('❌ Error in test message processing', { error: error.message });
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

module.exports = router;
