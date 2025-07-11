# Lark Suite Integration Setup Guide

## 🦜 **Complete Guide to Lark Suite Integration**

This guide will walk you through setting up Lark Suite integration for your Intercom ticket chatbot.

## 📋 **Prerequisites**

- Lark Suite account (business or enterprise)
- Admin access to your Lark workspace
- Access to [Lark Open Platform](https://open.feishu.cn/app)
- Your Intercom-Lark system running

## 🔧 **Step 1: Create Lark Developer Account**

### 1.1 Register on Lark Open Platform
1. Go to [https://open.feishu.cn/app](https://open.feishu.cn/app)
2. Click "登录" (Login) or "注册" (Register)
3. Use your business email to register
4. Verify your email address
5. Complete profile setup

### 1.2 Access Developer Console
1. Login to the developer console
2. You'll see the app management dashboard
3. Click "创建应用" (Create App)

## 🚀 **Step 2: Create Your Ticket Bot App**

### 2.1 Basic App Configuration
1. **App Type**: Choose "自建应用" (Custom App)
2. **App Name**: "Intercom Ticket Bot"
3. **App Description**: "Automated ticket sharing and status updates"
4. **App Icon**: Upload a relevant icon (optional)
5. **App Category**: Choose "效率办公" (Productivity)

### 2.2 App Information
Fill in these details:
- **App Name (EN)**: Intercom Ticket Bot
- **App Description (EN)**: Automated ticket information sharing
- **Developer**: Your company name
- **Website**: Your company website (optional)

## 🔑 **Step 3: Configure App Permissions**

### 3.1 Required Scopes
In the "权限管理" (Permission Management) section, add these scopes:

**Message Permissions:**
- `im:message` - Send messages
- `im:message.group_at_msg` - Send group messages
- `im:message.p2p_msg` - Send private messages
- `im:chat` - Access chat information

**Document Permissions:**
- `sheets:spreadsheet` - Create and edit spreadsheets
- `docs:document` - Create and edit documents
- `drive:drive` - Access drive files

**User Permissions:**
- `contact:user.id` - Get user basic info
- `contact:user.email` - Get user email
- `contact:department_id` - Get department info

**Bot Permissions:**
- `bot:chat` - Bot chat capabilities
- `bot:message` - Bot message handling

### 3.2 Event Subscriptions
In "事件订阅" (Event Subscriptions), enable these events:
- `im.message.receive_v1` - Receive messages
- `im.message.message_read_v1` - Message read events
- `im.chat.member.bot.added_v1` - Bot added to chat
- `im.chat.member.bot.deleted_v1` - Bot removed from chat

## 🔐 **Step 4: Get Your Credentials**

### 4.1 App Credentials
After creating the app, go to "凭证与基础信息" (Credentials & Basic Info):

1. **App ID**: `cli_xxxxxxxxxxxxxxxxx`
2. **App Secret**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
3. **Verification Token**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`
4. **Encrypt Key**: `xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx` (optional)

### 4.2 Bot Token
Go to "机器人" (Bot) section:
1. Enable bot functionality
2. Get **Bot Token**: `t-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx`

## 🌐 **Step 5: Configure Webhook**

### 5.1 Set Webhook URL
In "事件订阅" (Event Subscriptions):
1. **Request URL**: `https://your-domain.com/webhook/lark`
2. **Verification Token**: Use the token from Step 4.1
3. Click "保存配置" (Save Configuration)

### 5.2 Test Webhook
The system will send a verification request. Your webhook should respond with the challenge.

## ⚙️ **Step 6: Configure Your System**

### 6.1 Update Environment Variables
Add these to your `.env` file:

```bash
# Lark Suite Configuration
LARK_APP_ID=cli_xxxxxxxxxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LARK_BOT_TOKEN=t-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LARK_WEBHOOK_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx

# Webhook Configuration
LARK_WEBHOOK_URL=https://your-domain.com/webhook/lark
```

### 6.2 Test Configuration
```bash
# Test Lark connection
curl http://localhost:3001/webhook/lark/test

# Test message processing
curl -X POST http://localhost:3001/webhook/lark/test-message \
  -H "Content-Type: application/json" \
  -d '{
    "content": "/help",
    "chatId": "test_chat",
    "userId": "test_user"
  }'
```

## 📱 **Step 7: Install and Test Your Bot**

### 7.1 Install Bot to Workspace
1. Go to "版本管理与发布" (Version Management & Release)
2. Click "创建版本" (Create Version)
3. Fill in version details
4. Click "申请线上发布" (Apply for Online Release)
5. Wait for approval (usually automatic for internal apps)

### 7.2 Add Bot to Chats
1. Open Lark app
2. Go to a chat or create a new group
3. Add the bot: Type "@" and search for "Intercom Ticket Bot"
4. Add the bot to the chat

### 7.3 Test Bot Commands
Try these commands in the chat:

```
/help
/tickets
/summary
/stats
```

## 🤖 **Available Bot Commands**

### **Ticket Commands**
- `/ticket <ticket_id>` - Get detailed ticket information
- `/tickets [state=open] [priority=high] [limit=5]` - List tickets with filters
- `/status <ticket_id>` - Get quick ticket status

### **Summary Commands**
- `/summary [date=today]` - Get daily ticket summary
- `/stats [period=today|week|month]` - Get ticket statistics

### **Conversation Commands**
- `/conversation <conversation_id>` - Get conversation details
- `/conversations [state=open] [limit=5]` - List recent conversations

### **Subscription Commands**
- `/subscribe <ticket_id>` - Subscribe to ticket updates
- `/unsubscribe <ticket_id>` - Unsubscribe from updates

### **Utility Commands**
- `/help [command]` - Show help information

## 🔧 **Step 8: Advanced Configuration**

### 8.1 Custom Commands
You can add custom commands by editing `src/services/chatbot.js`:

```javascript
this.commands.set('/custom', {
  description: 'Your custom command',
  usage: '/custom [parameters]',
  handler: this.handleCustomCommand.bind(this)
});
```

### 8.2 Automated Notifications
Set up automated notifications for ticket updates:

```javascript
// In your webhook handler
const chatbotService = require('../services/chatbot');

// Send notification when ticket status changes
await chatbotService.sendTicketUpdate(chatId, ticket, 'status_change');
```

### 8.3 Scheduled Reports
Set up scheduled reports using cron jobs:

```javascript
// Send daily summary at 9 AM
const cron = require('node-cron');

cron.schedule('0 9 * * *', async () => {
  const summary = await chatbotService.generateTicketSummary('today');
  await chatbotService.sendMessage(chatId, summary);
});
```

## 📊 **Step 9: Monitoring and Analytics**

### 9.1 Health Monitoring
Check bot health:
```bash
curl http://localhost:3001/health
```

### 9.2 Usage Analytics
Monitor bot usage in your logs:
```bash
tail -f logs/app.log | grep "🤖"
```

### 9.3 Performance Metrics
Track:
- Message processing time
- Command usage frequency
- Error rates
- User engagement

## 🛠️ **Troubleshooting**

### Common Issues

#### 1. **Bot not responding**
- Check webhook URL is accessible
- Verify app permissions
- Check logs for errors

#### 2. **Authentication errors**
- Verify App ID and Secret
- Check Bot Token
- Ensure webhook signature verification

#### 3. **Message parsing issues**
- Check message format
- Verify content encoding
- Review parsing logic

#### 4. **Permission denied**
- Check app scopes
- Verify user permissions
- Review workspace settings

### Debug Commands
```bash
# Check bot status
curl http://localhost:3001/webhook/lark/test

# Test message processing
curl -X POST http://localhost:3001/webhook/lark/test-message \
  -H "Content-Type: application/json" \
  -d '{"content": "/help", "chatId": "test", "userId": "test"}'

# Check logs
tail -f logs/app.log
```

## 🎯 **Best Practices**

### 1. **Security**
- Always verify webhook signatures
- Use HTTPS for all endpoints
- Rotate secrets regularly
- Implement rate limiting

### 2. **User Experience**
- Provide clear command help
- Use consistent formatting
- Handle errors gracefully
- Implement typing indicators

### 3. **Performance**
- Cache frequently accessed data
- Use async processing for heavy operations
- Implement proper error handling
- Monitor response times

### 4. **Maintenance**
- Regular log monitoring
- Update dependencies
- Monitor API rate limits
- Backup configuration

## 📈 **Scaling Considerations**

### For High Volume
- Implement message queues
- Use Redis for caching
- Scale horizontally
- Implement circuit breakers

### For Multiple Workspaces
- Multi-tenant architecture
- Separate configurations
- Isolated data storage
- Centralized monitoring

## 🎉 **You're Ready!**

Your Lark Suite integration is now complete! Your team can:

✅ **Get ticket information** instantly with `/ticket <id>`
✅ **List filtered tickets** with `/tickets state=open priority=high`
✅ **Receive daily summaries** with `/summary`
✅ **Monitor ticket stats** with `/stats`
✅ **Subscribe to updates** for important tickets
✅ **Export data** to spreadsheets automatically

The bot will help your team stay on top of customer support tickets without leaving their chat environment!

---

**Need help?** Check the logs at `logs/app.log` or contact your system administrator. 

## 🧪 **Method 1: Test with Command Line (Easiest)**

### **Step 1: Open Terminal/Command Prompt**
- **Windows**: Press `Win + R`, type `cmd`, press Enter
- **Mac**: Press `Cmd + Space`, type `Terminal`, press Enter
- **Linux**: Press `Ctrl + Alt + T`

### **Step 2: Run This Exact Command**
Copy and paste this entire command:

```bash
<code_block_to_apply_changes_from>
```

### **Step 3: Check the Response**

**✅ If it works, you'll see something like:**
```json
{
  "type": "app",
  "id": "v2axofpf",
  "name": "Your App Name",
  "created_at": 1234567890
}
```

**❌ If it fails, you'll see:**
```json
{
  "type": "error.list",
  "errors": [
    {
      "code": "unauthorized",
      "message": "Access Token Invalid"
    }
  ]
}
```

## 🖥️ **Method 2: Test with Your Application**

### **Step 1: Update Your .env File**
Create or edit `.env` in your project folder:

```bash
# Intercom Configuration
INTERCOM_TOKEN=dG9rOmVlMTEwNzY0XzRiNjlfNGRjZV84ZjdmXzVjNzI0M2NiYzliMzoxOjA=
INTERCOM_APP_ID=v2axofpf

# Application Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
```

### **Step 2: Start Your Application**
```bash
# In your project directory
npm start
```

### **Step 3: Test the Connection**
Open a new terminal and run:
```bash
curl http://localhost:3001/api/test-connection
```

**Expected Response:**
```json
{
  "status": "success",
  "message": "Connected to Intercom",
  "app_id": "v2axofpf"
}
```

## 🌐 **Method 3: Test in Browser (Visual)**

### **Step 1: Use an Online API Tester**
Go to: https://reqbin.com/

### **Step 2: Fill in the Details**
- **Method**: GET
- **URL**: `https://api.intercom.io/me`
- **Headers**:
  - `Authorization`: `Bearer dG9rOmVlMTEwNzY0XzRiNjlfNGRjZV84ZjdmXzVjNzI0M2NiYzliMzoxOjA=`
  - `Accept`: `application/json`

### **Step 3: Click "Send"**
You should see the response in the browser.

## 📊 **Method 4: Test Data Access**

Once basic auth works, test data access:

```bash
# Test conversations
curl -X GET "https://api.intercom.io/conversations" -H "Authorization: Bearer dG9rOmVlMTEwNzY0XzRiNjlfNGRjZV84ZjdmXzVjNzI0M2NiYzliMzoxOjA=" -H "Accept: application/json"
```

## 🎯 **What to Do Right Now:**

1. **Choose Method 1** (command line) - it's the fastest
2. **Copy and paste the exact command** I provided above
3. **Run it in your terminal**
4. **Tell me what response you get**

## 🔍 **What I Need to See:**

Please share:
- **The exact command you ran**
- **The complete response** you got
- **Any error messages**

**Go ahead and try Method 1 first - just copy/paste that curl command and show me what happens!** 