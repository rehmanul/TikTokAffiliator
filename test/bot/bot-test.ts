import { describe, it, beforeEach, afterEach } from 'mocha';
import { expect } from 'chai';
import { TikTokBot } from '../../server/bot/bot';
import { IStorage } from '../../server/storage';
import { BotConfig, BotStatus } from '../../shared/schema';

// Mock storage implementation for testing
class MockStorage implements IStorage {
  private botConfig: BotConfig | null = null;
  private botStatus: BotStatus = { 
    status: 'stopped',
    invitationsSent: 0,
    successRate: 0,
    lastLoginTime: new Date(),
    currentOperation: undefined,
    lastError: undefined,
    uptime: 0,
    memoryUsage: 0,
    cpuUsage: 0
  };
  private sessionData: any = null;
  private creators: any[] = [];
  private activityLogs: any[] = [];

  async getBotConfig(): Promise<BotConfig> {
    if (!this.botConfig) {
      throw new Error('Bot configuration not found');
    }
    return this.botConfig;
  }

  async setBotConfig(config: BotConfig): Promise<void> {
    this.botConfig = config;
  }

  async updateBotConfig(config: Partial<BotConfig>): Promise<void> {
    if (this.botConfig) {
      this.botConfig = { ...this.botConfig, ...config };
    }
  }

  async getBotStatus(): Promise<BotStatus> {
    return this.botStatus;
  }

  async updateBotStatus(status: Partial<BotStatus>): Promise<void> {
    this.botStatus = { ...this.botStatus, ...status };
  }

  async getSessionData(): Promise<any> {
    return this.sessionData;
  }

  async saveSessionData(data: any): Promise<void> {
    this.sessionData = data;
  }

  async addActivityLog(log: any): Promise<void> {
    this.activityLogs.push(log);
  }

  async saveCreators(creators: any[]): Promise<void> {
    this.creators = creators;
  }

  async getCreatorByUsername(username: string): Promise<any> {
    return this.creators.find(c => c.username === username);
  }

  async getCreators(): Promise<any[]> {
    return this.creators;
  }

  async updateCreator(username: string, data: any): Promise<void> {
    const index = this.creators.findIndex(c => c.username === username);
    if (index !== -1) {
      this.creators[index] = { ...this.creators[index], ...data };
    }
  }

  async getDailyInviteCount(): Promise<number> {
    return 0;
  }

  async incrementDailyInviteCount(): Promise<void> {
    /* noop */
  }

  async resetDailyInviteCount(): Promise<void> {
    /* noop */
  }

  async cleanup(): Promise<void> {
    this.botConfig = null;
    this.botStatus = {
      status: 'stopped',
      invitationsSent: 0,
      successRate: 0,
      lastLoginTime: new Date(),
      currentOperation: undefined,
      lastError: undefined,
      uptime: 0,
      memoryUsage: 0,
      cpuUsage: 0
    };
    this.sessionData = null;
    this.creators = [];
    this.activityLogs = [];
  }
}

