const config = require('../../config');
const logger = require('../../utils/logger');
const { intercomService, exportService } = require('../../services');

/**
 * Phase 1: Basic Intercom Setup & Data Extraction
 * This phase focuses on establishing connectivity and basic data extraction
 */
class Phase1Implementation {
  constructor() {
    this.name = 'Phase 1: Basic Setup & Data Extraction';
    this.goals = [
      'Establish Intercom API connection',
      'Extract basic conversation and ticket data',
      'Implement data export functionality',
      'Test with sample data'
    ];
  }

  /**
   * Runs Phase 1 implementation
   */
  async run() {
    try {
      logger.info(`Starting ${this.name}`);
      console.log('\n=== PHASE 1: BASIC SETUP & DATA EXTRACTION ===\n');

      // Step 1: Test connection
      await this.testConnection();

      // Step 2: Extract sample data
      await this.extractSampleData();

      // Step 3: Test export functionality
      await this.testExportFunctionality();

      // Step 4: Generate summary report
      await this.generateSummaryReport();

      logger.info('Phase 1 completed successfully');
      console.log('\n✅ Phase 1 completed successfully!\n');
    } catch (error) {
      logger.logError('Phase1.run', error);
      console.error('\n❌ Phase 1 failed:', error.message);
      throw error;
    }
  }

  /**
   * Step 1: Test Intercom API connection
   */
  async testConnection() {
    console.log('🔗 Step 1: Testing Intercom API connection...');

    try {
      const connectionInfo = await intercomService.testConnection();

      console.log('✅ Connection successful!');
      console.log(`   Admin Name: ${connectionInfo.name}`);
      console.log(`   Admin Email: ${connectionInfo.email}`);
      console.log(`   Admin ID: ${connectionInfo.id}\n`);

      // Check rate limit
      const rateLimitInfo = intercomService.getRateLimitInfo();
      console.log('📊 Rate Limit Status:');
      console.log(`   Remaining: ${rateLimitInfo.remaining} requests`);
      console.log(`   Reset Time: ${rateLimitInfo.resetTime ? new Date(rateLimitInfo.resetTime).toLocaleString() : 'N/A'}\n`);

      return connectionInfo;
    } catch (error) {
      console.error('❌ Connection failed:', error.message);
      throw error;
    }
  }

  /**
   * Step 2: Extract sample data
   */
  async extractSampleData() {
    console.log('📥 Step 2: Extracting sample data...');

    try {
      // Extract conversations
      console.log('   → Extracting conversations...');
      const conversationsResult = await intercomService.getConversations({ perPage: 10 });
      console.log(`   ✅ Retrieved ${conversationsResult.conversations.length} conversations`);

      // Extract tickets
      console.log('   → Extracting tickets...');
      const ticketsResult = await intercomService.getTickets({ perPage: 10 });
      console.log(`   ✅ Retrieved ${ticketsResult.tickets.length} tickets`);

      // Extract contacts
      console.log('   → Extracting contacts...');
      const contactsResult = await intercomService.getContacts({ perPage: 10 });
      console.log(`   ✅ Retrieved ${contactsResult.contacts.length} contacts`);

      console.log('');

      return {
        conversations: conversationsResult.conversations,
        tickets: ticketsResult.tickets,
        contacts: contactsResult.contacts
      };
    } catch (error) {
      console.error('❌ Data extraction failed:', error.message);
      throw error;
    }
  }

  /**
   * Step 3: Test export functionality
   */
  async testExportFunctionality() {
    console.log('📤 Step 3: Testing export functionality...');

    try {
      // Get sample data
      const conversations = await intercomService.getAllConversations({ limit: 25 });

      if (conversations.length === 0) {
        console.log('   ⚠️  No conversations found to export');
        return;
      }

      // Test JSON export
      console.log('   → Testing JSON export...');
      const jsonFile = await exportService.exportConversations(conversations, 'json');
      console.log(`   ✅ JSON export successful: ${jsonFile.split('/').pop()}`);

      // Test CSV export
      console.log('   → Testing CSV export...');
      const csvFile = await exportService.exportConversations(conversations, 'csv');
      console.log(`   ✅ CSV export successful: ${csvFile.split('/').pop()}`);

      // List exported files
      console.log('   → Listing exported files...');
      const files = await exportService.listExportedFiles();
      console.log(`   ✅ Total exported files: ${files.length}`);

      console.log('');

      return { jsonFile, csvFile, totalFiles: files.length };
    } catch (error) {
      console.error('❌ Export functionality test failed:', error.message);
      throw error;
    }
  }

