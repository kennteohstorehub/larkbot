# Intercom-Lark Automation System

A comprehensive automation system that extracts, processes, and transfers data from Intercom to Lark Suite with intelligent chatbot-driven access and management capabilities.

## 🎯 **Key Features**

### **✅ Phase 1: Data Extraction & Export**
- **Intercom API Integration**: Complete access to conversations, tickets, and contacts
- **Flexible Export Options**: JSON, CSV formats with customizable fields
- **Advanced Filtering**: Custom attributes, ticket types, date ranges
- **Rate Limit Management**: Intelligent handling of API limits
- **Health Monitoring**: Real-time service status and diagnostics

### **✅ Phase 2: Advanced Processing**
- **Sophisticated Filtering**: 9 different filter types with complex logic
- **Custom Attribute Matching**: Filter by department, priority, team, etc.
- **Ticket Type Classification**: Bug, feature, technical categorization
- **Data Transformation**: Automated processing and enrichment
- **Performance Optimization**: Efficient pagination and caching

### **🆕 Phase 3: Real-time Automation**
- **Intercom Webhook Integration**: Automatic ticket status change detection
- **Lark Bot Notifications**: Real-time updates sent to chat groups
- **Status Flow Tracking**: `submitted → in progress → resolved → closed`
- **Complete Activity Logging**: All notes, comments, and updates included
- **Multi-event Support**: Assignments, replies, notes, closures

### **🔄 Phase 4: Lark Integration** 
- **Lark Suite API**: Full bot and messaging capabilities
- **Chat Group Management**: Automated notifications to specific groups
- **Rich Message Formatting**: Structured updates with emojis and links
- **Interactive Commands**: Query tickets directly through chat
- **Document Automation**: Planned spreadsheet and document creation

### **📅 Phase 5: Chatbot Interface**
- **Conversational Data Access**: Natural language ticket queries
- **Command Processing**: `/tickets`, `/status`, `/summary` commands
- **Interactive Components**: Planned advanced chat interactions
- **Subscription Management**: Follow specific tickets or filters

## 🏗️ **Architecture Overview**

The system uses a **webhook-driven architecture** for real-time processing:

```
Intercom Tickets → Webhook Events → Your App → Lark Chat Groups
     ↓                ↓              ↓           ↓
Status Changes → Event Processing → Formatting → Notifications
```

### **Core Components**
1. **Intercom API Client**: Handles all Intercom communication
2. **Webhook Handler**: Processes real-time events from Intercom
3. **Lark Bot Service**: Manages Lark Suite integration
4. **Filtering Engine**: Advanced data processing and filtering
5. **Export System**: Flexible data export capabilities
6. **Monitoring System**: Health checks and performance tracking

## 🚀 **Quick Start**

### **Option 1: Lark Base Automation (🆕 Recommended)**
**Zero-hosting solution using Lark Base's built-in automation:**

```bash
# No server setup required!
# Everything runs within Lark Suite

# 1. Create Lark Base for ticket tracking
# 2. Set up HTTP automation to call Intercom API
# 3. Configure chat notifications
# 4. Done! Automatic notifications every 5 minutes

# See LARK_BASE_AUTOMATION_GUIDE.md for complete setup
```

**Benefits:**
- ✅ **Zero hosting costs** - runs entirely in Lark Suite
- ✅ **No maintenance** - Lark handles all infrastructure  
- ✅ **Integrated data** - tickets stored in your Base
- ✅ **Team collaboration** - everyone can see and edit

### **Option 2: Webhook Server (Advanced)**
Perfect for teams wanting real-time webhook processing:

```bash
# 1. Clone and install
git clone <repository>
cd intercom-lark-automation
npm install

# 2. Quick setup for ticket automation
npm run setup:lark

# 3. Follow the setup guide
# See TICKET_AUTOMATION_SETUP.md for detailed instructions

# 4. Start the application
npm start
```

### **Option 3: Data Export Only**
For data extraction and analysis:

```bash
# 1. Install dependencies
npm install

# 2. Quick mock setup (no tokens needed for testing)
npm run setup:mock

# 3. Start and test
npm start
curl http://localhost:3001/api/tickets
```

### **Option 4: Full Interactive Setup**
For complete customization:

```bash
# Run the interactive setup wizard
npm run setup
```

## 📂 **Project Structure**

