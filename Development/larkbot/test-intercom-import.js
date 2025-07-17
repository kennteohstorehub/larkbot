console.log('Testing Intercom client import...');

try {
  const intercom = require('intercom-client');
  console.log('Full module:', Object.keys(intercom));
  console.log('Client type:', typeof intercom.Client);
  
  const { Client } = require('intercom-client');
  console.log('Destructured Client type:', typeof Client);
  
  const client = new Client({
    tokenAuth: { token: 'test' }
  });
  console.log('Client instance created successfully');
} catch (error) {
  console.error('Error:', error.message);
  console.error('Stack:', error.stack);
}