# 🚀 Lark Base Ticket Automation Guide

## 🎯 **Zero-Hosting Solution for Ticket Notifications**

This guide shows you how to set up automatic ticket notifications using **Lark Base's built-in automation** - no external servers or hosting required!

## 🏗️ **Architecture Overview**

```
Intercom API ←→ Lark Base Automation ←→ Chat Notifications
     ↓              ↓                    ↓
Ticket Data → HTTP Requests → Direct Processing → Team Updates
```

## 📋 **Prerequisites**

- ✅ Lark Suite account with Base access
- ✅ Intercom account with API access
- ✅ Admin permissions in your Lark workspace

## 🔧 **Step 1: Create Your Ticket Tracking Base**

### **1.1 Create New Base**
1. Open **Lark Base** in your workspace
2. Create a new Base called **"Intercom Ticket Tracker"**
3. Create the following tables:

#### **Table 1: Tickets**
| Field Name | Field Type | Description |
|------------|------------|-------------|
| Ticket ID | Text | Intercom ticket ID |
| Status | Single Select | submitted, in_progress, resolved, closed |
| Subject | Text | Ticket subject/title |
| Customer Email | Email | Customer contact |
| Assigned Agent | Person | Agent handling ticket |
| Priority | Single Select | low, normal, high, urgent |
| Created Date | Date | When ticket was created |
| Updated Date | Date | Last update time |
| Last Status | Text | Previous status (for change detection) |
| Notes Count | Number | Number of notes/comments |

#### **Table 2: Status Changes**
| Field Name | Field Type | Description |
|------------|------------|-------------|
| Ticket ID | Link to Tickets | Reference to main ticket |
| Old Status | Text | Previous status |
| New Status | Text | Current status |
| Changed By | Text | Agent who made change |
| Change Time | Date & Time | When change occurred |
| Notification Sent | Checkbox | Whether team was notified |

#### **Table 3: Configuration**
| Field Name | Field Type | Description |
|------------|------------|-------------|
| Setting Name | Text | Configuration key |
| Setting Value | Text | Configuration value |
| Description | Text | What this setting does |

### **1.2 Configure Settings**
Add these configuration records:

| Setting Name | Setting Value | Description |
|--------------|---------------|-------------|
| INTERCOM_TOKEN | your_token_here | Intercom API access token |
| CHAT_GROUP_ID | your_chat_id | Lark chat group for notifications |
| CHECK_INTERVAL | 5 | Minutes between checks |
| LAST_CHECK | | Timestamp of last API call |

## 🔧 **Step 2: Set Up HTTP Request Automation**

### **2.1 Create Automation Workflow**
1. In your Base, click **"Automation"** → **"Create Automation"**
2. Choose **"Scheduled"** trigger
3. Set interval: **Every 5 minutes**

### **2.2 Configure HTTP Request Action**

#### **Action 1: Get Updated Tickets**
```javascript
// HTTP Request Configuration
Method: GET
URL: https://api.intercom.io/tickets
Headers: {
  "Authorization": "Bearer " + getFieldValue("Configuration", "INTERCOM_TOKEN"),
  "Accept": "application/json",
  "Intercom-Version": "2.11"
}

// Query Parameters
{
  "per_page": 50,
  "order": "desc",
  "sort": "updated_at"
}
```