```
Intercom/
├── src/
│   ├── routes/
│   │   ├── webhook.js         # 🆕 Intercom & Lark webhook handlers
│   │   ├── api.js             # REST API endpoints
│   │   └── export.js          # Data export functionality
│   ├── services/
│   │   ├── intercom.js        # Intercom API client
│   │   ├── lark.js            # Lark Suite integration
│   │   ├── chatbot.js         # 🆕 Bot command processing
│   │   └── export.js          # Export processing
│   ├── phases/
│   │   ├── phase1/            # Basic data extraction
│   │   └── phase2/            # Advanced filtering
│   └── utils/
│       └── logger.js          # Structured logging
├── scripts/
│   ├── setup.js               # Interactive setup wizard
│   ├── setup-lark.js          # 🆕 Lark-specific setup
│   └── mock-setup.js          # Quick mock mode setup
├── docs/
│   ├── TICKET_AUTOMATION_SETUP.md  # 🆕 Ticket automation guide
│   ├── LARK_SETUP_GUIDE.md         # Lark bot setup
│   ├── CUSTOM_FILTERING_GUIDE.md   # Advanced filtering
│   └── DEVELOPMENT_GUIDE.md        # Development instructions
├── logs/                      # Application logs
├── exports/                   # Generated export files
└── tests/                     # Test suite
```

## 🎯 Development Phases

### Phase 1: Basic Setup & Data Extraction ✅
- Intercom API connection
- Basic data extraction (conversations, tickets, contacts)
- JSON/CSV export functionality
- **Status**: Complete and ready for production

### Phase 2: Advanced Filtering & Processing ✅
- Sophisticated filtering mechanisms
- Data transformation pipelines
- Automated categorization
- **Status**: Complete with 9 filter types

### Phase 3: Real-time Automation ✅
- **🆕 Intercom webhook implementation**
- **🆕 Automatic ticket status notifications**
- **🆕 Lark chat group integration**
- **Status**: Complete and ready for production

### Phase 4: Lark Integration 🔄
- Lark Suite API integration
- Document automation
- Bidirectional synchronization
- **Status**: Bot messaging complete, documents in progress

### Phase 5: Chatbot Interface 🔄
- Conversational data access
- Command processing
- Interactive components
- **Status**: Basic commands complete, advanced features in progress

### Phase 6: Complete Pipeline 📅
- End-to-end automation
- Monitoring and analytics
- Production deployment
- **Status**: Planned

## 🛠️ Available Scripts

### Core Scripts
- `npm start` - Start the application server
- `npm run dev` - Start with auto-reload (development)
- `npm run setup` - Run interactive setup wizard
- `npm run setup:lark` - **🆕 Quick Lark bot setup**
- `npm run setup:mock` - Quick mock mode setup (no token required)
- `npm test` - Run test suite

### Phase Scripts
- `npm run phase1` - Run Phase 1 implementation
- `npm run phase2` - Run Phase 2 implementation
- `npm run phase3` - **🆕 Run Phase 3 implementation**

### Utility Scripts
- `npm run webhook` - Start webhook server
- `npm run dashboard` - Start monitoring dashboard

## 🔧 Configuration

### Environment Variables

#### Required for Ticket Automation
- `INTERCOM_TOKEN` - Your Intercom access token
- `INTERCOM_APP_ID` - Intercom app ID
- `LARK_APP_ID` - Lark Suite app ID
- `LARK_APP_SECRET` - Lark Suite app secret
- `LARK_CHAT_GROUP_ID` - **🆕 Target chat group for notifications**

#### Optional
- `WEBHOOK_SECRET` - Secret for webhook validation
- `NODE_ENV` - Environment (development/production)
- `PORT` - Server port (default: 3001)
- `LOG_LEVEL` - Logging level (default: info)

### Feature Flags
- `ENABLE_WEBHOOKS` - **🆕 Enable webhook processing (default: true)**
- `ENABLE_CHATBOT` - Enable chatbot features
- `ENABLE_MONITORING` - Enable monitoring features
- `DEBUG_MODE` - Enable debug logging

## 📊 API Endpoints

### Health Check
- `GET /health` - Basic health check
- `GET /health/detailed` - Detailed system status
- `GET /health/service/:serviceName` - Service-specific health

### Data Access
- `GET /api/conversations` - List conversations with pagination
- `GET /api/conversations/:id` - Get specific conversation
- `GET /api/tickets` - List tickets with pagination
- `GET /api/contacts` - List contacts with pagination
- `GET /api/test-connection` - Test Intercom connection
- `GET /api/rate-limit` - Check rate limit status

### **🆕 Webhook Endpoints**
- `POST /webhook/intercom` - **Intercom webhook for ticket updates**
- `POST /webhook/lark` - Lark webhook for bot messages

### Data Export
- `POST /export/conversations` - Export conversations
- `POST /export/tickets` - Export tickets
- `POST /export/contacts` - Export contacts
- `POST /export/custom` - Custom export with filters
- `GET /export/files` - List exported files
- `DELETE /export/cleanup` - Clean up old files

