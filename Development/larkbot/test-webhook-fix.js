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
            ticket_type: 'L2 Onsite Support'
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