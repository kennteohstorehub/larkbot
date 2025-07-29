#!/usr/bin/env node

/**
 * Test script to verify merchant name display in Lark notifications
 * This sends a test webhook to the local server to check debug logging
 */

const axios = require('axios');

// Test webhook payload with merchant account name
const testPayload = {
  type: 'notification_event',
  topic: 'conversation.admin.replied',
  data: {
    item: {
      id: 'test-ticket-123',
      state: 'open',
      created_at: Math.floor(Date.now() / 1000),
      updated_at: Math.floor(Date.now() / 1000),
      custom_attributes: {
        '🌎 Country': 'Malaysia',
        'Onsite Request Type': '👥 Site Inspection - New Merchant',
        '🆔 Merchant Account Name': 'Test Merchant ABC Sdn Bhd',
        'PIC Name': 'John Doe',
        'PIC Contact Number': '60123456789',
        'FULL Store Address': '123 Test Street, Kuala Lumpur, Malaysia',
        'Onsite request description': 'Need to inspect new POS system installation'
      },
      conversation_parts: {
        conversation_parts: [
          {
            id: 'part-1',
            part_type: 'comment',
            body: 'Initial request for site inspection',
            created_at: Math.floor(Date.now() / 1000) - 3600,
            author: {
              type: 'user',
              name: 'Customer',
              email: 'customer@test.com'
            }
          },
          {
            id: 'part-2',
            part_type: 'note',
            body: 'Admin replied: We will schedule the inspection',
            created_at: Math.floor(Date.now() / 1000),
            author: {
              type: 'admin',
              name: 'Support Agent',
              email: 'agent@storehub.com'
            }
          }
        ]
      }
    },
    admin: {
      name: 'Support Agent',
      email: 'agent@storehub.com'
    }
  }
};

async function sendTestWebhook() {
  try {
    console.log('🚀 Sending test webhook to check merchant name display...');
    console.log('📦 Merchant Account Name in payload:', testPayload.data.item.custom_attributes['🆔 Merchant Account Name']);
    
    const response = await axios.post('http://localhost:3001/webhook/intercom', testPayload, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    console.log('✅ Webhook sent successfully!');
    console.log('Response:', response.data);
    console.log('\n⚡ Check the server logs for debug output showing:');
    console.log('  - 🔍 Custom attributes from webhook');
    console.log('  - 🔍 Custom attributes after API enrichment');
    console.log('  - 🎨 Formatting ticket card with custom attributes');
    console.log('\nThe merchant name should show as "Test Merchant ABC Sdn Bhd" not "Unknown"');
  } catch (error) {
    console.error('❌ Error sending webhook:', error.message);
    if (error.response) {
      console.error('Response data:', error.response.data);
      console.error('Response status:', error.response.status);
    }
    console.log('\n💡 Make sure the server is running with: npm run dev');
  }
}

// Run the test
sendTestWebhook();