  /**
   * Step 4: Generate summary report
   */
  async generateSummaryReport() {
    console.log('📊 Step 4: Generating summary report...');

    try {
      // Gather system information
      const healthStatus = require('../../services').getHealthStatus();
      const rateLimitInfo = intercomService.getRateLimitInfo();
      const exportedFiles = await exportService.listExportedFiles();

      // Generate report
      const report = {
        phase: 'Phase 1',
        completedAt: new Date().toISOString(),
        status: 'SUCCESS',
        systemInfo: {
          environment: config.app.environment,
          nodeVersion: process.version,
          uptime: process.uptime()
        },
        services: {
          intercom: {
            connected: healthStatus.services.intercom.initialized,
            rateLimitRemaining: rateLimitInfo.remaining
          },
          export: {
            initialized: healthStatus.services.export.initialized,
            outputDir: healthStatus.services.export.outputDir,
            totalFiles: exportedFiles.length
          }
        },
        achievements: [
          '✅ Successfully connected to Intercom API',
          '✅ Retrieved sample conversations, tickets, and contacts',
          '✅ Tested JSON and CSV export functionality',
          '✅ Verified data export pipeline'
        ],
        nextSteps: [
          '🔄 Proceed to Phase 2: Advanced Filtering & Data Processing',
          '📊 Implement sophisticated filtering mechanisms',
          '🔧 Add data transformation pipelines',
          '⚡ Optimize performance for larger datasets'
        ]
      };

      // Save report
      const reportFile = await exportService.exportToJSON(report, 'phase1_completion_report');

      // Display summary
      console.log('\n📋 PHASE 1 SUMMARY REPORT');
      console.log('========================');
      console.log(`Status: ${report.status}`);
      console.log(`Completed At: ${new Date(report.completedAt).toLocaleString()}`);
      console.log(`Report Saved: ${reportFile.split('/').pop()}`);

      console.log('\n🎯 Achievements:');
      report.achievements.forEach((achievement) => console.log(`   ${achievement}`));

      console.log('\n🚀 Next Steps:');
      report.nextSteps.forEach((step) => console.log(`   ${step}`));

      console.log('\n💡 Phase 1 Goals Completed:');
      this.goals.forEach((goal) => console.log(`   ✅ ${goal}`));

      return report;
    } catch (error) {
      console.error('❌ Summary report generation failed:', error.message);
      throw error;
    }
  }

  /**
   * Runs a quick demo of Phase 1 capabilities
   */
  async runDemo() {
    console.log('\n🎬 PHASE 1 DEMO MODE');
    console.log('===================\n');

    try {
      // Quick connection test
      console.log('🔗 Testing connection...');
      await intercomService.testConnection();
      console.log('✅ Connection OK\n');

      // Quick data sample
      console.log('📥 Fetching sample data...');
      const sample = await intercomService.getConversations({ perPage: 5 });
      console.log(`✅ Found ${sample.conversations.length} conversations\n`);

      // Quick export test
      if (sample.conversations.length > 0) {
        console.log('📤 Testing export...');
        const exportFile = await exportService.exportConversations(sample.conversations, 'json');
        console.log(`✅ Export successful: ${exportFile.split('/').pop()}\n`);
      }

      console.log('🎉 Demo completed successfully!');
      console.log('Ready to proceed with full Phase 1 implementation.\n');
    } catch (error) {
      console.error('❌ Demo failed:', error.message);
      throw error;
    }
  }
}

// Run Phase 1 if this file is executed directly
if (require.main === module) {
  const main = async () => {
    try {
      // Initialize services
      await require('../../services').initializeServices();

      const phase1 = new Phase1Implementation();

      // Check if demo mode is requested
      const isDemo = process.argv.includes('--demo');

      if (isDemo) {
        await phase1.runDemo();
      } else {
        await phase1.run();
      }
    } catch (error) {
      console.error('Phase 1 execution failed:', error.message);
      process.exit(1);
    }
  };

  main();
}

module.exports = Phase1Implementation;
