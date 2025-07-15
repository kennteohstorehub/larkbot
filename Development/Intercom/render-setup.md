# 🚀 Render Environment Setup Guide

## 🎯 **Goal: Configure L2 Onsite Monitor on Render**

Since the CLI authentication is having issues, here's how to manually configure your environment variables through the Render Dashboard.

## 📋 **Required Environment Variables**

Based on your application analysis, you need to set these environment variables on Render:

### **1. Essential Variables (Required)**
```bash
# Webhook Configuration (Critical - App won't start without this)
WEBHOOK_SECRET=l2-onsite-monitor-webhook-secret-2024

# Application Configuration
NODE_ENV=production
PORT=10000
LOG_LEVEL=info

# Feature Flags
ENABLE_WEBHOOKS=true
ENABLE_CHATBOT=true
ENABLE_MONITORING=true
```

### **2. Intercom Configuration (For Real Data)**
```bash
# Replace with your actual Intercom credentials
INTERCOM_TOKEN=your_actual_intercom_token_here
INTERCOM_APP_ID=***REMOVED***
INTERCOM_API_VERSION=2.11
```

### **3. Lark Configuration (For Notifications)**
```bash
# Already configured in your documentation
LARK_APP_ID=***REMOVED***
LARK_APP_SECRET=***REMOVED***
LARK_WEBHOOK_SECRET=***REMOVED***

# This needs to be obtained after Lark app approval
LARK_CHAT_GROUP_ID=[PENDING - Need after app approval]
```

## 🔧 **Step-by-Step Setup Instructions**

### **Step 1: Access Your Render Service**
1. Go to [Render Dashboard](https://dashboard.render.com)
2. Sign in to your account
3. Find your service: `l2-onsite-monitor`
4. Click on the service name

### **Step 2: Navigate to Environment Variables**
1. In the left sidebar, click **Environment**
2. You'll see the **Environment Variables** section

### **Step 3: Add Required Variables**
Click **+ Add Environment Variable** for each of these:

#### **Critical Variables (Add These First)**
| Key | Value |
|-----|-------|
| `WEBHOOK_SECRET` | `l2-onsite-monitor-webhook-secret-2024` |
| `NODE_ENV` | `production` |
| `PORT` | `10000` |
| `ENABLE_WEBHOOKS` | `true` |

#### **Intercom Variables (When Available)**
| Key | Value |
|-----|-------|
| `INTERCOM_TOKEN` | `your_actual_intercom_token` |
| `INTERCOM_APP_ID` | `***REMOVED***` |

#### **Lark Variables (Current)**
| Key | Value |
|-----|-------|
| `LARK_APP_ID` | `***REMOVED***` |
| `LARK_APP_SECRET` | `***REMOVED***` |
| `LARK_WEBHOOK_SECRET` | `***REMOVED***` |

### **Step 4: Save and Deploy**
1. After adding all variables, click **Save Changes**
2. Select **Save and Deploy** to restart your service with new variables
3. Wait for the deployment to complete

## 🧪 **Testing Your Setup**

### **Test 1: Basic Health Check**
```bash
curl https://l2-onsite-monitor.onrender.com/health
```
**Expected**: Should return status "ok" without errors


### **Test 2: Application Root**
```bash
curl https://l2-onsite-monitor.onrender.com/
```
**Expected**: Should return API information and endpoints

### **Test 3: Webhook Endpoint**
```bash
curl -X POST https://l2-onsite-monitor.onrender.com/webhook/intercom \
  -H "Content-Type: application/json" \
  -d '{"test": "data"}'
```
**Expected**: Should not return 502 error

## 🎯 **Priority Order**

### **Immediate (Do Now)**
1. ✅ Add `WEBHOOK_SECRET` - **Critical for app startup**
2. ✅ Add `NODE_ENV=production`
3. ✅ Add `PORT=10000`
4. ✅ Add `ENABLE_WEBHOOKS=true`

### **Next (When Available)**
1. ⏳ Add `INTERCOM_TOKEN` - **For real data**
2. ⏳ Add `LARK_CHAT_GROUP_ID` - **For notifications**

### **Later (Optional)**
1. 📅 Add additional Lark configuration
2. 📅 Add monitoring and logging variables

## 🔍 **Current Status Check**

Your application is currently running in **mock mode** because:
- ✅ Basic server is working
- ✅ Health checks pass
- ✅ API endpoints respond
- ❌ Missing `WEBHOOK_SECRET` (causes startup issues)
- ❌ Missing real Intercom token (uses mock data)
- ❌ Missing Lark chat group ID (can't send notifications)

## 🚨 **Troubleshooting**

### **If App Won't Start**
1. Check logs in Render dashboard
2. Ensure `WEBHOOK_SECRET` is set
3. Verify `PORT=10000` is set

### **If Webhooks Don't Work**
1. Check `ENABLE_WEBHOOKS=true`
2. Verify webhook endpoint is accessible
3. Check Intercom webhook configuration

### **If Notifications Don't Send**
1. Verify Lark app is approved
2. Check `LARK_CHAT_GROUP_ID` is set
3. Test Lark bot permissions

## 📞 **Next Steps After Setup**

1. **Configure Intercom Webhook**
   - URL: `https://l2-onsite-monitor.onrender.com/webhook/intercom`
   - Events: `conversation.admin.opened`, `conversation.admin.assigned`, etc.

2. **Complete Lark Setup**
   - Get organizational approval for Lark app
   - Obtain chat group ID
   - Test end-to-end notifications

3. **Test L2 Onsite Monitoring**
   - Create test L2 onsite ticket
   - Verify webhook triggers
   - Confirm Lark notifications

## 🎉 **Success Metrics**

When setup is complete, you should have:
- ✅ Application starts without errors
- ✅ Health checks pass
- ✅ Webhook endpoints respond
- ✅ Real-time L2 onsite monitoring
- ✅ Automatic Lark notifications 