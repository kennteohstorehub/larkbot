const axios = require('axios');

const webhookUrl = 'http://localhost:3001/webhook/intercom';

// Test payloads that match the Render logs
const testPayloads = [
  {
    name: 'Ticket Closed',
    payload: {
      type: 'notification_event',
      topic: 'conversation.admin.closed',
      data: {
        item: {
          id: '215469840084214',
          team_assignee_id: '5372074', // L2 Onsite Support Team
          state: 'closed',
          created_at: Date.now() / 1000,
          updated_at: Date.now() / 1000,
          custom_attributes: {
            ticket_type: 'L2 Onsite Support',
            'Express Request - 3 hours Onsite Request': 'Yes',
            '🆔 Merchant Account Name': 'Test Merchant Store',
            '🌎 Country': 'Malaysia',
            'PIC Name': 'John Doe',
            'PIC Contact Number': '+60123456789',
            'FULL Store Address': '123 Test Street, Kuala Lumpur, Malaysia',
            'Onsite request description': 'Need help setting up new POS terminal'
          },
          conversation_parts: {
            conversation_parts: [
              {
                created_at: (Date.now() / 1000) - 3600,
                author: {
                  name: 'John Doe',
                  email: 'john@teststore.com'
                },
                part_type: 'comment',
                body: 'Hi, I need help setting up the new POS terminal at my store. The device is not connecting to our network properly.'
              },
              {
                created_at: (Date.now() / 1000) - 1800,
                author: {
                  name: 'Support Agent',
                  email: 'agent@company.com'
                },
                part_type: 'admin_comment',
                body: 'Thank you for contacting us. I will arrange for a technician to visit your site for the POS setup. Please ensure someone is available at the store during business hours.'
              },
              {
                created_at: (Date.now() / 1000) - 600,
                author: {
                  name: 'Support Agent',
                  email: 'agent@company.com'
                },
                part_type: 'note',
                body: 'Closing ticket - onsite visit completed successfully. POS terminal now working properly.'
              }
            ]
          }
        }
      }
    }
  },
  {
    name: 'Ticket Assigned',
    payload: {
      type: 'notification_event',
      topic: 'conversation.admin.assigned',
      data: {
        item: {
          id: '215469890815112',
          team_assignee_id: '5372074',
          state: 'open',
          created_at: Date.now() / 1000,
          updated_at: Date.now() / 1000,
          custom_attributes: {
            ticket_type: 'L2 Onsite Support'
          }
        },
        assignee: {
          name: 'Test Agent'
        }
      }
    }
  },
  {
    name: 'Admin Replied',
    payload: {
      type: 'notification_event',
      topic: 'conversation.admin.replied',
      data: {
        item: {
          id: '189972000972557',
          team_assignee_id: '5372074',
          state: 'open',
          created_at: Date.now() / 1000,
          updated_at: Date.now() / 1000,
          custom_attributes: {
            ticket_type: 'L2 Onsite Support'
          }
        },
        admin: {
          name: 'Support Agent'
        }
      }
    }
  },
  {
    name: 'Note Added',
    payload: {
      type: 'notification_event',
      topic: 'conversation.admin.noted',
      data: {
        item: {
          id: '215469890816651',
          team_assignee_id: '5372074',
          state: 'open',
          created_at: Date.now() / 1000,
          updated_at: Date.now() / 1000,
          custom_attributes: {
            ticket_type: 'L2 Onsite Support'
          }
        },
        admin: {
          name: 'Support Agent'
        }
      }
    }
  }
];

async function testWebhook() {
  console.log('Testing webhook handler with notification_event payloads...\n');

  for (const test of testPayloads) {
    console.log(`\n📧 Testing: ${test.name}`);
    console.log(`Event Type: ${test.payload.topic}`);
    console.log(`Ticket ID: ${test.payload.data.item.id}`);

    try {
      const response = await axios.post(webhookUrl, test.payload, {
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Intercom/Test'
        }
      });

      console.log(`✅ Response: ${response.status} - ${JSON.stringify(response.data)}`);
    } catch (error) {
      console.error(`❌ Error: ${error.response?.status || error.message}`);
      if (error.response?.data) {
        console.error(`Response: ${JSON.stringify(error.response.data)}`);
      }
    }
  }
}

// Check if server is running
axios.get('http://localhost:3001/health')
  .then(() => {
    console.log('✅ Server is running\n');
    testWebhook();
  })
  .catch(() => {
    console.error('❌ Server is not running. Please start the server first with: npm start');
  });