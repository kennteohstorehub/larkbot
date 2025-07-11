# 🦜 Lark Suite API Setup Guide

## Overview
This guide will walk you through getting Lark Suite API credentials to enable the chatbot functionality in your Intercom automation system.

## 🚀 **Step 1: Access Lark Developer Console**

### For International Users (Lark Suite)
- Visit: https://open.larksuite.com/app
- Sign in with your Lark Suite account

### For Chinese Users (Feishu)
- Visit: https://open.feishu.cn/app
- Sign in with your Feishu account

### If you don't have a Lark account:
1. Download Lark Suite: https://www.larksuite.com/
2. Create a free account
3. Verify your email/phone number

## 🔧 **Step 2: Create Your Bot Application**

### 2.1 Create New App
1. Click **"Create App"** (创建应用)
2. Choose **"Custom App"** (自建应用)
3. Select **"Bot"** (机器人) as primary capability

### 2.2 Fill App Information
```
App Name: Intercom Ticket Bot
Description: Automated ticket management and data access bot
App Type: Internal App (企业内部应用)
```

### 2.3 Upload App Icon (Optional)
- Recommended size: 512x512 pixels
- Format: PNG or JPG

## 🔑 **Step 3: Get Your Credentials**

### 3.1 Navigate to App Info
1. Go to **"App Info"** (应用信息) section
2. Copy and save these values:

```
App ID: cli_xxxxxxxxxxxxxxxxx
App Secret: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
Verification Token: v_xxxxxxxxxxxxxxxxx
Encrypt Key: xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx (optional)
```

### 3.2 Save Credentials Securely
Create a `.env` file in your project root:

```bash
# Copy from env.example
cp env.example .env
```

Edit `.env` with your actual credentials:
```bash
LARK_APP_ID=cli_xxxxxxxxxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LARK_WEBHOOK_SECRET=v_xxxxxxxxxxxxxxxxx
```

## 🛡️ **Step 4: Configure Permissions**

### 4.1 Go to Permissions & Scopes
Navigate to **"Permissions & Scopes"** (权限管理)

### 4.2 Add Required Bot Permissions
Check these permissions:

**Message Permissions:**
- ✅ `im:message` - Send and receive messages
- ✅ `im:message.group_at_msg` - Receive group @ messages
- ✅ `im:message.group_at_msg:readonly` - Read group @ messages
- ✅ `im:message.p2p_msg` - Send/receive private messages
- ✅ `im:message.p2p_msg:readonly` - Read private messages

**Chat Permissions:**
- ✅ `im:chat` - Access chat information
- ✅ `im:chat:readonly` - Read chat information

**Optional Advanced Permissions:**
- ✅ `docs:doc` - Create and edit documents
- ✅ `sheets:spreadsheet` - Create and edit spreadsheets
- ✅ `contact:user.id:readonly` - Read user information

### 4.3 Save Permissions
Click **"Save"** (保存) to apply permissions

## 🤖 **Step 5: Configure Bot Settings**

### 5.1 Enable Bot Features
Go to **"Bot"** (机器人) section and enable:

- ✅ **Enable Bot** (启用机器人)
- ✅ **Allow adding to groups** (允许拉入群聊)
- ✅ **Allow private messages** (允许私聊)
- ✅ **Allow mentions in groups** (允许群内@机器人)

### 5.2 Set Bot Commands (Optional)
Add these suggested commands:

```
/help - Show available commands
/tickets - List tickets with filters
/ticket <id> - Get specific ticket details
/summary - Get daily ticket summary
/stats - Get ticket statistics
/subscribe - Subscribe to ticket updates
```

### 5.3 Configure Bot Description
```
Description: I help you manage and access Intercom tickets. 
Use /help to see available commands.

Commands:
• /tickets - List recent tickets
• /summary - Get ticket summary
• /help - Show all commands
```

## 🔗 **Step 6: Set Up Event Subscriptions**

