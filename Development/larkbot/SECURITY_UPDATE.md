# Security Update: Webhook Signature Verification

## Overview
We've implemented webhook signature verification for both Lark and Intercom webhooks to prevent unauthorized access and ensure that webhook requests are legitimate.

## Changes Made

### 1. Lark Webhook Security (webhook.js:16-60)
- **Verification Method**: HMAC-SHA256
- **Required Headers**: 
  - `x-lark-signature`: The signature to verify
  - `x-lark-request-timestamp`: Request timestamp
  - `x-lark-request-nonce`: Request nonce
- **Secret**: `LARK_WEBHOOK_SECRET` environment variable

### 2. Intercom Webhook Security (webhook.js:222-262)
- **Verification Method**: HMAC-SHA1 with 'sha1=' prefix
- **Required Header**: `x-hub-signature`
- **Secret**: `INTERCOM_WEBHOOK_SECRET` environment variable

## Configuration

### Environment Variables
Add these to your `.env` file:
```bash
LARK_WEBHOOK_SECRET=your_lark_webhook_secret_here
INTERCOM_WEBHOOK_SECRET=your_intercom_webhook_secret_here
```

### Development Mode
For local development, you can skip verification by setting:
```bash
NODE_ENV=development
SKIP_WEBHOOK_VERIFICATION=true
```

## Security Features

1. **Missing Headers Protection**: Returns 401 if required headers are missing
2. **Invalid Signature Protection**: Returns 401 if signature doesn't match
3. **Missing Secret Protection**: Returns 500 if webhook secret is not configured
4. **Secure Logging**: 
   - No secrets are logged
   - Failed attempts are logged with context for monitoring
   - Successful verifications logged at debug level

## Testing

Run the security test:
```bash
node test-webhook-security.js
```

## Production Deployment

1. **Set Webhook Secrets**: Ensure both `LARK_WEBHOOK_SECRET` and `INTERCOM_WEBHOOK_SECRET` are set in production environment
2. **Never Enable Skip Mode**: Do NOT set `SKIP_WEBHOOK_VERIFICATION=true` in production
3. **Monitor Failed Attempts**: Watch logs for failed signature verifications which could indicate attack attempts

## Next Steps

After deploying these changes:
1. Restart the application to load the new security configuration
2. Update webhook configurations in Lark and Intercom dashboards with the secrets
3. Test webhooks from both platforms to ensure they work with signature verification
4. Monitor logs for any authentication failures

## Additional Security Recommendations

1. **Rate Limiting**: Implement rate limiting to prevent DoS attacks (next priority)
2. **Input Validation**: Add request body validation using Joi
3. **Sanitize Logs**: Remove sensitive data from logs (PII, API responses)
4. **Request ID Tracking**: Add unique request IDs for better debugging
5. **Security Headers**: Ensure Helmet is properly configured