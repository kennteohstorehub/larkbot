# 🔑 Intercom Credentials Setup Guide

## 🎯 **Goal: Get Your Intercom API Access**

You need these credentials to allow your application to read ticket data from Intercom.

## 📋 **What You'll Get**

- ✅ **Access Token** - to authenticate API calls
- ✅ **App ID** - to identify your application
- ✅ **Webhook setup** - for real-time notifications

## 🚀 **Step 1: Access Intercom Developer Hub**

### **1.1 Go to Developer Hub**
1. Visit: [https://developers.intercom.com/](https://developers.intercom.com/)
2. Click **"Sign in"** (top right)
3. Use your Intercom account credentials

### **1.2 If You Don't Have Developer Access**
- Ask your Intercom admin to give you **developer permissions**
- Or ask them to follow this guide and share the credentials with you

## 🏗️ **Step 2: Create Your App**

### **2.1 Create New App**
1. In the Developer Hub, click **"New app"**
2. Fill in the details:
   ```
   App Name: Intercom Ticket Bot
   Description: Automated ticket notifications for Lark Suite
   Company: Your company name
   ```
3. Click **"Create app"**

### **2.2 Choose Integration Type**
- Select **"Build an integration"**
- Choose **"Internal integration"** (recommended for your use case)

## 🔐 **Step 3: Get Your Access Token**

### **3.1 Navigate to Authentication**
1. In your app dashboard, go to **"Authentication"** tab
2. Look for **"Access Token"** section

### **3.2 Generate Access Token**
1. Click **"Generate access token"**
2. **Copy the token** - it looks like:
   ```
   dG9rXzEyMzQ1Njc4OTBfYWJjZGVmZ2hpams=
   ```
3. **⚠️ IMPORTANT:** Save this token securely - you can't see it again!

### **3.3 Token Permissions**
Your token will have these permissions by default:
- ✅ Read conversations
- ✅ Read contacts  
- ✅ Read tickets
- ✅ Read admins
- ✅ Read tags

## 🆔 **Step 4: Get Your App ID**

### **4.1 Find App ID**
1. In your app dashboard, go to **"Basic Information"** tab
2. Look for **"App ID"** - it looks like:
   ```
   abcd1234
   ```
3. **Copy this ID**

### **4.2 Alternative Method**
You can also find it in the URL:
```
https://developers.intercom.com/app/abcd1234/...
                                    ^^^^^^^^
                                   This is your App ID
```

## 🔗 **Step 5: Set Up Webhooks**

### **5.1 Configure Webhook URL**
1. Go to **"Webhooks"** tab in your app
2. Click **"Add webhook"**
3. Enter your webhook URL:
   ```
   https://your-app-name.onrender.com/webhook/intercom
   ```
   (Or your ngrok URL for testing: `https://abc123.ngrok.io/webhook/intercom`)

### **5.2 Subscribe to Events**
Select these events for ticket notifications:
- ✅ `conversation.admin.assigned`
- ✅ `conversation.admin.closed`
- ✅ `conversation.admin.opened`
- ✅ `conversation.admin.replied`
- ✅ `conversation.admin.note.created`
- ✅ `conversation.admin.snoozed`
- ✅ `conversation.admin.unsnoozed`

### **5.3 Webhook Security (Optional)**
- You can set a **webhook secret** for additional security
- If you do, add it to your `.env` as `WEBHOOK_SECRET`

## ⚙️ **Step 6: Update Your Environment**

### **6.1 Add to .env File**
```bash
# Intercom Configuration
INTERCOM_TOKEN=dG9rXzEyMzQ1Njc4OTBfYWJjZGVmZ2hpams=
INTERCOM_APP_ID=abcd1234

# Optional: Webhook Security
WEBHOOK_SECRET=your_webhook_secret_here
```

### **6.2 Test Your Credentials**
```bash
# Test API access
curl -X GET "https://api.intercom.io/me" \
  -H "Authorization: Bearer dG9rXzEyMzQ1Njc4OTBfYWJjZGVmZ2hpams=" \
  -H "Accept: application/json"

# You should get a response with your app details
```

## 🧪 **Step 7: Test Integration**

### **7.1 Test API Connection**
```bash
# Start your application
npm start

# Test Intercom connection
curl http://localhost:3001/api/test-connection

# You should see: {"status": "success", "message": "Connected to Intercom"}
```

### **7.2 Test Webhook**
```bash
# Test webhook endpoint
curl -X POST "http://localhost:3001/webhook/intercom" \
  -H "Content-Type: application/json" \
  -d '{
    "type": "conversation.admin.opened",
    "data": {
      "item": {
        "id": "test123",
        "subject": "Test ticket",
        "created_at": 1640995200
      }
    }
  }'
```

## 📊 **Step 8: Verify Data Access**

### **8.1 Test Conversation Access**
```bash
# Get recent conversations
curl http://localhost:3001/api/conversations

# You should see your Intercom conversations
```

### **8.2 Test Ticket Access**
```bash
# Get recent tickets  
curl http://localhost:3001/api/tickets

# You should see your Intercom tickets
```

## 🛠️ **Troubleshooting**

### **Common Issues:**

**1. "Unauthorized" Error**
- Check your access token is correct
- Ensure no extra spaces in `.env` file
- Verify token hasn't expired

**2. "App not found" Error**
- Check your App ID is correct
- Ensure you're using the right Intercom workspace

**3. "No data returned"**
- Check you have conversations/tickets in Intercom
- Verify API permissions are granted
- Test with Intercom's API explorer

**4. "Webhook not receiving events"**
- Verify webhook URL is accessible
- Check webhook events are subscribed
- Test webhook endpoint manually

### **Debug Commands:**
```bash
# Check API rate limits
curl http://localhost:3001/api/rate-limit

# Check detailed health
curl http://localhost:3001/health/detailed

# Check logs
tail -f logs/app.log
```

## 🎯 **What You Should Have Now**

After completing this guide:
- ✅ **Access Token** in your `.env` file
- ✅ **App ID** in your `.env` file  
- ✅ **Webhook configured** to your app URL
- ✅ **API access tested** and working
- ✅ **Integration ready** for Lark notifications

## 🚀 **Next Steps**

1. **Test your Intercom integration** (API calls work)
2. **Set up your Lark credentials** (for notifications)
3. **Deploy to production** (Render.com)
4. **Test end-to-end flow** (Intercom → Your app → Lark)

## 🔐 **Security Best Practices**

- ✅ **Never commit** your access token to git
- ✅ **Use environment variables** for all credentials
- ✅ **Rotate tokens** periodically
- ✅ **Monitor API usage** for unusual activity
- ✅ **Use webhook secrets** for additional security

## 🎉 **You're Ready!**

Your Intercom integration is now configured! The system can now:
- 📊 **Read ticket data** from your Intercom workspace
- 🔔 **Receive real-time notifications** when tickets change
- 📈 **Generate summaries** and statistics
- 🤖 **Respond to chatbot commands** with live data

**Ready to set up your Lark credentials next?** 