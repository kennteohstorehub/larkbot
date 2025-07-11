# 🎫 Ticket Status Automation Setup Guide

## 🎯 **Goal: Automatic Ticket Notifications**

This guide will help you set up automatic notifications to your Lark chat group when Intercom tickets change status:
- `submitted → in progress → resolved → closed`
- All notes and comments included in notifications
- Real-time updates sent to your specified Lark chat group

## 📋 **Prerequisites**

- ✅ Intercom account with admin access
- ✅ Lark Suite account and workspace
- ✅ Your application running (this codebase)
- ✅ A public URL for webhooks (ngrok for testing, or production domain)

## 🔧 **Step 1: Set Up Lark Bot**

### **1.1 Create Lark Bot Application**
1. Go to [Lark Developer Console](https://open.feishu.cn/app)
2. Create a new **Custom App** with **Bot** capability
3. Get your credentials:
   - **App ID**: `cli_xxxxxxxxxxxxxxxxx`
   - **App Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

### **1.2 Configure Bot Permissions**
Enable these permissions:
- ✅ `im:message` - Send messages
- ✅ `im:message.group_at_msg` - Send group messages
- ✅ `im:chat` - Access chat information

### **1.3 Add Bot to Your Chat Group**
1. Create a new group chat in Lark (or use existing)
2. Add your bot to the group: Type `@` and search for your bot name
3. **Important**: Copy the chat group ID (you'll need this later)

**How to get Chat Group ID:**
- Right-click on the group chat → Properties → Copy the ID
- Or use the bot command `/get_chat_id` once it's running

## 🔧 **Step 2: Configure Your Application**

### **2.1 Update Environment Variables**
Copy `.env.example` to `.env` and fill in your values:

```bash
# Intercom Configuration
INTERCOM_TOKEN=your_intercom_access_token_here
INTERCOM_APP_ID=your_intercom_app_id_here

# Lark Suite Configuration
LARK_APP_ID=cli_xxxxxxxxxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LARK_CHAT_GROUP_ID=your_lark_chat_group_id_here

# Application Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Feature Flags
ENABLE_WEBHOOKS=true
ENABLE_CHATBOT=true
```

### **2.2 Get Your Webhook URL**

**For Local Testing:**
```bash
# Start your application
npm start

# In another terminal, expose your local server
ngrok http 3001

# Your webhook URL will be: https://abc123.ngrok.io/webhook/intercom
```

**For Production:**
```bash
# Your webhook URL will be: https://your-domain.com/webhook/intercom
```

## 🔧 **Step 3: Set Up Intercom Webhook**

### **3.1 Access Intercom Developer Hub**
1. Go to [Intercom Developer Hub](https://developers.intercom.com/building-apps)
2. Sign in with your Intercom account
3. Click **"Create app"** or select existing app

### **3.2 Configure Webhook**
1. Go to **Webhooks** section
2. Click **"Add webhook"**
3. **Webhook URL**: `https://your-domain.com/webhook/intercom`
4. **Select these events**:
   - ✅ `conversation.admin.assigned` - When ticket is assigned
   - ✅ `conversation.admin.closed` - When ticket is closed
   - ✅ `conversation.admin.opened` - When ticket is opened/submitted
   - ✅ `conversation.admin.snoozed` - When ticket is snoozed
   - ✅ `conversation.admin.unsnoozed` - When ticket is unsnoozed
   - ✅ `conversation.admin.replied` - When agent replies
   - ✅ `conversation.admin.note.created` - When note is added

### **3.3 Test Webhook**
1. Click **"Test webhook"**
2. Intercom will send a test event
3. Check your application logs for: `✅ Ticket update sent to Lark`

## 🚀 **Step 4: Test Your Setup**

### **4.1 Start Your Application**
```bash
npm start
```

You should see:
```
✅ Intercom service initialized successfully
✅ Lark Suite service initialized successfully
✅ Chatbot service initialized successfully
🚀 Server running on port 3001
```

### **4.2 Test Ticket Status Changes**
1. Go to your Intercom inbox
2. Create a test conversation/ticket
3. Change the status: Open → Assign → Close
4. Check your Lark chat group for notifications

### **4.3 Expected Lark Notifications**
You should see messages like:

```
🆕 **Ticket Update**

**Ticket ID:** 12345
**Status:** 🆕 SUBMITTED
**Event:** OPENED
**Subject:** Customer needs help with login
**Created:** 2024-01-15 10:30:00
**Updated:** 2024-01-15 10:30:00

💬 **Recent Activity:**
**Customer Name** (2024-01-15 10:30:00):
I can't log into my account. Getting error message...

[View in Intercom](https://app.intercom.io/a/apps/your-app-id/inbox/conversation/12345)
```

## 🔧 **Step 5: Customization Options**

### **5.1 Filter Specific Tickets**
You can modify the webhook handler to only send notifications for specific ticket types:

```javascript
// In src/routes/webhook.js, modify sendTicketUpdateToLark function
async function sendTicketUpdateToLark(ticket, eventType, metadata = {}) {
  // Only send notifications for high priority tickets
  if (ticket.priority !== 'high') {
    return;
  }
  
  // Only send notifications for specific tags
  if (!ticket.tags?.includes('urgent')) {
    return;
  }
  
  // ... rest of the function
}
```

### **5.2 Multiple Chat Groups**
You can send different ticket types to different chat groups:

```javascript
// Configure multiple chat groups in .env
LARK_CHAT_GROUP_URGENT=urgent_chat_group_id
LARK_CHAT_GROUP_GENERAL=general_chat_group_id

// In the webhook handler
const chatId = ticket.priority === 'high' ? 
  process.env.LARK_CHAT_GROUP_URGENT : 
  process.env.LARK_CHAT_GROUP_GENERAL;
```

### **5.3 Custom Message Format**
You can customize the message format by modifying the `formatTicketUpdateMessage` function in `src/routes/webhook.js`.

## 🛠️ **Troubleshooting**

### **Common Issues:**

**1. "No Lark chat group configured"**
- Check your `LARK_CHAT_GROUP_ID` in `.env`
- Make sure the bot is added to the chat group

**2. "Webhook not receiving events"**
- Verify your webhook URL is accessible
- Check Intercom webhook configuration
- Look for errors in application logs

**3. "Bot not sending messages"**
- Verify Lark bot permissions
- Check `LARK_APP_ID` and `LARK_APP_SECRET`
- Ensure bot is added to the target chat group

**4. "Messages not formatted correctly"**
- Check application logs for formatting errors
- Verify ticket data structure in webhook payload

### **Debug Commands:**
```bash
# Check webhook endpoint
curl -X POST "http://localhost:3001/webhook/intercom" \
  -H "Content-Type: application/json" \
  -d '{"type": "conversation.admin.opened", "data": {"item": {"id": "test123"}}}'

# Check application logs
tail -f logs/app.log

# Test Lark bot messaging
curl -X POST "http://localhost:3001/webhook/lark/test-message" \
  -H "Content-Type: application/json" \
  -d '{"content": "Test message", "chatId": "your_chat_group_id"}'
```

## 📊 **What You'll Get**

### **Automatic Notifications For:**
- 🆕 **New tickets** (submitted)
- 👤 **Ticket assignments** (in progress)
- 💬 **Agent replies** (in progress)
- 📝 **Internal notes** (in progress)
- ✅ **Ticket resolution** (resolved)
- 🔒 **Ticket closure** (closed)

### **Each Notification Includes:**
- Ticket ID and status
- Event type (opened, assigned, replied, etc.)
- Subject/description
- Agent information (who assigned, replied, etc.)
- Recent activity/notes
- Direct link to view in Intercom
- Timestamps for created/updated

## 🎉 **Success!**

Once set up, your team will automatically receive real-time notifications in your Lark chat group whenever ticket statuses change in Intercom. No more manual checking or missed updates!

## 🔄 **Status Flow Mapping**

The system maps Intercom events to your desired status flow:

```
Intercom Event → Your Status Flow
=====================================
conversation.admin.opened → submitted
conversation.admin.assigned → in progress
conversation.admin.replied → in progress
conversation.admin.note.created → in progress
conversation.admin.snoozed → pending
conversation.admin.unsnoozed → in progress
conversation.admin.closed → closed
```

This gives you complete visibility into your ticket lifecycle with automatic updates to your team chat! 