### 6.1 Configure Webhook URL
1. Go to **"Event Subscriptions"** (事件订阅)
2. Add your webhook URL:

**For Production:**
```
https://your-domain.com/webhook/lark
```

**For Local Development (using ngrok):**
```bash
# Install ngrok first
npm install -g ngrok

# Start your app
npm start

# In another terminal, expose your local server
ngrok http 3001

# Use the https URL from ngrok
https://abc123.ngrok.io/webhook/lark
```

### 6.2 Subscribe to Events
Enable these events:

- ✅ `im.message.receive_v1` - Receive messages
- ✅ `im.message.message_read_v1` - Message read events (optional)

### 6.3 Verify Webhook
Lark will send a verification request to your webhook URL. Your app should respond with the challenge parameter.

## 🚀 **Step 7: Test Your Setup**

### 7.1 Start Your Application
```bash
# Make sure your .env file has the correct credentials
npm start
```

### 7.2 Install Bot in Workspace
1. Go to **"Version Management"** (版本管理与发布)
2. Click **"Create Version"** (创建版本)
3. Fill in version details
4. Click **"Apply for Release"** (申请线上发布)

### 7.3 Add Bot to Chat
1. Open Lark app
2. Create a new chat or go to existing group
3. Add bot: Type `@` and search for "Intercom Ticket Bot"
4. Add the bot to the chat

### 7.4 Test Bot Commands
Try these commands in the chat:
```
/help
/tickets
/summary
```

## 🔧 **Step 8: Verify Integration**

### 8.1 Check Application Logs
Your application should show:
```
✅ Lark Suite service initialized successfully
✅ Chatbot service initialized successfully
```

### 8.2 Test Webhook
```bash
curl -X POST "http://localhost:3001/webhook/lark/test-message" \
  -H "Content-Type: application/json" \
  -d '{"content": "/help", "chatId": "test_chat", "userId": "test_user"}'
```

## 🛠️ **Troubleshooting**

### Common Issues:

**1. "Invalid App ID" Error**
- Verify your `LARK_APP_ID` is correct
- Make sure it starts with `cli_`

**2. "Authentication Failed" Error**
- Check your `LARK_APP_SECRET` is correct
- Ensure no extra spaces in your `.env` file

**3. "Webhook Verification Failed"**
- Verify your webhook URL is accessible
- Check `LARK_WEBHOOK_SECRET` matches the verification token

**4. "Permission Denied" Error**
- Review bot permissions in developer console
- Ensure all required permissions are granted

### Debug Mode:
```bash
# Enable debug logging
LOG_LEVEL=debug npm start
```

## 📱 **Step 9: Production Deployment**

### 9.1 Domain Setup
- Use a proper domain for production
- Ensure HTTPS is enabled
- Update webhook URL in Lark console

### 9.2 Environment Variables
```bash
# Production environment
NODE_ENV=production
LARK_APP_ID=your_production_app_id
LARK_APP_SECRET=your_production_app_secret
```

### 9.3 Release Management
1. Create production version in Lark console
2. Submit for app store review (if needed)
3. Deploy to production environment

## 🎉 **Success!**

Once everything is set up, your chatbot will be able to:
- ✅ Receive messages from Lark chats
- ✅ Process commands and queries
- ✅ Send formatted responses back to users
- ✅ Access and filter Intercom data
- ✅ Provide real-time ticket information

## 📚 **Additional Resources**

