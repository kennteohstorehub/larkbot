#!/usr/bin/env node

const https = require('https');

const RENDER_API_KEY = 'rnd_cZpge5M88A7K0dkzJwxY01JkEbEG';
const SERVICE_ID = 'srv-d1oifaodl3ps73fgjt90';

console.log('🔐 Removing SKIP_INTERCOM_SIGNATURE_CHECK environment variable...');

// First, let's get all current env vars
const getOptions = {
  hostname: 'api.render.com',
  port: 443,
  path: `/v1/services/${SERVICE_ID}/env-vars`,
  method: 'GET',
  headers: {
    'Authorization': `Bearer ${RENDER_API_KEY}`,
    'Accept': 'application/json'
  }
};

https.request(getOptions, (res) => {
  let data = '';
  
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    if (res.statusCode !== 200) {
      console.error('❌ Failed to get environment variables:', res.statusCode, data);
      return;
    }
    
    const envVars = JSON.parse(data);
    console.log('📋 Current environment variables:');
    envVars.forEach(env => {
      const key = env.key || '';
      const value = (key.includes('SECRET') || key.includes('TOKEN')) ? '***' : env.value;
      console.log(`  - ${key}: ${value}`);
    });
    
    // Find the bypass variable
    const bypassVar = envVars.find(env => env.key === 'SKIP_INTERCOM_SIGNATURE_CHECK');
    
    if (!bypassVar) {
      console.log('✅ SKIP_INTERCOM_SIGNATURE_CHECK is not set (already removed)');
      return;
    }
    
    console.log('\n🗑️  Found SKIP_INTERCOM_SIGNATURE_CHECK, removing it...');
    
    // Filter out the bypass variable
    const updatedVars = envVars.filter(env => env.key !== 'SKIP_INTERCOM_SIGNATURE_CHECK');
    
    // Update all env vars
    const updateOptions = {
      hostname: 'api.render.com',
      port: 443,
      path: `/v1/services/${SERVICE_ID}/env-vars`,
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${RENDER_API_KEY}`,
        'Content-Type': 'application/json'
      }
    };
    
    const updateReq = https.request(updateOptions, (updateRes) => {
      let updateData = '';
      
      updateRes.on('data', (chunk) => {
        updateData += chunk;
      });
      
      updateRes.on('end', () => {
        if (updateRes.statusCode === 200) {
          console.log('✅ Successfully removed SKIP_INTERCOM_SIGNATURE_CHECK!');
          console.log('🚀 The service will redeploy automatically.');
          console.log('\n🔏 Webhook signature verification is now ENABLED.');
          console.log('📝 Using client_secret for verification: f2188099-cf86-4217-903a-1bb5a3a51005');
        } else {
          console.error('❌ Failed to update environment variables:', updateRes.statusCode, updateData);
        }
      });
    });
    
    updateReq.on('error', (error) => {
      console.error('❌ Request error:', error);
    });
    
    // Send only the key-value pairs
    const varsToUpdate = updatedVars.map(env => ({ key: env.key, value: env.value }));
    updateReq.write(JSON.stringify(varsToUpdate));
    updateReq.end();
  });
}).on('error', (error) => {
  console.error('❌ Request error:', error);
}).end();