describe('TikTokBot', () => {
  let bot: TikTokBot;
  let storage: MockStorage;

  beforeEach(() => {
    storage = new MockStorage();
    bot = new TikTokBot(storage);
  });

  afterEach(async () => {
    await bot.stop();
    await storage.cleanup();
  });

  describe('Initialization', () => {
    it('should fail initialization without config', async () => {
      const success = await bot.init();
      expect(success).to.be.false;
      
      const status = await bot.getStatus();
      expect(status.status).to.equal('error');
      expect(status.lastError).to.include('Bot configuration not found');
    });

    it('should initialize successfully with valid config', async () => {
      const config: BotConfig = {
        email: 'test@example.com',
        password: 'password123',
        minFollowers: 1000,
        maxFollowers: 100000,
        categories: ['fashion'],
        invitationLimit: 10,
        actionDelay: 1000,
        retryAttempts: 3,
        retryDelay: 1000,
        sessionTimeout: 24 * 60 * 60 * 1000,
        maxConcurrentRequests: 1,
        requestTimeout: 30000,
        maxRequestsPerMinute: 20
      };

      await storage.setBotConfig(config);
      const success = await bot.init();
      expect(success).to.be.true;
      
      const status = await bot.getStatus();
      expect(status.status).to.equal('initialized');
    });
  });

  describe('Session Management', () => {
    beforeEach(async () => {
      const config: BotConfig = {
        email: 'test@example.com',
        password: 'password123',
        minFollowers: 1000,
        maxFollowers: 100000,
        categories: ['fashion'],
        invitationLimit: 10,
        actionDelay: 1000,
        retryAttempts: 3,
        retryDelay: 1000,
        sessionTimeout: 24 * 60 * 60 * 1000,
        maxConcurrentRequests: 1,
        requestTimeout: 30000,
        maxRequestsPerMinute: 20
      };
      await storage.setBotConfig(config);
    });

    it('should create new session on first start', async () => {
      await bot.init();
      await bot.start();
      
      const sessionData = await storage.getSessionData();
      expect(sessionData).to.not.be.null;
      expect(sessionData.timestamp).to.be.a('number');
      expect(sessionData.cookies).to.be.an('array');
    });

    it('should restore valid session on initialization', async () => {
      await bot.init();
      await bot.start();
      const originalSession = await storage.getSessionData();

      await bot.stop();
      bot = new TikTokBot(storage);
      await bot.init();

      const status = await bot.getStatus();
      expect(status.status).to.equal('initialized');
      
      const currentSession = await storage.getSessionData();
      expect(currentSession.timestamp).to.equal(originalSession.timestamp);
    });
  });

  describe('Rate Limiting', () => {
    beforeEach(async () => {
      const config: BotConfig = {
        email: 'test@example.com',
        password: 'password123',
        minFollowers: 1000,
        maxFollowers: 100000,
        categories: ['fashion'],
        invitationLimit: 10,
        actionDelay: 1000,
        retryAttempts: 3,
        retryDelay: 1000,
        sessionTimeout: 24 * 60 * 60 * 1000,
        maxConcurrentRequests: 1,
        requestTimeout: 30000,
        maxRequestsPerMinute: 20
      };
      await storage.setBotConfig(config);
      await bot.init();
    });

    it('should respect rate limits during operation', async () => {
      const status = await bot.getStatus();
      expect(status.isRateLimited).to.be.false;
      expect(status.queueLength).to.equal(0);
    });
  });

  describe('Error Handling', () => {
    beforeEach(async () => {
      const config: BotConfig = {
        email: 'test@example.com',
        password: 'password123',
        minFollowers: 1000,
        maxFollowers: 100000,
        categories: ['fashion'],
        invitationLimit: 10,
        actionDelay: 1000,
        retryAttempts: 3,
        retryDelay: 1000,
        sessionTimeout: 24 * 60 * 60 * 1000,
        maxConcurrentRequests: 1,
        requestTimeout: 30000,
        maxRequestsPerMinute: 20
      };
      await storage.setBotConfig(config);
    });

    it('should handle initialization errors gracefully', async () => {
      // Simulate a browser launch failure
      const originalLaunch = (bot as any).browser?.launch;
      (bot as any).browser = {
        launch: async () => { throw new Error('Browser launch failed'); }
      };

      const success = await bot.init();
      expect(success).to.be.false;

      const status = await bot.getStatus();
      expect(status.status).to.equal('error');
      expect(status.lastError).to.include('Browser launch failed');

      // Restore original launch function
      if (originalLaunch) {
        (bot as any).browser.launch = originalLaunch;
      }
    });

    it('should handle login failures with retry', async () => {
      await bot.init();
      
      // Simulate a login failure
      const originalLogin = (bot as any).login;
      let loginAttempts = 0;
      (bot as any).login = async () => {
        loginAttempts++;
        if (loginAttempts < 3) {
          throw new Error('Login failed');
        }
      };

      await bot.start();
      expect(loginAttempts).to.be.greaterThan(1);

      // Restore original login function
      if (originalLogin) {
        (bot as any).login = originalLogin;
      }
    });
  });
});
