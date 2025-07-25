# Webhook Signature Verification Fix

**Date**: July 25, 2025  
**Status**: ✅ RESOLVED  

## Summary

Fixed Intercom webhook signature verification failure caused by Express middleware ordering issue. The webhook is now properly verifying signatures using Intercom's client_secret.

## Root Cause Analysis

The webhook signature verification was failing due to a **middleware ordering issue** in Express:

1. **Global JSON parsing middleware** in `src/index.js` was parsing ALL request bodies before they reached the webhook handler:
   ```javascript
   this.app.use(express.json({ limit: '10mb' }));
   ```

2. **Webhook signature verification requires the raw body** to compute the HMAC signature, but the webhook handler was receiving a parsed JavaScript object instead of the raw Buffer.

3. The webhook handler had code to handle Buffer bodies (`Buffer.isBuffer(req.body)`), but it never received a Buffer due to the middleware ordering.

4. When `JSON.stringify(req.body)` was used to recreate the body, it didn't match the original raw body that Intercom used to calculate the signature due to formatting differences.

## Solution Implemented

### 1. Express Middleware Ordering Fix
In `src/index.js`, added raw body parsing specifically for the Intercom webhook route BEFORE the global JSON middleware:

```javascript
// CRITICAL: Raw body parsing for webhook signature verification
// This MUST come before the global JSON parsing middleware
this.app.use('/webhook/intercom', express.raw({ type: 'application/json', limit: '10mb' }));

// Body parsing (comes after raw body capture)
this.app.use(express.json({ limit: '10mb' }));
```

### 2. Enhanced Signature Verification
The `verifyIntercomSignature` function in `src/routes/webhook.js` already had proper logic to:
- Check if the body is a Buffer (raw body) or already parsed
- Use the raw body string for signature verification
- Parse the JSON after verification if needed

```javascript
// Get the raw body for signature verification
const rawBody = Buffer.isBuffer(req.body) ? req.body.toString('utf8') : JSON.stringify(req.body);

// Intercom uses SHA1 with 'sha1=' prefix
const expectedSignature = 'sha1=' + crypto
  .createHmac('sha1', webhookSecret)
  .update(rawBody)
  .digest('hex');
```

## Key Discoveries

1. **Intercom uses the app's client_secret** from the Basic Info page for webhook signatures
   - There is NO separate "webhook secret"
   - The client_secret is: `f2188099-cf86-4217-903a-1bb5a3a51005`
   - This was confirmed through research and successful testing

2. **Signature format**: `sha1=<40-character-hex-signature>`
   - Uses SHA1 HMAC algorithm
   - Requires exact raw body bytes as received
   - Header name: `X-Hub-Signature` (Express lowercases to `x-hub-signature`)

3. **Express middleware ordering is critical** for webhook signature verification
   - Raw body parsing must be route-specific
   - Must be registered before global body parsers
   - Other routes continue to use standard JSON parsing

## Testing & Verification

Created `test-signature-verification.js` to verify the fix:
- Calculates signature using client_secret
- Sends test webhook with proper headers
- Confirms signature verification passes

### Test Results:
```
✅ SUCCESS! Webhook signature verification is working correctly!
🎉 The client_secret is correct and signature verification passed.
```

## Security Improvements

- ✅ Webhook signature verification is now properly enabled
- ✅ Removed the `SKIP_INTERCOM_SIGNATURE_CHECK` bypass
- ✅ All webhook requests are validated to ensure they come from Intercom
- ✅ No security vulnerabilities from accepting unverified webhooks

## Files Modified

1. `src/index.js` - Added raw body parsing for webhook route
2. `src/routes/webhook.js` - Enhanced debugging for signature verification
3. `test-signature-verification.js` - Created comprehensive test script

## Deployment Status

- Code committed and pushed to main branch
- Render deployment triggered automatically
- Signature bypass environment variable removed
- Production webhook is now secure

## Important Notes

- The order of middleware is crucial - raw body capture must come before express.json()
- This fix only applies to the `/webhook/intercom` endpoint
- Other endpoints continue to use the standard JSON parsing
- The solution maintains backward compatibility while fixing the signature verification issue
- No changes needed in Intercom configuration - continue using the existing webhook setup