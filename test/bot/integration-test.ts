import { expect } from 'chai';
import { TikTokBot } from '../../server/bot/tiktokBot';
import { InMemoryStorage } from '../../server/bot/tiktokBotInstance';
import { SessionData, Creator, BotConfig } from '../../server/storage';

describe('Bot Integration Tests', () => {
  let storage: InMemoryStorage;
  let bot: TikTokBot;

  beforeEach(() => {
    storage = new InMemoryStorage();
    bot = new TikTokBot(storage);
  });

  afterEach(async () => {
    await bot.stop();
    await storage.cleanup();
  });

  describe('Session Management', () => {
    const mockSession: SessionData = {
      cookies: [{ name: 'test', value: 'cookie' }],
      localStorage: { key: 'value' },
      sessionStorage: { key: 'value' },
      userAgent: 'test-agent',
      viewport: { width: 1920, height: 1080 },
      timestamp: Date.now(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    it('should persist session across bot restarts', async () => {
      await storage.saveSessionData(mockSession);
      
      // First start
      const startResult1 = await bot.start();
      expect(startResult1).to.be.true;
      await bot.stop();

      // Second start with same session
      const startResult2 = await bot.start();
      expect(startResult2).to.be.true;
    });

    it('should handle expired sessions', async () => {
      const expiredSession = {
        ...mockSession,
        expiresAt: new Date(Date.now() - 1000) // Expired
      };
      await storage.saveSessionData(expiredSession);
      
      const startResult = await bot.start();
      expect(startResult).to.be.false;
      
      const status = await bot.getStatus();
      expect(status.status).to.equal('error');
      expect(status.lastError).to.include('expired');
    });
  });

  describe('Daily Invite Limits', () => {
    beforeEach(async () => {
      // Set up bot config
      const config: BotConfig = {
        email: "test@example.com",
        password: "test123",
        minFollowers: 1000,
        maxFollowers: 100000,
        categories: ["Fashion"],
        invitationLimit: 5,
        actionDelay: 0,
        retryAttempts: 0,
        retryDelay: 0,
        sessionTimeout: 0
      };
      await storage.updateBotConfig(config);
    });

    it('should enforce daily invite limits', async () => {
      const mockCreators: Creator[] = Array(10).fill(null).map((_, i) => ({
        username: `creator${i}`,
        followers: 5000,
        invited: false
      }));

      await storage.saveCreators(mockCreators);
      await storage.resetDailyInviteCount();

      // Simulate inviting creators
      for (let i = 0; i < 5; i++) {
        await storage.incrementDailyInviteCount();
      }

      // Try to invite one more
      const count = await storage.getDailyInviteCount();
      expect(count).to.equal(5);

      // Verify bot won't continue inviting
      const config = await storage.getBotConfig();
      expect(count >= config.invitationLimit).to.be.true;
    });

    it('should reset daily invite count', async () => {
      // Simulate some invites
      await storage.incrementDailyInviteCount();
      await storage.incrementDailyInviteCount();
      
      // Reset
      await storage.resetDailyInviteCount();
      const count = await storage.getDailyInviteCount();
      expect(count).to.equal(0);
    });
  });

  describe('Error Recovery', () => {
    it('should handle network errors gracefully', async () => {
      // Simulate a network error by providing invalid session
      await storage.saveSessionData(null);
      
      const startResult = await bot.start();
      expect(startResult).to.be.false;
      
      const status = await bot.getStatus();
      expect(status.status).to.equal('error');
    });

    it('should recover from temporary failures', async () => {
      // First attempt fails
      const failedStart = await bot.start();
      expect(failedStart).to.be.false;

      // Set up valid session
      await storage.saveSessionData({
        cookies: [{ name: 'test', value: 'valid' }],
        localStorage: {},
        sessionStorage: {},
        userAgent: 'test',
        viewport: { width: 1920, height: 1080 },
        timestamp: Date.now(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 3600000)
      });

      // Second attempt succeeds
      const successfulStart = await bot.start();
      expect(successfulStart).to.be.true;
    });
  });

  describe('Rate Limiting', () => {
    it('should respect rate limits', async () => {
      const status = await bot.getStatus();
      expect(status.isRateLimited).to.be.a('boolean');
      expect(status.queueLength).to.be.a('number');
    });
  });
});
