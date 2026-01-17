/**
 * deploymentUtils.test.js
 * Test suite for production deployment utilities
 * Tests environment validation, health checks, and setup procedures
 */

const fs = require('fs');
const path = require('path');
const {
  validateProductionEnvironment,
  setupDirectories,
  performHealthChecks,
  setupProductionMiddleware,
  setupMonitoring,
  setupCostTracking,
  logDeploymentInfo,
} = require('./deploymentUtils');

jest.mock('../config/logger');

describe('deploymentUtils', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  describe('validateProductionEnvironment', () => {
    test('should pass validation with all required variables', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';
      process.env.HOST = '0.0.0.0';
      process.env.GITHUB_TOKEN = 'ghp_validtoken123456789012345678901234';

      const result = validateProductionEnvironment();
      
      expect(result.valid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    test('should fail validation when required variables are missing', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';
      // Missing HOST and GITHUB_TOKEN

      const result = validateProductionEnvironment();
      
      expect(result.valid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    test('should validate NODE_ENV values', () => {
      process.env.NODE_ENV = 'invalid';
      process.env.PORT = '3000';
      process.env.HOST = '0.0.0.0';
      process.env.GITHUB_TOKEN = 'ghp_validtoken123456789012345678901234';

      const result = validateProductionEnvironment();
      
      expect(result.valid).toBe(false);
      expect(result.errors[0]).toContain('NODE_ENV');
    });

    test('should validate PORT is a number', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = 'notanumber';
      process.env.HOST = '0.0.0.0';
      process.env.GITHUB_TOKEN = 'ghp_validtoken123456789012345678901234';

      const result = validateProductionEnvironment();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('PORT'))).toBe(true);
    });

    test('should accept multiple GitHub token prefixes', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';
      process.env.HOST = '0.0.0.0';

      const tokenPrefixes = ['ghp_', 'github_pat_', 'gho_', 'ghu_', 'ghs_', 'ghr_'];

      tokenPrefixes.forEach(prefix => {
        process.env.GITHUB_TOKEN = `${prefix}validtoken123456789012345678901234`;
        const result = validateProductionEnvironment();
        expect(result.valid).toBe(true);
      });
    });

    test('should reject invalid GitHub token prefix', () => {
      process.env.NODE_ENV = 'production';
      process.env.PORT = '3000';
      process.env.HOST = '0.0.0.0';
      process.env.GITHUB_TOKEN = 'invalid_token_prefix_123';

      const result = validateProductionEnvironment();
      
      expect(result.valid).toBe(false);
      expect(result.errors.some(e => e.includes('GITHUB_TOKEN'))).toBe(true);
    });
  });

  describe('setupDirectories', () => {
    test('should return true when directories can be created', () => {
      const mkdirSyncSpy = jest.spyOn(fs, 'mkdirSync').mockImplementation();
      const existsSyncSpy = jest.spyOn(fs, 'existsSync').mockReturnValue(false);

      const result = setupDirectories();

      expect(result).toBe(true);
      expect(mkdirSyncSpy).toHaveBeenCalled();
      expect(mkdirSyncSpy).toHaveBeenCalledWith(
        expect.stringContaining('logs'),
        { recursive: true }
      );

      mkdirSyncSpy.mockRestore();
      existsSyncSpy.mockRestore();
    });

    test('should return false when directory creation fails', () => {
      jest.spyOn(fs, 'existsSync').mockReturnValue(false);
      jest.spyOn(fs, 'mkdirSync').mockImplementation(() => {
        throw new Error('Permission denied');
      });

      const result = setupDirectories();

      expect(result).toBe(false);
    });
  });

  describe('performHealthChecks', () => {
    test('should return health check results', async () => {
      jest.spyOn(fs, 'accessSync').mockImplementation();

      const result = await performHealthChecks();

      expect(result).toHaveProperty('healthy');
      expect(result).toHaveProperty('checks');
      expect(result.checks).toHaveProperty('file_system');
      expect(result.checks).toHaveProperty('logs');
      expect(result.checks).toHaveProperty('cache');
    });

    test('should detect file system access issues', async () => {
      jest.spyOn(fs, 'accessSync').mockImplementation(() => {
        throw new Error('Access denied');
      });

      const result = await performHealthChecks();

      expect(result.checks.file_system).toBe(false);
      expect(result.checks.logs).toBe(false);
    });
  });

  describe('setupProductionMiddleware', () => {
    test('should add middleware to Express app', () => {
      const app = {
        use: jest.fn(),
      };

      setupProductionMiddleware(app);

      expect(app.use).toHaveBeenCalled();
      expect(app.use.mock.calls.length).toBeGreaterThan(0);
    });

    test('should add security headers middleware', () => {
      const app = {
        use: jest.fn(),
      };

      setupProductionMiddleware(app);

      // Get the middleware function that was added
      const middlewareFn = app.use.mock.calls[0][0];
      
      const req = {};
      const res = {
        setHeader: jest.fn(),
      };
      const next = jest.fn();

      middlewareFn(req, res, next);

      expect(res.setHeader).toHaveBeenCalledWith('X-Content-Type-Options', 'nosniff');
      expect(res.setHeader).toHaveBeenCalledWith('X-Frame-Options', 'DENY');
      expect(res.setHeader).toHaveBeenCalledWith('X-XSS-Protection', '1; mode=block');
      expect(next).toHaveBeenCalled();
    });
  });

  describe('setupMonitoring', () => {
    test('should initialize monitoring without errors', () => {
      expect(() => {
        setupMonitoring();
      }).not.toThrow();
    });
  });

  describe('setupCostTracking', () => {
    test('should return cost tracking configuration', () => {
      process.env.COST_DAILY_LIMIT = '100';
      process.env.COST_MONTHLY_LIMIT = '1000';
      process.env.COST_WARNING_THRESHOLD = '75';
      process.env.COST_ALERT_THRESHOLD = '90';

      const result = setupCostTracking();

      expect(result.dailyLimit).toBe(100);
      expect(result.monthlyLimit).toBe(1000);
      expect(result.warningThreshold).toBe(75);
      expect(result.alertThreshold).toBe(90);
    });

    test('should use default values when environment variables not set', () => {
      delete process.env.COST_DAILY_LIMIT;
      delete process.env.COST_MONTHLY_LIMIT;
      delete process.env.COST_WARNING_THRESHOLD;
      delete process.env.COST_ALERT_THRESHOLD;

      const result = setupCostTracking();

      expect(result.dailyLimit).toBe(100);
      expect(result.monthlyLimit).toBe(1000);
      expect(result.warningThreshold).toBe(75);
      expect(result.alertThreshold).toBe(90);
    });
  });

  describe('logDeploymentInfo', () => {
    test('should log deployment information without errors', () => {
      expect(() => {
        logDeploymentInfo();
      }).not.toThrow();
    });
  });
});
