# 🌐 Webhook Setup Guide - Quick Start

## 🎯 **Goal: Get Your Webhook URL in 5 Minutes**

You need a webhook URL for Intercom to send ticket updates to your application. Here's the fastest way to get started.

## 🚀 **Option 1: Development/Testing (FREE)**

### **Step 1: Install ngrok**
```bash
# Install ngrok globally
npm install -g ngrok

# Or download from: https://ngrok.com/download
```

### **Step 2: Start Your Application**
```bash
# In your project directory
npm start

# Your app will run on: http://localhost:3001
```

### **Step 3: Expose Your Local Server**
```bash
# In a new terminal window
ngrok http 3001

# You'll see output like:
# Forwarding    https://abc123.ngrok.io -> http://localhost:3001
```

### **Step 4: Get Your Webhook URLs**
From the ngrok output, your webhook URLs are:
- **Intercom webhook**: `https://abc123.ngrok.io/webhook/intercom`
- **Lark webhook**: `https://abc123.ngrok.io/webhook/lark`

### **Step 5: Configure Intercom**
1. Go to [Intercom Developer Hub](https://developers.intercom.com/)
2. Navigate to your app → **Webhooks**
3. Add webhook URL: `https://abc123.ngrok.io/webhook/intercom`
4. Subscribe to these events:
   - `conversation.admin.opened`
   - `conversation.admin.assigned`
   - `conversation.admin.closed`
   - `conversation.admin.replied`
   - `conversation.admin.note.created`

### **Step 6: Configure Lark**
1. Go to [Lark Developer Console](https://open.feishu.cn/app)
2. Navigate to your app → **Event Subscriptions**
3. Set webhook URL: `https://abc123.ngrok.io/webhook/lark`
4. Subscribe to: `im.message.receive_v1`

### **Step 7: Test Everything**
```bash
# Test Intercom webhook
curl -X POST "https://abc123.ngrok.io/webhook/intercom" \
  -H "Content-Type: application/json" \
  -d '{"type": "conversation.admin.opened", "data": {"item": {"id": "test123"}}}'

# Test Lark webhook  
curl -X POST "https://abc123.ngrok.io/webhook/lark/test-message" \
  -H "Content-Type: application/json" \
  -d '{"content": "/help", "chatId": "your_chat_group_id", "userId": "test_user"}'
```

## 🏭 **Option 2: Production Deployment (FREE)**

### **Using Render.com (Recommended)**

1. **Push your code to GitHub**
2. **Go to [Render.com](https://render.com/)**
3. **Create new Web Service**
4. **Connect your GitHub repository**
5. **Configure deployment:**
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Environment Variables**: Add all your `.env` variables

6. **Your webhook URLs will be:**
   - Intercom: `https://your-app-name.onrender.com/webhook/intercom`
   - Lark: `https://your-app-name.onrender.com/webhook/lark`

### **Using Railway.app**

1. **Install Railway CLI**: `npm install -g @railway/cli`
2. **Deploy your app**: `railway deploy`
3. **Your webhook URLs will be:**
   - Intercom: `https://your-app-name.railway.app/webhook/intercom`
   - Lark: `https://your-app-name.railway.app/webhook/lark`

## 🔧 **Environment Variables for Production**

Make sure to set these in your deployment platform:

```bash
# Intercom
INTERCOM_TOKEN=your_token_here
INTERCOM_APP_ID=your_app_id_here

# Lark Suite
LARK_APP_ID=cli_xxxxxxxxxxxxxxxxx
LARK_APP_SECRET=xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
LARK_WEBHOOK_SECRET=your_webhook_secret_here
LARK_CHAT_GROUP_ID=your_chat_group_id_here

# Application
NODE_ENV=production
PORT=3001
```

## 🎯 **Quick Decision Guide**

**For Testing/Development:**
- ✅ Use **ngrok** - free, instant, works from your local machine
- ✅ Perfect for testing webhook integration
- ✅ No deployment needed

**For Production:**
- ✅ Use **Render.com** or **Railway.app** - free tiers available
- ✅ Permanent URLs that don't change
- ✅ Automatic deployments from GitHub

## 🚨 **Important Notes**

1. **ngrok URLs change** every time you restart ngrok (unless you have a paid plan)
2. **Always use HTTPS** - both Intercom and Lark require secure webhooks
3. **Keep ngrok running** while testing - if it stops, your webhook stops working
4. **For production**, use a permanent hosting solution

## 🎉 **You're Ready!**

Start with ngrok for testing, then move to a cloud platform when you're ready for production. The webhook setup is the same - just the URL changes!

**Next Steps:**
1. Get your webhook URL (ngrok or cloud)
2. Configure Intercom webhook
3. Configure Lark webhook  
4. Test with a real ticket
5. Enjoy automatic notifications! 🎊 

Perfect! 🎉 Your bot is now in a group. Let's get that chat group ID!

## 🔍 **Method 1: Get Chat ID from Bot Interaction (Easiest)**

### **Step 1: Update Your .env File**
Add a placeholder chat ID for now:

```bash
<code_block_to_apply_changes_from>
```

### **Step 2: Set Up ngrok (for webhook testing)**
```bash
# Install ngrok if you haven't
npm install -g ngrok

# Start your application
npm start

# In another terminal, start ngrok
ngrok http 3001
```

### **Step 3: Configure Webhook in Lark**
1. **Go back to your Lark app dashboard**
2. **Events & Callbacks** → **Event Configuration**
3. **Add Request URL**: `https://your-ngrok-url.ngrok.io/webhook/lark`
4. **Subscribe to**: `im.message.receive_v1`

### **Step 4: Send Message to Bot**
1. **Go to your Lark group chat**
2. **Send any message** to the bot: `@ComplexSetup Update Bot hello`
3. **Check your application logs** - you'll see the chat ID!

## 🔍 **Method 2: Use Lark's Built-in Method**

### **In Your Lark Group Chat:**
1. **Right-click on the group name** (desktop) or **tap group info** (mobile)
2. **Look for "Group Settings"** or **"Group Info"**
3. **Find "Group ID"** or **"Chat ID"**
4. **Copy the ID** (format: `oc_xxxxxxxxxxxxxxxxx`)

## 🔍 **Method 3: Check Application Logs**

If you have your app running and webhook configured:

```bash
# Start your app with logging
npm start

# Check logs in real-time
tail -f logs/app.log

# Send message to bot in group
# Look for log entries like:
# "📨 Processing Lark message {"chatId": "oc_xxxxxxxxxxxxxxxxx", ...}"
```

## 🎯 **Quick Test Method:**

### **Step 1: Start Your App**
```bash
npm start
```

### **Step 2: Test Webhook Endpoint**
```bash
# Test if webhook is working
curl -X POST "http://localhost:3001/webhook/lark/test-message" \
  -H "Content-Type: application/json" \
  -d '{
    "content": "/help",
    "chatId": "test_chat_id",
    "userId": "test_user"
  }'
```

### **Step 3: Send Message in Group**
1. **Go to your Lark group**
2. **Type**: `@ComplexSetup Update Bot /help`
3. **Send the message**
4. **Check your terminal logs** for the chat ID

## 🔍 **What Chat ID Looks Like:**
- Format: `oc_xxxxxxxxxxxxxxxxx`
- Example: `oc_1234567890abcdef1234567890abcdef`

## 🎯 **Which Method Do You Want to Try?**

1. **Method 1** (webhook + logs) - Most reliable
2. **Method 2** (Lark UI) - Quickest if available
3. **Method 3** (application logs) - If webhook is already set up

**I recommend Method 1. Should we set up ngrok and configure the webhook first?** 