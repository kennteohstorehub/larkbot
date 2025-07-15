#!/usr/bin/env node

/**
 * Lark Chat Setup Script
 * Helps users get their chat group ID for notifications
 */

const config = require('../src/config');
const larkService = require('../src/services/lark');
const logger = require('../src/utils/logger');

class LarkChatSetup {
  constructor() {
    this.larkService = larkService;
  }

  async run() {
    console.log('🚀 Lark Chat Group Setup');
    console.log('========================\n');

    try {
      // Initialize Lark service
      await this.larkService.initialize();
      
      // Check if we have credentials
      if (!config.lark.appId || !config.lark.appSecret) {
        console.log('❌ Missing Lark credentials in .env file');
        console.log('Please add:');
        console.log('  LARK_APP_ID=your_app_id');
        console.log('  LARK_APP_SECRET=your_app_secret');
        return;
      }

      console.log('✅ Lark service initialized successfully\n');

      // Method 1: List all chats
      await this.listAllChats();

      // Method 2: Instructions for webhook method
      console.log('\n📋 Alternative Method: Get Chat ID via Webhook');
      console.log('==============================================');
      console.log('1. Start your application: npm start');
      console.log('2. Add your bot to a Lark group chat');
      console.log('3. Send a message to the bot: @YourBot /get-chat-id');
      console.log('4. The bot will respond with the chat group ID');
      console.log('5. Copy the ID to your .env file as LARK_CHAT_GROUP_ID');

      console.log('\n🎯 Next Steps:');
      console.log('1. Choose a chat group from the list above');
      console.log('2. Copy its Chat ID');
      console.log('3. Add to your .env file: LARK_CHAT_GROUP_ID=<chat_id>');
      console.log('4. Restart your application');
      console.log('5. Test webhook notifications');

    } catch (error) {
      console.error('❌ Setup failed:', error.message);
      console.log('\n🔧 Troubleshooting:');
      console.log('1. Check your Lark app credentials');
      console.log('2. Ensure your bot is published and approved');
      console.log('3. Verify the bot has proper permissions');
      console.log('4. Make sure the bot is added to at least one group');
    }
  }

  async listAllChats() {
    console.log('💬 Finding Chat Groups...');
    console.log('=========================');

    try {
      const chatsData = await this.larkService.getChats({ pageSize: 50 });
      
      if (!chatsData.items || chatsData.items.length === 0) {
        console.log('📭 No chat groups found.');
        console.log('Please add your bot to a Lark group chat first.');
        return;
      }

      console.log(`Found ${chatsData.items.length} chat group(s):\n`);

      chatsData.items.forEach((chat, index) => {
        console.log(`${index + 1}. ${chat.name || 'Unnamed Chat'}`);
        console.log(`   Chat ID: ${chat.chat_id}`);
        console.log(`   Type: ${chat.chat_mode || 'Unknown'}`);
        console.log(`   Members: ${chat.member_count || 'Unknown'}`);
        console.log('');
      });

    } catch (error) {
      console.error('❌ Failed to list chats:', error.message);
      
      console.log('\n🔧 Common Issues:');
      console.log('1. Bot not added to any groups');
      console.log('2. Insufficient permissions (need im:chat scope)');
      console.log('3. App not published or approved');
      console.log('4. Invalid credentials');
    }
  }

  async testChatAccess(chatId) {
    console.log(`\n🔍 Testing chat access: ${chatId}`);
    
    try {
      const chatInfo = await this.larkService.getChatInfo(chatId);
      console.log('✅ Chat access successful');
      console.log(`   Name: ${chatInfo.name}`);
      console.log(`   Type: ${chatInfo.chat_mode}`);
      return true;
    } catch (error) {
      console.log('❌ Chat access failed:', error.message);
      return false;
    }
  }

  async sendTestMessage(chatId) {
    console.log(`\n📤 Sending test message to: ${chatId}`);
    
    try {
      const message = {
        text: '🤖 Test message from Lark Chat Setup\n\nIf you see this, your chat group ID is working correctly!'
      };
      
      await this.larkService.sendMessage(chatId, message);
      console.log('✅ Test message sent successfully');
      return true;
    } catch (error) {
      console.log('❌ Failed to send test message:', error.message);
      return false;
    }
  }
}

// Run the setup if called directly
if (require.main === module) {
  const setup = new LarkChatSetup();
  setup.run().catch(console.error);
}

module.exports = LarkChatSetup; 