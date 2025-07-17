const axios = require('axios');
require('dotenv').config();

/**
 * Script to get Lark group IDs for configuring webhook notifications
 * Run this script to find the correct group IDs for your Lark chat groups
 */

class LarkGroupFinder {
  constructor() {
    this.baseURL = 'https://open.feishu.cn/open-apis';
    this.accessToken = null;
  }

  async getAccessToken() {
    if (!process.env.LARK_APP_ID || !process.env.LARK_APP_SECRET) {
      throw new Error('LARK_APP_ID and LARK_APP_SECRET are required');
    }

    try {
      const response = await axios.post(`${this.baseURL}/auth/v3/tenant_access_token/internal`, {
        app_id: process.env.LARK_APP_ID,
        app_secret: process.env.LARK_APP_SECRET
      });

      if (response.data.code !== 0) {
        throw new Error(`Failed to get access token: ${response.data.msg}`);
      }

      this.accessToken = response.data.tenant_access_token;
      console.log('✅ Successfully obtained Lark access token');
      return this.accessToken;
    } catch (error) {
      throw new Error(`Failed to get Lark access token: ${error.message}`);
    }
  }

  async getGroupList() {
    if (!this.accessToken) {
      await this.getAccessToken();
    }

    try {
      console.log('🔍 Fetching Lark group list...');
      
      // Get bot information first
      const botResponse = await axios.get(`${this.baseURL}/bot/v3/info`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        }
      });

      if (botResponse.data.code === 0) {
        console.log('🤖 Bot Information:');
        console.log(`  - Bot Name: ${botResponse.data.bot.app_name}`);
        console.log(`  - Bot ID: ${botResponse.data.bot.app_id}`);
      }

      // Try to get chat list (this might require additional permissions)
      const chatResponse = await axios.get(`${this.baseURL}/im/v1/chats`, {
        headers: {
          'Authorization': `Bearer ${this.accessToken}`
        },
        params: {
          page_size: 50
        }
      });

      if (chatResponse.data.code === 0 && chatResponse.data.data) {
        console.log('\n💬 Available Chat Groups:');
        const chats = chatResponse.data.data.items || [];
        
        if (chats.length === 0) {
          console.log('  No chat groups found (bot might need to be added to groups first)');
        } else {
          chats.forEach((chat, index) => {
            console.log(`  ${index + 1}. ${chat.name || 'Unnamed Group'}`);
            console.log(`     - Chat ID: ${chat.chat_id}`);
            console.log(`     - Type: ${chat.chat_type}`);
            console.log(`     - Members: ${chat.member_count || 'Unknown'}`);
            console.log('');
          });
        }
        
        return chats;
      } else {
        console.log('⚠️ Could not fetch chat groups. This might be due to permissions.');
        console.log(`Error: ${chatResponse.data.msg}`);
        return [];
      }
    } catch (error) {
      console.error('❌ Failed to fetch group list:', error.response?.data || error.message);
      throw error;
    }
  }

  async findGroupsContaining(searchTerm) {
    const groups = await this.getGroupList();
    const matching = groups.filter(group => 
      (group.name && group.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (group.description && group.description.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    if (matching.length > 0) {
      console.log(`\n🎯 Groups containing "${searchTerm}":`);
      matching.forEach(group => {
        console.log(`  - ${group.name}: ${group.chat_id}`);
      });
    } else {
      console.log(`\n❌ No groups found containing "${searchTerm}"`);
    }

    return matching;
  }

  generateEnvConfig(groups) {
    console.log('\n📋 Environment Configuration:');
    console.log('Copy these values to your Render environment variables:\n');

    if (groups.length > 0) {
      groups.forEach((group, index) => {
        const envName = group.name
          .toUpperCase()
          .replace(/[^A-Z0-9]/g, '_')
          .replace(/_+/g, '_')
          .replace(/^_|_$/g, '');
        
        console.log(`LARK_CHAT_GROUP_ID_${envName}=${group.chat_id}`);
      });
    }

    console.log('\nOr update your .env file:');
    console.log('LARK_CHAT_GROUP_ID=<main_group_id>');
    console.log('LARK_CHAT_GROUP_ID_MYPHFE=<myphfe_group_id>');
    console.log('LARK_CHAT_GROUP_ID_COMPLEX_SETUP=<complex_setup_group_id>');
  }
}

async function main() {
  console.log('🦜 Lark Group ID Finder\n');

  try {
    const finder = new LarkGroupFinder();
    const groups = await finder.getGroupList();

    if (groups.length > 0) {
      // Look for specific groups
      console.log('\n🔍 Searching for common group patterns...');
      await finder.findGroupsContaining('MY');
      await finder.findGroupsContaining('PH');
      await finder.findGroupsContaining('FE');
      await finder.findGroupsContaining('complex');
      await finder.findGroupsContaining('setup');
      await finder.findGroupsContaining('onsite');
      await finder.findGroupsContaining('support');

      finder.generateEnvConfig(groups);
    }

    console.log('\n📖 Instructions:');
    console.log('1. Add your bot to the desired Lark chat groups');
    console.log('2. Copy the chat_id values to your Render environment variables');
    console.log('3. Redeploy your application');
    console.log('4. Test the webhook with a sample ticket event');

  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('\n🔧 Troubleshooting:');
    console.log('1. Check that LARK_APP_ID and LARK_APP_SECRET are correct');
    console.log('2. Ensure the Lark app has the necessary permissions');
    console.log('3. Add the bot to your chat groups first');
  }
}

if (require.main === module) {
  main();
}