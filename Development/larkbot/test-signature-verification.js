#!/usr/bin/env node

const crypto = require('crypto');
const https = require('https');

// Configuration
const CLIENT_SECRET = 'f2188099-cf86-4217-903a-1bb5a3a51005'; // Your Intercom client_secret
const WEBHOOK_URL = 'https://l2-onsite-monitor.onrender.com/webhook/intercom';

// Test payload
const testPayload = {
  type: 'notification_event',
  topic: 'conversation.admin.assigned',
  id: 'test_' + Date.now(),
  created_at: Math.floor(Date.now() / 1000),
  data: {
    item: {
      type: 'conversation',
      id: 'test_signature_verification',
      team_assignee_id: 5372074,
      custom_attributes: {
        'Onsite Request Type': '👥 Site Inspection - New Merchant',
        '🌎 Country': '🇲🇾 Malaysia'
      }
    }
  }
};

// Convert payload to JSON string (must match exactly what Intercom sends)
const jsonPayload = JSON.stringify(testPayload);

// Calculate signature using SHA1 HMAC
const signature = 'sha1=' + crypto
  .createHmac('sha1', CLIENT_SECRET)
  .update(jsonPayload)
  .digest('hex');

console.log('🔐 Testing Intercom webhook signature verification');
console.log('📝 Client Secret:', CLIENT_SECRET);
console.log('🔏 Calculated Signature:', signature);
console.log('📦 Payload:', JSON.stringify(testPayload, null, 2));

// Prepare the request
const url = new URL(WEBHOOK_URL);
const options = {
  hostname: url.hostname,
  port: 443,
  path: url.pathname,
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    'Content-Length': Buffer.byteLength(jsonPayload),
    'X-Hub-Signature': signature,
    'X-Test-Mode': 'true'
  }
};

console.log('\n🚀 Sending test webhook with signature...');

const req = https.request(options, (res) => {
  let responseData = '';
  
  res.on('data', (chunk) => {
    responseData += chunk;
  });
  
  res.on('end', () => {
    console.log(`\n📡 Status Code: ${res.statusCode}`);
    console.log('📋 Response:', responseData);
    
    if (res.statusCode === 200) {
      console.log('\n✅ SUCCESS! Webhook signature verification is working correctly!');
      console.log('🎉 The client_secret is correct and signature verification passed.');
    } else if (res.statusCode === 401) {
      console.log('\n❌ FAILED! Signature verification failed.');
      console.log('🔍 This could mean:');
      console.log('   1. The client_secret is incorrect');
      console.log('   2. The signature calculation is wrong');
      console.log('   3. The body format doesn\'t match what Intercom sends');
      console.log('\n💡 Check the server logs for more details.');
    } else {
      console.log('\n⚠️  Unexpected status code. Check server logs.');
    }
  });
});

req.on('error', (error) => {
  console.error('\n❌ Request error:', error);
});

// Send the request
req.write(jsonPayload);
req.end();

// Also test locally if running in development
if (process.argv.includes('--local')) {
  console.log('\n🏠 Testing local signature calculation...');
  
  // Test with different JSON formatting
  const compactJson = JSON.stringify(testPayload);
  const prettyJson = JSON.stringify(testPayload, null, 2);
  
  const compactSignature = 'sha1=' + crypto.createHmac('sha1', CLIENT_SECRET).update(compactJson).digest('hex');
  const prettySignature = 'sha1=' + crypto.createHmac('sha1', CLIENT_SECRET).update(prettyJson).digest('hex');
  
  console.log('Compact JSON signature:', compactSignature);
  console.log('Pretty JSON signature:', prettySignature);
  console.log('Signatures match:', compactSignature === prettySignature ? 'NO (expected)' : 'YES');
}