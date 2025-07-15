#!/usr/bin/env node

/**
 * Intercom Webhook Debugging and Manual Testing Script
 * Helps troubleshoot UI issues and provides manual webhook testing
 */

const readline = require('readline');
const axios = require('axios');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

class IntercomWebhookDebugger {
  constructor() {
    this.webhookUrl = process.env.WEBHOOK_URL || 'https://l2-onsite-monitor.onrender.com/webhook/intercom';
  }

  async main() {
    console.log('🔧 Intercom Webhook Debug & Test Tool');
    console.log('=====================================\n');

    console.log('Current webhook URL:', this.webhookUrl);
    console.log('');

    while (true) {
      console.log('Available options:');
      console.log('1. Browser troubleshooting guide');
      console.log('2. Test webhook endpoint manually');
      console.log('3. Simulate L2 onsite ticket webhook');
      console.log('4. Generate Intercom support request');
      console.log('5. Check webhook endpoint health');
      console.log('6. Exit');
      console.log('');

      const choice = await this.prompt('Choose an option (1-6): ');

      switch (choice) {
        case '1':
          this.showBrowserTroubleshooting();
          break;
        case '2':
          await this.testWebhookEndpoint();
          break;
        case '3':
          await this.simulateL2OnsiteWebhook();
          break;
        case '4':
          this.generateSupportRequest();
          break;
        case '5':
          await this.checkWebhookHealth();
          break;
        case '6':
          console.log('Goodbye!');
          rl.close();
          return;
        default:
          console.log('Invalid option. Please try again.\n');
      }
    }
  }

  showBrowserTroubleshooting() {
    console.log('\n🌐 Browser Troubleshooting Guide');
    console.log('================================\n');

    console.log('💡 Step 1: Clear Browser Data');
    console.log('- Press Ctrl+Shift+Delete (or Cmd+Shift+Delete on Mac)');
    console.log('- Select "All time" as time range');
    console.log('- Check: Cookies, Cached images/files, Browsing data');
    console.log('- Clear data and restart browser\n');

    console.log('💡 Step 2: Try Different Browsers');
    console.log('- Chrome (try incognito mode)');
    console.log('- Firefox (try private browsing)');
    console.log('- Safari');
    console.log('- Edge\n');

    console.log('💡 Step 3: Disable Browser Extensions');
    console.log('- Go to Extensions/Add-ons page');
    console.log('- Disable all extensions temporarily');
    console.log('- Refresh Intercom Developer Hub\n');

    console.log('💡 Step 4: Check Developer Console');
    console.log('- Press F12 to open developer tools');
    console.log('- Go to Console tab');
    console.log('- Look for JavaScript errors in red');
    console.log('- Take screenshot if you see errors\n');

    console.log('💡 Step 5: Try Different Network');
    console.log('- Try mobile data instead of WiFi');
    console.log('- Try different WiFi network');
    console.log('- Use VPN if available\n');

    console.log('💡 Step 6: URL Variations to Try');
    console.log('- https://developers.intercom.com/');
    console.log('- https://app.intercom.com/developers/');
    console.log('- https://developers.intercom.com/building-apps/');
    console.log('');
  }

  async testWebhookEndpoint() {
    console.log('\n🧪 Testing Webhook Endpoint');
    console.log('============================\n');

    try {
      console.log('Testing webhook endpoint:', this.webhookUrl);
      
      const testPayload = {
        type: 'test_webhook',
        data: {
          item: {
            id: 'test_123',
            subject: 'Test webhook',
            created_at: Math.floor(Date.now() / 1000)
          }
        }
      };

      const response = await axios.post(this.webhookUrl, testPayload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Intercom-Debug-Tool/1.0'
        },
        timeout: 10000
      });

