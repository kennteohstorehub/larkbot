#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const readline = require('readline');

/**
 * Interactive Lark Suite Setup Script
 * Helps users configure their Lark Suite API credentials
 */

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
});

function question(query) {
  return new Promise(resolve => rl.question(query, resolve));
}

async function main() {
  console.log('🦜 Lark Suite API Setup Assistant');
  console.log('=====================================\n');
  
  console.log('This script will help you configure your Lark Suite API credentials.');
  console.log('Make sure you have already created a Lark Suite app in the developer console.\n');
  
  console.log('📖 If you haven\'t created an app yet, please follow these steps:');
  console.log('1. Visit: https://open.larksuite.com/app (or https://open.feishu.cn/app for Chinese users)');
  console.log('2. Create a new "Custom App" with "Bot" capability');
  console.log('3. Get your App ID and App Secret from the "App Info" section');
  console.log('4. Configure permissions in "Permissions & Scopes" section\n');
  
  const proceed = await question('Have you created your Lark Suite app? (y/n): ');
  if (proceed.toLowerCase() !== 'y') {
    console.log('\n📚 Please create your Lark Suite app first, then run this script again.');
    console.log('Refer to LARK_API_SETUP_GUIDE.md for detailed instructions.');
    rl.close();
    return;
  }
  
  console.log('\n🔑 Let\'s configure your credentials...\n');
  
  // Get App ID
  const appId = await question('Enter your Lark App ID (starts with cli_): ');
  if (!appId.startsWith('cli_')) {
    console.log('⚠️  Warning: App ID should start with "cli_"');
  }
  
  // Get App Secret
  const appSecret = await question('Enter your Lark App Secret: ');
  
  // Get Webhook Secret (optional)
  const webhookSecret = await question('Enter your Webhook Verification Token (optional, starts with v_): ');
  
  // Get Intercom token (optional)
  const intercomToken = await question('Enter your Intercom Access Token (optional): ');
  
  // Create .env file
  const envPath = path.join(process.cwd(), '.env');
  const envContent = `# Intercom Configuration
INTERCOM_TOKEN=${intercomToken || 'your_intercom_access_token_here'}
INTERCOM_APP_ID=your_intercom_app_id_here

# Lark Suite Configuration
LARK_APP_ID=${appId}
LARK_APP_SECRET=${appSecret}
LARK_WEBHOOK_SECRET=${webhookSecret || 'your_webhook_secret_here'}

# Application Configuration
NODE_ENV=development
PORT=3001
LOG_LEVEL=info

# Feature Flags
ENABLE_WEBHOOKS=true
ENABLE_CHATBOT=true
ENABLE_MOCK_MODE=${intercomToken ? 'false' : 'true'}

# Optional: Database Configuration (for future phases)
REDIS_URL=redis://localhost:6379
DATABASE_URL=postgresql://localhost:5432/intercom_lark
`;

  try {
    fs.writeFileSync(envPath, envContent);
    console.log('\n✅ Configuration saved to .env file!');
  } catch (error) {
    console.error('\n❌ Error saving configuration:', error.message);
    rl.close();
    return;
  }
  
  console.log('\n🎉 Setup Complete!');
  console.log('==================\n');
  
  console.log('Next steps:');
  console.log('1. Start your application: npm start');
  console.log('2. Test the webhook: curl -X POST "http://localhost:3001/webhook/lark/test-message" \\');
  console.log('   -H "Content-Type: application/json" \\');
  console.log('   -d \'{"content": "/help", "chatId": "test_chat", "userId": "test_user"}\'');
  console.log('3. Add your bot to a Lark chat and test commands\n');
  
  console.log('📚 For detailed setup instructions, see: LARK_API_SETUP_GUIDE.md');
  console.log('🐛 For troubleshooting, check the application logs when you run: npm start');
  
  rl.close();
}

main().catch(error => {
  console.error('❌ Setup failed:', error.message);
  rl.close();
  process.exit(1);
}); 