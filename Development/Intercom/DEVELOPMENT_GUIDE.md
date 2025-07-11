# Development Guide - Mock Mode

## 🎭 Working Without Intercom Token

Perfect! You can continue developing while waiting for Intercom developer access. The system automatically switches to **Mock Mode** when no real token is available.

## 🚀 Quick Start with Mock Data

### 1. Setup Mock Mode
```bash
# Quick setup with mock configuration
npm run setup:mock

# Install dependencies
npm install
```

### 2. Test Everything Works
```bash
# Run Phase 1 with mock data
npm run phase1

# Or start the API server
npm start
```

### 3. What You'll See
The system will generate realistic mock data:
- **150 mock conversations** with realistic fields
- **80 mock tickets** with different states and priorities  
- **200 mock contacts** with customer information
- **Full export functionality** (JSON/CSV)
- **Complete API endpoints** working with mock data

## 📊 Mock Data Features

### Realistic Data Structure
The mock service generates data that matches Intercom's API structure:
- Conversations with assignees, contacts, tags, and messages
- Tickets with states, priorities, and categories
- Contacts with locations, custom attributes, and tags
- Proper pagination and rate limiting simulation

### All Features Work
- ✅ **Data extraction** - Get conversations, tickets, contacts
- ✅ **Export functionality** - JSON and CSV exports work perfectly
- ✅ **API endpoints** - All REST endpoints respond with mock data
- ✅ **Health monitoring** - System health checks work
- ✅ **Logging** - Full logging and debugging
- ✅ **Phase 1 implementation** - Complete workflow testing

## 🛠️ Development Commands

### Core Development
```bash
# Start development server with auto-reload
npm run dev

# Run Phase 1 with mock data
npm run phase1

# Run quick demo
npm run phase1 -- --demo

# Start API server
npm start
```

### Testing & Debugging
```bash
# Run tests
npm test

# Enable debug mode
DEBUG_MODE=true npm run dev

# Check health
curl http://localhost:3001/health
```

### Export Testing
```bash
# Export mock conversations
curl -X POST http://localhost:3001/export/conversations \
  -H "Content-Type: application/json" \
  -d '{"format":"json","limit":50}'

# Export mock tickets to CSV
curl -X POST http://localhost:3001/export/tickets \
  -H "Content-Type: application/json" \
  -d '{"format":"csv","limit":30}'

# List exported files
curl http://localhost:3001/export/files
```

## 🎯 What You Can Build Right Now

### 1. Phase 2: Advanced Filtering
```bash
# Create Phase 2 implementation
mkdir -p src/phases/phase2
# Build filtering and processing logic
```

### 2. Lark Suite Integration (Phase 4)
```bash
# Start Lark integration work
mkdir -p src/services/lark
# Build Lark API client
```

### 3. Enhanced Export Features
```bash
# Add more export formats
# Build custom filtering
# Add data transformation
```

### 4. Web Dashboard
```bash
# Create monitoring dashboard
mkdir -p src/dashboard
# Build real-time data visualization
```

### 5. Testing & Quality
```bash
# Expand test coverage
# Add integration tests
# Build performance benchmarks
```

## 🔄 Switching to Real Data

When you get your Intercom token:

### 1. Update Configuration
```bash
# Edit .env file
INTERCOM_TOKEN=your_real_token_here
```

### 2. Restart Application
```bash
# The system automatically detects real token
npm start
```

### 3. Verify Connection
```bash
# Test real connection
curl http://localhost:3001/api/test-connection
```

The system will automatically switch from mock mode to real Intercom API calls!

## 🎨 Mock Data Customization

### Modify Mock Data
Edit `src/services/intercom-mock.js` to:
- Change data volume (conversations, tickets, contacts)
- Modify field values and structures
- Add new mock scenarios
- Simulate different error conditions

### Example Customizations
```javascript
// Increase mock conversation count
totalCount: 500, // Instead of 150

// Add custom fields
customField: 'mock_value',

// Simulate rate limiting
if (Math.random() < 0.1) {
  throw new Error('Rate limit exceeded');
}
```

## 📈 Development Priorities

### High Priority (Can Do Now)
1. **✅ Phase 2 Development** - Advanced filtering and processing
2. **✅ Lark Suite Integration** - Start building Lark API client
3. **✅ Enhanced Export** - Add more formats and filtering
4. **✅ Web Dashboard** - Build monitoring interface
5. **✅ Testing** - Expand test coverage

### Medium Priority
1. **Webhook System** - Build webhook handling (Phase 3)
2. **Queue System** - Add background job processing
3. **Monitoring** - Enhanced system monitoring
4. **Documentation** - API documentation generation

### Future (After Real Token)
1. **Real Data Testing** - Test with actual Intercom data
2. **Performance Optimization** - Optimize for real API limits
3. **Production Deployment** - Deploy to production environment

## 🎪 Mock Mode Benefits

### Advantages
- **No API limits** - Unlimited testing without rate limits
- **Consistent data** - Same mock data for reliable testing
- **Fast development** - No network delays
- **Complete control** - Modify mock data as needed
- **Offline development** - Work without internet

### Perfect For
- **Algorithm development** - Build filtering and processing logic
- **UI development** - Create dashboards and interfaces
- **Integration testing** - Test with other services
- **Performance testing** - Benchmark system performance
- **Feature development** - Build new capabilities

## 🚀 Next Steps

1. **Run the mock setup**: `npm run setup:mock`
2. **Install dependencies**: `npm install`
3. **Test Phase 1**: `npm run phase1`
4. **Start building Phase 2** or **Lark integration**
5. **Switch to real data** when token is available

The mock mode gives you a complete development environment to build and test everything while waiting for Intercom access!

---

**🎭 Happy coding with mock data! You can build the entire system without waiting for the real token.** 