      console.log('✅ Webhook endpoint responded successfully!');
      console.log('Status:', response.status);
      console.log('Response:', JSON.stringify(response.data, null, 2));

    } catch (error) {
      console.log('❌ Webhook endpoint test failed:');
      
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Response:', error.response.data);
      } else if (error.request) {
        console.log('Network error - could not reach endpoint');
      } else {
        console.log('Error:', error.message);
      }
    }

    console.log('');
  }

  async simulateL2OnsiteWebhook() {
    console.log('\n🎫 Simulating L2 Onsite Ticket Webhook');
    console.log('======================================\n');

    const l2OnsitePayload = {
      type: 'conversation.admin.opened',
      app_id: '***REMOVED***',
      data: {
        type: 'notification_event_data',
        item: {
          type: 'conversation',
          id: '215469859646348',
          created_at: Math.floor(Date.now() / 1000),
          updated_at: Math.floor(Date.now() / 1000),
          conversation_parts: {
            conversation_parts: [{
              body: 'L2 onsite support request: Site inspection needed for new merchant setup'
            }]
          },
          custom_attributes: {
            'Ticket Type': 'L2 Onsite Support',
            'Onsite Request Type': '👥 Site Inspection - New Merchant',
            'Merchant Name': 'Test Merchant',
            'Country / Market': '🇲🇾 Malaysia',
            'Requestor': 'Sarah Johnson (CX Care : T1 or T2)',
            'PIC': 'John Doe',
            'PIC Email': 'john@testmerchant.com',
            'PIC Contact': '60123456789',
            'Address': '123 Test Street, Kuala Lumpur, Malaysia',
            'Description': 'Site inspection required for new merchant setup. Express request - 3 hours onsite needed.',
            'Urgency': 'EXPRESS',
            'Hours Required': '3'
          },
          teammates: {
            teammates: [{
              id: '5372074',
              name: 'L2 Onsite Support Team'
            }]
          },
          assignee: {
            type: 'team',
            id: '5372074'
          }
        }
      },
      links: {},
      id: `notif_${Date.now()}`,
      topic: 'conversation.admin.opened',
      delivery_status: 'pending',
      delivery_attempts: 1,
      delivered_at: 0,
      first_sent_at: Math.floor(Date.now() / 1000),
      created_at: Math.floor(Date.now() / 1000)
    };

    try {
      console.log('Sending L2 onsite ticket simulation...');
      
      const response = await axios.post(this.webhookUrl, l2OnsitePayload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Intercom-Webhook/1.0'
        },
        timeout: 10000
      });

      console.log('✅ L2 onsite webhook simulation successful!');
      console.log('Status:', response.status);
      console.log('');
      console.log('🔍 Check your Lark chat group for the notification!');
      console.log('Expected message format:');
      console.log('---');
      console.log('🚨 L2 ONSITE SUPPORT REQUEST');
      console.log('📋 Type: 👥 Site Inspection - New Merchant');
      console.log('🏢 Merchant: Test Merchant');
      console.log('🌍 Location: 🇲🇾 Malaysia');
      console.log('⚡ EXPRESS REQUEST - 3 hours onsite request');
      console.log('---');

    } catch (error) {
      console.log('❌ L2 onsite webhook simulation failed:');
      
      if (error.response) {
        console.log('Status:', error.response.status);
        console.log('Response:', JSON.stringify(error.response.data, null, 2));
      } else {
        console.log('Error:', error.message);
      }
    }

    console.log('');
  }

  generateSupportRequest() {
    console.log('\n📧 Intercom Support Request Template');
    console.log('====================================\n');

    console.log('Copy this template to contact Intercom support:\n');

    console.log('Subject: Webhook UI Issue - Topics/Events Section Not Displaying\n');

    console.log('Dear Intercom Support,\n');

    console.log('I am experiencing an issue with the webhook configuration in the Intercom Developer Hub.\n');

    console.log('Problem Description:');
    console.log('- I can access the Developer Hub and my app settings');
    console.log('- I can navigate to the Webhooks section');
    console.log('- I can set the webhook endpoint URL successfully');
    console.log('- However, the "Topics/Events" section is not appearing');
    console.log('- Without this section, I cannot subscribe to webhook events\n');

    console.log('App Details:');
    console.log('- App ID: ***REMOVED***');
    console.log('- Webhook URL: ' + this.webhookUrl);
    console.log('- Required events: conversation.admin.opened, conversation.admin.assigned, etc.\n');

    console.log('Troubleshooting Already Tried:');
    console.log('- Multiple browsers (Chrome, Firefox, Safari)');
    console.log('- Incognito/private browsing modes');
    console.log('- Cleared browser cache and cookies');
    console.log('- Disabled browser extensions');
    console.log('- Different networks and devices');
    console.log('- Checked permissions on Authentication page\n');

    console.log('Request:');
    console.log('Could you please either:');
    console.log('1. Fix the UI issue preventing webhook event subscription, or');
    console.log('2. Manually configure webhook events for my app, or');
    console.log('3. Provide an alternative method to subscribe to webhook events\n');

    console.log('The webhook endpoint is working correctly (tested successfully),');
    console.log('I just need to subscribe to the conversation events.\n');

    console.log('Thank you for your assistance.\n');

    console.log('Contact Intercom Support:');
    console.log('- https://www.intercom.com/help/en/articles/2966875-contact-us');
    console.log('- Use "Developer Help" or "API/Integration" as category');
    console.log('');
  }

  async checkWebhookHealth() {
    console.log('\n🏥 Webhook Health Check');
    console.log('=======================\n');

    try {
      // Test the base URL health
      const baseUrl = this.webhookUrl.replace('/webhook/intercom', '');
      
      console.log('Testing base application health...');
      const healthResponse = await axios.get(`${baseUrl}/health`, { timeout: 5000 });
      
      console.log('✅ Application health:', healthResponse.data);

      // Test webhook endpoint specifically
      console.log('\nTesting webhook endpoint...');
      const webhookTestResponse = await axios.post(this.webhookUrl, 
        { test: 'health_check' }, 
        { 
          headers: { 'Content-Type': 'application/json' },
          timeout: 5000 
        }
      );

      console.log('✅ Webhook endpoint responsive');
      console.log('Status:', webhookTestResponse.status);

    } catch (error) {
      console.log('❌ Health check failed:');
      console.log('Error:', error.message);
    }

    console.log('');
  }

  prompt(question) {
    return new Promise((resolve) => {
      rl.question(question, (answer) => {
        resolve(answer.trim());
      });
    });
  }
}

// Run the debugger
if (require.main === module) {
  const debugTool = new IntercomWebhookDebugger();
  debugTool.main().catch(console.error);
}

module.exports = IntercomWebhookDebugger; 