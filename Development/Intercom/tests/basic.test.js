const request = require('supertest');
const Application = require('../src/index');

describe('Basic Application Tests', () => {
  let app;
  let server;

  beforeAll(async () => {
    // Create application instance
    app = new Application();
    
    // Mock configuration to avoid requiring real tokens
    jest.mock('../src/config', () => ({
      ...jest.requireActual('../src/config'),
      intercom: {
        token: 'test-token',
        appId: 'test-app-id',
        apiVersion: '2.11',
        baseUrl: 'https://api.intercom.io',
        rateLimit: {
          maxRequests: 10000,
          windowMs: 60000
        }
      },
      validateConfig: () => true
    }));
    
    // Mock services to avoid real API calls
    jest.mock('../src/services', () => ({
      initializeServices: jest.fn().mockResolvedValue(undefined),
      getHealthStatus: jest.fn().mockReturnValue({
        initialized: true,
        services: {
          intercom: { initialized: true },
          export: { initialized: true }
        }
      })
    }));
    
    // Initialize without starting server
    await app.initialize();
  });

  afterAll(async () => {
    if (server) {
      server.close();
    }
  });

  describe('Health Endpoints', () => {
    test('GET /health should return 200', async () => {
      const response = await request(app.app)
        .get('/health')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('timestamp');
      expect(response.body).toHaveProperty('uptime');
    });

    test('GET /health/detailed should return detailed info', async () => {
      const response = await request(app.app)
        .get('/health/detailed')
        .expect(200);

      expect(response.body).toHaveProperty('status', 'ok');
      expect(response.body).toHaveProperty('application');
      expect(response.body).toHaveProperty('system');
      expect(response.body).toHaveProperty('services');
    });
  });

  describe('Root Endpoint', () => {
    test('GET / should return API info', async () => {
      const response = await request(app.app)
        .get('/')
        .expect(200);

      expect(response.body).toHaveProperty('message');
      expect(response.body).toHaveProperty('version');
      expect(response.body).toHaveProperty('endpoints');
    });
  });

  describe('404 Handling', () => {
    test('GET /nonexistent should return 404', async () => {
      const response = await request(app.app)
        .get('/nonexistent')
        .expect(404);

      expect(response.body).toHaveProperty('error', 'Not Found');
    });
  });
});

describe('Configuration Tests', () => {
  test('should have required configuration structure', () => {
    const config = require('../src/config');
    
    expect(config).toHaveProperty('app');
    expect(config).toHaveProperty('intercom');
    expect(config).toHaveProperty('export');
    expect(config).toHaveProperty('features');
    
    expect(typeof config.isDevelopment).toBe('function');
    expect(typeof config.isProduction).toBe('function');
    expect(typeof config.getCurrentPhase).toBe('function');
  });
});

describe('Service Structure Tests', () => {
  test('should have required service exports', () => {
    // Test that service files exist and have correct structure
    const intercomService = require('../src/services/intercom');
    const exportService = require('../src/services/export');
    
    expect(intercomService).toHaveProperty('initialize');
    expect(intercomService).toHaveProperty('getHealthStatus');
    
    expect(exportService).toHaveProperty('initialize');
    expect(exportService).toHaveProperty('getHealthStatus');
  });
});

describe('Phase 1 Implementation', () => {
  test('should have Phase 1 implementation', () => {
    const Phase1 = require('../src/phases/phase1');
    
    expect(Phase1).toBeDefined();
    expect(typeof Phase1).toBe('function');
    
    const phase1Instance = new Phase1();
    expect(phase1Instance).toHaveProperty('name');
    expect(phase1Instance).toHaveProperty('goals');
    expect(phase1Instance).toHaveProperty('run');
    expect(phase1Instance).toHaveProperty('runDemo');
  });
});

describe('Utility Functions', () => {
  test('should have logger utility', () => {
    const logger = require('../src/utils/logger');
    
    expect(logger).toHaveProperty('info');
    expect(logger).toHaveProperty('error');
    expect(logger).toHaveProperty('warn');
    expect(logger).toHaveProperty('debug');
    expect(logger).toHaveProperty('logApiRequest');
    expect(logger).toHaveProperty('logApiResponse');
    expect(logger).toHaveProperty('logPerformance');
  });
}); 