## 🔍 Usage Examples

### **🆕 Ticket Automation**
```bash
# Set up automatic ticket notifications
# 1. Configure webhook in Intercom Developer Hub
# 2. Add bot to Lark chat group
# 3. Set LARK_CHAT_GROUP_ID in .env
# 4. Start application - notifications are automatic!

# Test webhook manually
curl -X POST "http://localhost:3001/webhook/intercom" \
  -H "Content-Type: application/json" \
  -d '{"type": "conversation.admin.opened", "data": {"item": {"id": "test123"}}}'
```

### Basic Data Export
```bash
# Export conversations to JSON
curl -X POST http://localhost:3001/export/conversations \
  -H "Content-Type: application/json" \
  -d '{"format":"json","limit":100}'

# Export tickets to CSV
curl -X POST http://localhost:3001/export/tickets \
  -H "Content-Type: application/json" \
  -d '{"format":"csv","limit":50}'
```

### **🆕 Chatbot Commands**
```bash
# Available in Lark chat groups:
/tickets - List recent tickets
/ticket <id> - Get specific ticket details
/status <id> - Get ticket status
/summary - Get daily summary
/help - Show all commands
```

## 📚 **Documentation**

### **🆕 Setup Guides**
- **[LARK_BASE_AUTOMATION_GUIDE.md](LARK_BASE_AUTOMATION_GUIDE.md)** - **🆕 Zero-hosting solution using Lark Base automation**
- **[TICKET_AUTOMATION_SETUP.md](TICKET_AUTOMATION_SETUP.md)** - Complete guide for webhook-based notifications
- [LARK_SETUP_GUIDE.md](LARK_SETUP_GUIDE.md) - Lark Suite bot setup
- [LARK_API_SETUP_GUIDE.md](LARK_API_SETUP_GUIDE.md) - Lark API credentials

### **Feature Guides**
- [CUSTOM_FILTERING_GUIDE.md](CUSTOM_FILTERING_GUIDE.md) - Advanced filtering capabilities
- [FILTERING_IMPLEMENTATION_SUMMARY.md](FILTERING_IMPLEMENTATION_SUMMARY.md) - Filter implementation details
- [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) - Development and contribution guide

### **Implementation Summaries**
- [IMPLEMENTATION_SUMMARY.md](IMPLEMENTATION_SUMMARY.md) - Overall project status
- [PRD.md](PRD.md) - Product Requirements Document

## 🎉 **What's New in This Version**

### **🆕 Ticket Automation Features**
- **Real-time Notifications**: Automatic Lark messages when tickets change status
- **Complete Activity Tracking**: All notes, comments, and updates included
- **Status Flow Mapping**: `submitted → in progress → resolved → closed`
- **Rich Message Formatting**: Emojis, links, and structured information
- **Multi-event Support**: Handles assignments, replies, notes, closures

### **🆕 Webhook System**
- **Intercom Webhook Handler**: Processes ticket status changes
- **Lark Bot Integration**: Sends formatted messages to chat groups
- **Event Processing**: Handles 7 different Intercom event types
- **Error Handling**: Comprehensive logging and error recovery

### **🆕 Enhanced Setup**
- **Streamlined Configuration**: New setup scripts for common use cases
- **Comprehensive Documentation**: Step-by-step guides for all features
- **Testing Tools**: Built-in webhook testing and validation

## 🔮 **Coming Soon**

### **Phase 4 Enhancements**
- **Document Automation**: Auto-create Lark docs for tickets
- **Spreadsheet Integration**: Real-time metrics in Lark Sheets
- **Advanced Bot Commands**: More interactive chat features

### **Phase 5 Features**
- **Natural Language Processing**: Chat with your ticket data
- **Advanced Filtering**: Complex queries through chat
- **Interactive Components**: Buttons and forms in chat messages

### **Phase 6 Goals**
- **Complete Automation**: End-to-end ticket lifecycle management
- **Analytics Dashboard**: Web-based monitoring and insights
- **Enterprise Features**: Multi-tenant support and advanced security

## 🤝 **Contributing**

We welcome contributions! Please see [DEVELOPMENT_GUIDE.md](DEVELOPMENT_GUIDE.md) for:
- Development setup instructions
- Code style guidelines
- Testing procedures
- Contribution workflow

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 **Support**

- **Documentation**: Check the guides in the project root
- **Issues**: Report bugs or request features via GitHub issues
- **Troubleshooting**: See individual setup guides for common issues
- **Logs**: Check `logs/app.log` for detailed error information

---

**🎯 Perfect for teams wanting automated ticket notifications from Intercom to Lark chat groups with complete activity tracking and real-time updates!** 