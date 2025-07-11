# 🚀 Simple Lark Base Ticket Automation Setup

## 🎯 **Real-time Ticket Notifications (No Coding Required)**

This guide shows you how to set up **instant ticket notifications** using Lark Base's visual automation builder with Intercom webhooks.

## 📋 **What You'll Need**

- ✅ Lark Suite account with Base access  
- ✅ Intercom developer access (✅ You have this!)
- ✅ Test chat group ID (✅ You have this!)
- ⏱️ **15 minutes setup time**

## 🔧 **Step 1: Create Your Ticket Base**

### **1.1 Create New Base**
1. Open **Lark Base** → **Create Base** → **"Intercom Tickets"**
2. Create a simple table with these columns:

| Column Name | Type | Purpose |
|-------------|------|---------|
| Ticket ID | Text | Intercom ticket ID |
| Status | Single Select | submitted, in_progress, resolved, closed |
| Subject | Text | Ticket title |
| Customer | Text | Customer name/email |
| Agent | Text | Assigned agent |
| Last Update | Date & Time | When last changed |

### **1.2 Set Up Status Options**
In the **Status** column, add these options:
- 🆕 **submitted** (Blue)
- 🔄 **in_progress** (Yellow) 
- ✅ **resolved** (Green)
- 🔒 **closed** (Gray)

## 🔧 **Step 2: Get Your Webhook URL**

### **2.1 Create Webhook Automation**
1. In your Base → **Automation** → **Create Automation**
2. Choose **"When a webhook is received"** trigger
3. **Copy the webhook URL** - it looks like:
   ```
   https://base-api.larksuite.com/webhook/v1/xxxxx
   ```
4. **Save this URL** - we'll use it in Intercom

### **2.2 Configure Webhook Response**
Set up these actions in order:

#### **Action 1: Add/Update Ticket Record**
- **Trigger**: When webhook received
- **Action**: Add record to Tickets table
- **Mapping**:
  - Ticket ID → `{{webhook.ticket.id}}`
  - Status → `{{webhook.ticket.status}}`
  - Subject → `{{webhook.ticket.subject}}`
  - Customer → `{{webhook.ticket.customer}}`
  - Agent → `{{webhook.ticket.agent}}`
  - Last Update → `{{webhook.timestamp}}`

#### **Action 2: Send Chat Notification**
- **Action**: Send message to chat group
- **Chat Group**: Your test group ID
- **Message Template**:
  ```
  🎫 **Ticket Update**
  
  **Status**: {{Status}} {{StatusEmoji}}
  **Ticket**: #{{Ticket ID}}
  **Subject**: {{Subject}}
  **Customer**: {{Customer}}
  **Agent**: {{Agent}}
  
  **Time**: {{Last Update}}
  ```

## 🔧 **Step 3: Configure Intercom Webhook**

### **3.1 Set Up Webhook in Intercom**
1. Go to **Intercom Developer Hub** → **Your App** → **Webhooks**
2. **Add Webhook** with these settings:
   - **URL**: Your Lark Base webhook URL from Step 2.1
   - **Events**: Select these:
     - `conversation.admin.assigned`
     - `conversation.admin.closed` 
     - `conversation.admin.opened`
     - `conversation.admin.snoozed`
     - `conversation.admin.unsnoozed`

### **3.2 Test the Webhook**
1. **Create a test ticket** in Intercom
2. **Change its status** (assign, close, etc.)
3. **Check your Lark chat group** - you should see notifications!

## 🔧 **Step 4: Add Status Emojis (Optional)**

To make notifications prettier, add this formula to your Base:

**Status Emoji Column** (Formula):
```
IF(Status="submitted","🆕",
IF(Status="in_progress","🔄", 
IF(Status="resolved","✅",
IF(Status="closed","🔒","📋"))))
```

## 🎯 **Step 5: Test & Go Live**

### **5.1 Test Phase**
1. ✅ Create test ticket in Intercom
2. ✅ Verify webhook fires
3. ✅ Check Base gets updated
4. ✅ Confirm chat notification sent

### **5.2 Go Live**
1. **Change chat group** from test to production
2. **Enable webhook** in Intercom
3. **Monitor for 24 hours** to ensure stability

## 🚀 **Advanced Features (Optional)**

### **Filter by Priority**
Add condition in automation:
- **Only notify if**: Priority = "high" OR Priority = "urgent"

### **Different Groups for Different Statuses**
- **New tickets** → General support group
- **Urgent tickets** → Management group
- **Resolved tickets** → QA group

### **Custom Message Templates**
Create different message formats for different statuses:

**New Ticket**:
```
🆕 **New Ticket Submitted**
Customer: {{Customer}}
Subject: {{Subject}}
Priority: {{Priority}}
```

**Resolved Ticket**:
```
✅ **Ticket Resolved**
#{{Ticket ID}} - {{Subject}}
Agent: {{Agent}}
Resolution time: {{Duration}}
```

## 🔧 **Troubleshooting**

### **Webhook Not Firing**
1. Check webhook URL is correct
2. Verify Intercom events are selected
3. Test with Intercom's webhook tester

### **No Chat Notifications**
1. Verify chat group ID is correct
2. Check Base automation is enabled
3. Ensure bot has permission to post

### **Missing Data**
1. Check webhook payload mapping
2. Verify field names match exactly
3. Test with simple message first

## 📞 **Need Help?**

If you run into issues:
1. **Check the webhook logs** in Lark Base
2. **Test with a simple message** first
3. **Verify all IDs and permissions** are correct

---

**Ready to start?** Let me know when you've created the Base and I'll help you configure the webhook automation! 