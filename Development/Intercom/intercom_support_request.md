# Intercom Support Request - Webhook UI Issue

## Email Details

**To**: Intercom Support
**Subject**: Webhook Configuration UI Issue - Topics/Events Section Not Displaying (App ID: ***REMOVED***)
**Priority**: Medium
**Category**: Developer Support / API Integration

---

## Email Content

Dear Intercom Support Team,

I am writing to report a technical issue with the webhook configuration interface in the Intercom Developer Hub that is preventing me from subscribing to webhook events.

### Problem Description

I am experiencing a UI issue in the Developer Hub where the "Topics/Events" section is not appearing in the Webhooks configuration page, making it impossible to subscribe to webhook events.

**Specific Issue:**
- I can successfully access the Developer Hub and navigate to my app settings
- I can access the Webhooks section and configure the endpoint URL
- The webhook endpoint URL is accepted and verified successfully
- However, the "Topics/Events" subscription section does not display
- Without this section, I cannot subscribe to any webhook events

### App Details

- **App ID**: ***REMOVED***
- **App Type**: Internal Integration
- **Webhook Endpoint**: https://l2-onsite-monitor.onrender.com/webhook/intercom
- **Endpoint Status**: Successfully verified and responsive (returns 200 OK)
- **Required Events**: 
  - conversation.admin.opened
  - conversation.admin.assigned
  - conversation.admin.replied
  - conversation.admin.closed
  - conversation.admin.note.created

### Technical Context

**Use Case**: L2 Onsite Support Monitoring System
- We have built an automated monitoring system for L2 onsite support tickets
- The system processes webhook events to send real-time notifications to our support team via Lark Suite
- All code is complete and tested - we only need webhook event subscription to enable automatic operation

**Current Status**:
- Webhook endpoint is live and tested (manually verified)
- All permissions are correctly configured on the Authentication page
- Application processes webhook events correctly when tested manually
- System is production-ready except for automatic webhook delivery

### Troubleshooting Already Attempted

I have systematically tried multiple troubleshooting approaches:

**Browser Testing:**
- Google Chrome (latest version) - regular and incognito modes
- Mozilla Firefox (latest version) - regular and private browsing
- Safari (latest version)
- Microsoft Edge (latest version)

**Cache and Data Clearing:**
- Cleared all browser cache, cookies, and browsing data
- Used "Clear all time" option for comprehensive cleaning
- Restarted browsers after clearing data

**Network and Environment:**
- Tested on different networks (WiFi, mobile data)
- Tested from different physical locations
- Disabled all browser extensions temporarily
- Checked browser developer console for JavaScript errors (none found)

**Permission Verification:**
- Confirmed all required permissions are granted on Authentication page
- Verified app has necessary scopes for webhook subscription
- Double-checked app configuration multiple times

### Browser Console Analysis

I checked the browser developer console (F12 → Console) while accessing the Webhooks page and found no JavaScript errors or failed network requests that would indicate a client-side issue.

### Request for Assistance

Could you please help resolve this issue using one of the following approaches:

**Option 1: Fix the UI Issue**
- Investigate and resolve the UI bug preventing the Topics/Events section from displaying
- This would allow me to configure webhook subscriptions normally through the Developer Hub

**Option 2: Manual Configuration**
- Manually configure webhook event subscriptions for my app (***REMOVED***)
- Subscribe to the conversation events listed above
- This would be a temporary workaround while the UI issue is investigated

**Option 3: Alternative Method**
- Provide an alternative method or API endpoint to subscribe to webhook events
- If there's a programmatic way to configure subscriptions, please share the documentation

### Business Impact

This issue is blocking the deployment of our L2 onsite support monitoring system, which is designed to:
- Provide real-time notifications for urgent onsite support requests
- Improve response times for customer service operations
- Automate manual monitoring processes currently handled by our support team

The system is fully developed and tested, but cannot operate automatically without webhook event delivery from Intercom.

### Additional Information

**System Details:**
- Operating System: macOS 14.5.0
- Primary Browser: Chrome 127.x (also tested others as mentioned)
- Developer Hub URLs tested:
  - https://developers.intercom.com/
  - https://app.intercom.com/developers/
  - https://developers.intercom.com/building-apps/

**Timeline**: This issue has persisted for several days across multiple testing sessions.

### Expected Resolution

I would appreciate either:
1. A fix for the UI issue allowing normal webhook configuration, or
2. Manual configuration of webhook events for my app as a workaround, or
3. Guidance on alternative configuration methods

Thank you for your time and assistance. I'm available to provide any additional information, screenshots, or testing that might help resolve this issue.

Best regards,

[Your Name]
[Your Email]
[Your Company/Organization]
[Your Phone Number (optional)]

---

## Contact Information

**Submit this request via:**
- **Intercom Help Center**: https://www.intercom.com/help/en/articles/2966875-contact-us
- **Category**: Select "Developer Help" or "API/Integration Support"
- **Priority**: Medium (affects business operations but has workarounds)

## Follow-up Actions

1. **Submit the support request** using the content above
2. **Take screenshots** of the Webhooks page showing the missing Topics/Events section
3. **Attach screenshots** to the support request if possible
4. **Reference this app ID** (***REMOVED***) in all communications
5. **Monitor for response** (typically 24-48 hours for developer support)

## Backup Plan

While waiting for Intercom support response:
- Your system is fully functional and can be tested with manual webhook simulation
- All L2 onsite detection logic is working correctly
- Once webhook subscription is resolved, the system will operate automatically 