#### **Action 2: Process Response**
```javascript
// JavaScript Code Block in Lark Base
const response = previousStep.data;
const tickets = response.tickets || [];
const configTable = base.getTable("Configuration");
const ticketsTable = base.getTable("Tickets");
const changesTable = base.getTable("Status Changes");

// Get last check time
const lastCheckRecord = await configTable.getRecords({
  filterByFormula: "{Setting Name} = 'LAST_CHECK'"
});
const lastCheck = lastCheckRecord[0] ? new Date(lastCheckRecord[0].getValue("Setting Value")) : new Date(0);

// Process each ticket
for (const ticket of tickets) {
  const updatedAt = new Date(ticket.updated_at * 1000);
  
  // Only process tickets updated since last check
  if (updatedAt > lastCheck) {
    await processTicketUpdate(ticket);
  }
}

// Update last check time
await configTable.updateRecord(lastCheckRecord[0].id, {
  "Setting Value": new Date().toISOString()
});

async function processTicketUpdate(ticket) {
  const ticketId = ticket.id;
  const currentStatus = ticket.state || 'unknown';
  
  // Check if ticket exists in our Base
  const existingRecords = await ticketsTable.getRecords({
    filterByFormula: `{Ticket ID} = "${ticketId}"`
  });
  
  if (existingRecords.length > 0) {
    // Update existing ticket
    const existingRecord = existingRecords[0];
    const oldStatus = existingRecord.getValue("Status");
    
    if (oldStatus !== currentStatus) {
      // Status changed - log the change
      await changesTable.addRecord({
        "Ticket ID": existingRecord.id,
        "Old Status": oldStatus,
        "New Status": currentStatus,
        "Change Time": new Date(),
        "Changed By": ticket.assignee?.name || "System",
        "Notification Sent": false
      });
      
      // Update ticket record
      await ticketsTable.updateRecord(existingRecord.id, {
        "Status": currentStatus,
        "Updated Date": new Date(ticket.updated_at * 1000),
        "Last Status": oldStatus,
        "Assigned Agent": ticket.assignee?.name || "",
        "Notes Count": ticket.conversation_parts?.conversation_parts?.length || 0
      });
      
      // Send notification
      await sendStatusChangeNotification(ticket, oldStatus, currentStatus);
    }
  } else {
    // New ticket - add to Base
    await ticketsTable.addRecord({
      "Ticket ID": ticketId,
      "Status": currentStatus,
      "Subject": ticket.conversation_parts?.conversation_parts?.[0]?.body?.substring(0, 100) || "No subject",
      "Customer Email": ticket.contacts?.contacts?.[0]?.email || "",
      "Assigned Agent": ticket.assignee?.name || "",
      "Priority": ticket.priority || "normal",
      "Created Date": new Date(ticket.created_at * 1000),
      "Updated Date": new Date(ticket.updated_at * 1000),
      "Last Status": "new",
      "Notes Count": ticket.conversation_parts?.conversation_parts?.length || 0
    });
    
    // Send new ticket notification
    await sendNewTicketNotification(ticket);
  }
}
```

### **2.3 Add Chat Notification Function**

#### **Action 3: Send Chat Notifications**
```javascript
async function sendStatusChangeNotification(ticket, oldStatus, newStatus) {
  const chatGroupId = await getConfigValue("CHAT_GROUP_ID");
  
  const statusEmojis = {
    'submitted': '🆕',
    'in_progress': '🔄', 
    'resolved': '✅',
    'closed': '🔒'
  };
  
  const message = `${statusEmojis[newStatus] || '📋'} **Ticket Status Update**

**Ticket ID:** ${ticket.id}
**Status Change:** ${oldStatus} → ${newStatus}
**Subject:** ${ticket.conversation_parts?.conversation_parts?.[0]?.body?.substring(0, 100) || 'No subject'}
**Assigned to:** ${ticket.assignee?.name || 'Unassigned'}
**Updated:** ${new Date(ticket.updated_at * 1000).toLocaleString()}

[View in Intercom](https://app.intercom.io/a/apps/${ticket.app_id}/inbox/conversation/${ticket.id})`;

  // Send to Lark chat group
  await sendLarkMessage(chatGroupId, message);
}

async function sendNewTicketNotification(ticket) {
  const chatGroupId = await getConfigValue("CHAT_GROUP_ID");
  
  const message = `🆕 **New Ticket Created**

**Ticket ID:** ${ticket.id}
**Status:** ${ticket.state || 'submitted'}
**Subject:** ${ticket.conversation_parts?.conversation_parts?.[0]?.body?.substring(0, 100) || 'No subject'}
**Customer:** ${ticket.contacts?.contacts?.[0]?.email || 'Unknown'}
**Created:** ${new Date(ticket.created_at * 1000).toLocaleString()}

[View in Intercom](https://app.intercom.io/a/apps/${ticket.app_id}/inbox/conversation/${ticket.id})`;

  await sendLarkMessage(chatGroupId, message);
}

async function sendLarkMessage(chatId, message) {
  // Use Lark Base's built-in messaging API
  const response = await fetch('https://open.larksuite.com/open-apis/im/v1/messages', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${await getBotToken()}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      receive_id: chatId,
      receive_id_type: 'chat_id',
      msg_type: 'text',
      content: JSON.stringify({ text: message })
    })
  });
  
  return response.json();
}

async function getConfigValue(settingName) {
  const configTable = base.getTable("Configuration");
  const records = await configTable.getRecords({
    filterByFormula: `{Setting Name} = "${settingName}"`
  });
  return records[0]?.getValue("Setting Value") || "";
}

