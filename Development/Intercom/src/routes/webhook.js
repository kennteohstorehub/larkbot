const express = require('express');
const router = express.Router();
const chatbotService = require('../services/chatbot');
const l2OnsiteMonitor = require('../services/l2-onsite-monitor');
const logger = require('../utils/logger');
const crypto = require('crypto');

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
 * Handle Lark webhook validation (HEAD request)
 */
router.head('/lark', (req, res) => {
  logger.info('🔍 Lark webhook endpoint validation (HEAD request)');
  res.status(200).end();
});

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
    .map(element => {
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
 * Handle Intercom webhook validation (HEAD request)
 * Intercom sends HEAD requests to validate webhook endpoints
 */
router.head('/intercom', (req, res) => {
  logger.info('🔍 Intercom webhook endpoint validation (HEAD request)');
  res.status(200).end();
});

/**
 * Handle Intercom webhook events
 * This is what processes ticket status changes from Intercom
 */
router.post('/intercom', async (req, res) => {
  try {
    const { type, data } = req.body;
    
    logger.info('📧 Received Intercom webhook', { type, ticketId: data?.item?.id });

    // First, check if this is an L2 onsite support ticket
    const conversation = data?.item;
    if (conversation) {
      // Process through L2 onsite monitor
      const processed = await l2OnsiteMonitor.processWebhook(req.body);
      
      if (processed) {
        logger.info('✅ L2 onsite ticket processed successfully', { 
          ticketId: conversation.id,
          webhookType: type 
        });
      }
    }

    // Handle different Intercom event types
    switch (type) {
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
        await handleTicketNoteAdded(data);
        break;
        
      default:
        logger.info('Unhandled Intercom event type', { type });
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
  const assignee = data.assignee;
  
  logger.info('🎫 Ticket assigned', { ticketId: ticket.id, assignee: assignee?.name });
  
  // Send notification to Lark chat group
  await sendTicketUpdateToLark(ticket, 'assigned', {
    assignee: assignee?.name || 'Unknown',
    status: 'in_progress'
  });
}

async function handleTicketClosed(data) {
  const ticket = data.item;
  const admin = data.admin;
  
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
  const admin = data.admin;
  
  logger.info('🎫 Ticket replied', { ticketId: ticket.id, repliedBy: admin?.name });
  
  await sendTicketUpdateToLark(ticket, 'replied', {
    repliedBy: admin?.name || 'Agent',
    status: 'in_progress'
  });
}

async function handleTicketNoteAdded(data) {
  const ticket = data.item;
  const admin = data.admin;
  
  logger.info('🎫 Ticket note added', { ticketId: ticket.id, noteBy: admin?.name });
  
  await sendTicketUpdateToLark(ticket, 'note_added', {
    noteBy: admin?.name || 'Agent',
    status: 'in_progress'
  });
}

/**
 * Send ticket update to configured Lark chat group
 */
async function sendTicketUpdateToLark(ticket, eventType, metadata = {}) {
  try {
    // Get the configured Lark chat group ID from environment
    const larkChatId = process.env.LARK_CHAT_GROUP_ID;
    
    if (!larkChatId) {
      logger.warn('No Lark chat group configured for ticket updates');
      return;
    }
    
    // Format the message for Lark
    const message = formatTicketUpdateMessage(ticket, eventType, metadata);
    
    // Send to Lark using the chatbot service
    await chatbotService.sendMessage(larkChatId, message);
    
    logger.info('✅ Ticket update sent to Lark', { 
      ticketId: ticket.id, 
      eventType, 
      chatId: larkChatId 
    });
    
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
  
  message += `\n[View in Intercom](https://app.intercom.io/a/apps/${process.env.INTERCOM_APP_ID}/inbox/conversation/${ticket.id})`;
  
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
      messageId: 'test_' + Date.now()
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