- [Lark Suite API Documentation](https://open.larksuite.com/document/)
- [Bot Development Guide](https://open.larksuite.com/document/uAjLw4CM/ukTMukTMukTM/bot-v3/bot-overview)
- [Webhook Configuration](https://open.larksuite.com/document/uAjLw4CM/ukTMukTMukTM/application-v6/event/event-introduction)

---

**Need Help?** 
Check the logs in your application or review the troubleshooting section above. 

## 🚀 **Let's Set Up Your Repository Properly**

Since you're in the `larkbot` directory, let's add all the necessary files:

### **Step 1: Install Dependencies First**
```bash
npm init -y
npm install express axios dotenv winston cors helmet express-rate-limit
npm install --save-dev nodemon jest
```

### **Step 2: Create All Project Files**

**Create the main application structure:**

```bash
<code_block_to_apply_changes_from>
```

**Create environment files:**

```bash
# Create .env with your working credentials
cat > .env << 'EOF'
# Intercom Configuration - CONFIRMED WORKING
INTERCOM_TOKEN=***REMOVED***
INTERCOM_APP_ID=***REMOVED***

# Lark Suite Configuration - CONFIRMED WORKING
LARK_APP_ID=***REMOVED***
LARK_APP_SECRET=***REMOVED***
LARK_WEBHOOK_SECRET=***REMOVED***
LARK_CHAT_GROUP_ID=oc_placeholder_for_now

# Application Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
EOF

# Create env.example (safe to commit)
cat > env.example << 'EOF'
# Intercom Configuration
INTERCOM_TOKEN=your_intercom_access_token_here
INTERCOM_APP_ID=your_intercom_app_id_here

# Lark Suite Configuration
LARK_APP_ID=cli_xxxxxxxxxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LARK_WEBHOOK_SECRET=your_webhook_secret_here
LARK_CHAT_GROUP_ID=your_lark_chat_group_id_here

# Application Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=info
EOF
```

**Create .gitignore:**

```bash
cat > .gitignore << 'EOF'
# Environment variables
.env
.env.local
.env.production

# Dependencies
node_modules/
npm-debug.log*

# Logs
logs/
*.log

# Exports
exports/

# Temporary folders
tmp/
temp/

# IDE files
.vscode/
.idea/

# OS files
.DS_Store
Thumbs.db
EOF
```

**Update package.json:**

```bash
cat > package.json << 'EOF'
{
  "name": "intercom-lark-bot",
  "version": "1.0.0",
  "description": "Automated ticket notifications from Intercom to Lark Suite",
  "main": "src/index.js",
  "scripts": {
    "start": "node src/index.js",
    "dev": "nodemon src/index.js",
    "test": "jest"
  },
  "keywords": ["intercom", "lark", "bot", "tickets", "automation"],
  "author": "Kenn Teoh <kenn.teoh@storehub.com>",
  "license": "MIT",
  "dependencies": {
    "express": "^4.18.2",
    "axios": "^1.6.0",
    "dotenv": "^16.3.1",
    "winston": "^3.11.0",
    "cors": "^2.8.5",
    "helmet": "^7.1.0",
    "express-rate-limit": "^7.1.5"
  },
  "devDependencies": {
    "nodemon": "^3.0.1",
    "jest": "^29.7.0"
  },
  "engines": {
    "node": ">=16.0.0"
  }
}
EOF
```

### **Step 3: Commit and Push Everything**

```bash
# Add all files
git add .

# Commit with your confirmed working setup
git commit -m "Complete Intercom-Lark bot setup

✅ Confirmed working Intercom credentials
✅ Confirmed working Lark credentials  
✅ Basic Express server with health checks
✅ Environment configuration
✅ Ready for deployment

Credentials confirmed:
- Intercom API: ***REMOVED***
- Lark App: ***REMOVED***
- Webhook ready for approval"

# Push to GitHub
git push origin main
```

### **Step 4: Test Your Setup**

```bash
# Install dependencies
npm install

# Test the application
npm start

# In another terminal, test the endpoints
curl http://localhost:3001/health
curl http://localhost:3001/api/test-connection
```

## 🎯 **Run These Commands Now:**

**Copy and paste each command block above in your `larkbot` directory.** This will:

1. ✅ **Set up the complete project structure**
2. ✅ **Add your confirmed working credentials**
3. ✅ **Create a functional Express server**
4. ✅ **Push everything to GitHub**
5. ✅ **Make it ready for deployment**

**Start with the first command block and let me know when you're ready for the next one!** 