async function getBotToken() {
  // Get bot token from configuration or environment
  return await getConfigValue("LARK_BOT_TOKEN");
}
```

## 🔧 **Step 3: Enhanced Automation (Optional)**

### **3.1 Add Webhook Receiver**
For real-time updates instead of polling:

1. Create a **Lark Base API endpoint**
2. Configure Intercom webhook to call this endpoint
3. Process incoming webhook data directly

```javascript
// Webhook handler in Lark Base
async function handleIntercomWebhook(webhookData) {
  const { type, data } = webhookData;
  
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
    // ... other event types
  }
}
```

### **3.2 Add Advanced Filtering**
Filter which tickets to track:

```javascript
function shouldTrackTicket(ticket) {
  // Only track high priority tickets
  if (ticket.priority === 'high' || ticket.priority === 'urgent') {
    return true;
  }
  
  // Only track tickets with specific tags
  if (ticket.tags && ticket.tags.includes('urgent')) {
    return true;
  }
  
  // Only track tickets from specific customers
  const vipCustomers = ['important@company.com', 'enterprise@client.com'];
  const customerEmail = ticket.contacts?.contacts?.[0]?.email;
  if (vipCustomers.includes(customerEmail)) {
    return true;
  }
  
  return false;
}
```

## 🔧 **Step 4: Set Up Chat Integration**

### **4.1 Create Bot Application**
1. Go to [Lark Developer Console](https://open.feishu.cn/app)
2. Create bot app with messaging permissions
3. Add bot to your target chat group
4. Get bot token and chat group ID

### **4.2 Configure Base Settings**
Update your Configuration table:

| Setting Name | Setting Value |
|--------------|---------------|
| LARK_BOT_TOKEN | t-xxxxxxxxx |
| CHAT_GROUP_ID | oc_xxxxxxxxx |

## 🎯 **Benefits of This Approach**

### **✅ Advantages**
- **Zero hosting costs** - runs entirely within Lark Suite
- **No maintenance** - Lark handles all infrastructure
- **Integrated data** - tickets stored directly in your Base
- **Built-in scheduling** - automatic execution every 5 minutes
- **Easy customization** - modify logic directly in Base
- **Team collaboration** - everyone can see and edit the automation

### **⚠️ Considerations**
- **API rate limits** - be mindful of Intercom's rate limits
- **Execution time** - Base automations have time limits
- **Complex logic** - may be easier to implement in external code
- **Error handling** - less sophisticated than custom applications

## 🚀 **Quick Start Checklist**

- [ ] Create Lark Base with ticket tracking tables
- [ ] Add Intercom API token to configuration
- [ ] Set up scheduled automation (every 5 minutes)
- [ ] Configure HTTP request to Intercom API
- [ ] Add JavaScript processing logic
- [ ] Create Lark bot and get chat group ID
- [ ] Add chat notification functionality
- [ ] Test with a few tickets
- [ ] Monitor and refine as needed

## 🛠️ **Troubleshooting**

### **Common Issues**

**1. API Authentication Errors**
- Verify Intercom token has correct permissions
- Check token format in configuration table

**2. Chat Notifications Not Sending**
- Verify bot is added to chat group
- Check chat group ID is correct
- Ensure bot has messaging permissions

**3. Automation Not Running**
- Check automation is enabled and scheduled
- Verify HTTP request configuration
- Look for JavaScript errors in execution logs

**4. Missing Ticket Updates**
- Increase check frequency (every 2-3 minutes)
- Verify last check timestamp is updating
- Check Intercom API response format

## 🎉 **Success!**

Once set up, your Lark Base will:
- **Automatically check** Intercom every 5 minutes
- **Detect status changes** in real-time
- **Send notifications** to your team chat
- **Store complete history** in your Base
- **Require zero maintenance** or hosting

This approach gives you the same functionality as the external server solution, but with the simplicity and reliability of Lark's built-in infrastructure!

## 🔮 **Advanced Extensions**

### **Dashboard Creation**
- Create Lark Base views for ticket analytics
- Build charts showing ticket volume and resolution times
- Set up automated reports

### **Team Workflows**
- Add assignment automation based on ticket type
- Create escalation rules for overdue tickets
- Integrate with team calendars for on-call scheduling

### **Customer Communication**
- Auto-respond to customers when status changes
- Send satisfaction surveys when tickets close
- Update customer portal with ticket status

This Lark Base approach is much simpler and more maintainable than hosting your own server! 