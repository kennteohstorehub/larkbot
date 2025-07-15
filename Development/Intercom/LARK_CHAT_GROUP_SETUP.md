# 🔍 Lark Chat Group ID Setup Guide

## 🎯 **Goal: Get Your Chat Group ID for Notifications**

This guide helps you find your Lark chat group ID, which is required for automatic ticket notifications. The system needs this ID to send updates to your team chat.

## 📋 **Prerequisites**

- ✅ Lark bot created and configured
- ✅ Bot added to your target chat group
- ✅ `LARK_APP_ID` and `LARK_APP_SECRET` in your `.env` file

## 🚀 **Method 1: Automated Script (Recommended)**

### **Step 1: Run the Setup Script**
```bash
npm run setup:chat
```

This script will:
- ✅ List all chat groups your bot belongs to
- ✅ Show chat IDs, names, and member counts
- ✅ Provide configuration instructions

### **Step 2: Choose Your Chat Group**
From the output, find your target chat group and copy its `Chat ID`.

### **Step 3: Configure Environment**
Add to your `.env` file:
```bash
LARK_CHAT_GROUP_ID=oc_your_chat_id_here
```

## 🤖 **Method 2: Bot Commands (Interactive)**

### **Step 1: Start Your Application**
```bash
npm start
```

### **Step 2: Use Bot Commands**
In your Lark group chat, send:

#### **Get Current Chat ID**
```
@YourBot /get-chat-id
```
**Response:**
```
🔍 Chat Group Information

Chat ID: oc_abcdefg1234567890
Chat Name: Engineering Team
Chat Type: group

📋 Configuration Instructions:
1. Copy the Chat ID above
2. Add to your .env file:
   LARK_CHAT_GROUP_ID=oc_abcdefg1234567890
3. Restart your application
4. Test webhook notifications
```

#### **List All Available Chats**
```
@YourBot /list-chats
```
**Response:**
```
💬 Bot Chat Groups (3 found)

1. Engineering Team 👈 Current Chat
• ID: oc_abcdefg1234567890
• Type: group
• Members: 12

2. Support Team
• ID: oc_xyz9876543210
• Type: group  
• Members: 8

3. Management
• ID: oc_management123456
• Type: group
• Members: 5
```

## 📡 **Method 3: Webhook Event Capture**

### **Step 1: Enable Event Subscriptions**
1. Go to your Lark Developer Console
2. **Events & Callbacks** → **Event Configuration**
3. **Add Request URL**: `https://your-domain.com/webhook/lark`
4. **Subscribe to**: `im.message.receive_v1`

### **Step 2: Send Test Message**
1. Add your bot to a group chat
2. Send any message mentioning the bot: `@YourBot hello`
3. Check your application logs for the event payload

### **Step 3: Extract Chat ID**
Look for this in your logs:
```json
{
  "event": {
    "message": {
      "chat_id": "oc_abcdefg1234567890",
      "message_id": "om_xxx",
      "content": "{\"text\":\"hello\"}"
    }
  }
}
```

The `chat_id` is what you need!

## 🔧 **Configuration & Testing**

### **Step 1: Update Environment Variables**
```bash
# Add to .env
LARK_CHAT_GROUP_ID=oc_your_actual_chat_id_here
```

### **Step 2: Restart Application**
```bash
npm start
```

### **Step 3: Test Webhook Notifications**
```bash
# Test ticket notification
curl -X POST "http://localhost:3001/webhook/intercom" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "conversation.admin.opened",
    "data": {
      "item": {
        "id": "test123",
        "subject": "Test Ticket",
        "state": "open"
      }
    }
  }'
```

You should see a notification in your Lark chat group!

## 🎯 **What Chat ID Looks Like**

- **Format**: `oc_` followed by alphanumeric characters
- **Example**: `oc_abcdefg1234567890`
- **Length**: Usually 18-20 characters total

## 🛠️ **Troubleshooting**

### **"No chats found"**
- ✅ Ensure your bot is added to at least one group
- ✅ Check bot permissions include `im:chat`
- ✅ Verify app is published and approved

### **"Chat access failed"**
- ✅ Bot may not have access to that specific chat
- ✅ Re-add bot to the group
- ✅ Check if chat still exists

### **"Failed to send message"**
- ✅ Verify `LARK_CHAT_GROUP_ID` is correct
- ✅ Check bot has `im:message` permission
- ✅ Ensure bot is still in the target group

### **Bot not responding to commands**
- ✅ Check webhook configuration
- ✅ Verify application is running
- ✅ Look for errors in application logs

## 📋 **Quick Reference**

### **Environment Variables**
```bash
# Required
LARK_APP_ID=cli_your_app_id
LARK_APP_SECRET=your_app_secret
LARK_CHAT_GROUP_ID=oc_your_chat_id

# Optional
LARK_WEBHOOK_SECRET=your_webhook_secret
```

### **Useful Commands**
```bash
# Setup scripts
npm run setup:chat          # Find chat group IDs
npm run setup:lark          # Full Lark setup

# Bot commands
/get-chat-id                # Get current chat ID
/list-chats                 # List all bot chats
/help                       # Show all commands
```

### **API Endpoints**
```bash
# Test webhook
POST /webhook/lark

# Test notifications  
POST /webhook/intercom
```

## 🎉 **Success!**

Once configured, your system will:
- ✅ **Automatically send** ticket notifications to your chat group
- ✅ **Include rich information** about tickets and updates
- ✅ **Provide direct links** to view tickets in Intercom
- ✅ **Handle all ticket lifecycle events** (opened, assigned, closed, etc.)

The chat group ID is the critical piece that enables real-time team notifications! 