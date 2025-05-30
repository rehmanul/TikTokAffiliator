import { expect } from 'chai';
import { TikTokBot } from '../../server/bot/tiktokBot';
import { InMemoryStorage } from '../../server/bot/tiktokBotInstance';
import { SessionData, Creator, BotConfig } from '../../server/storage';

describe('End-to-End Bot Tests', () => {
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

  describe('Manual Login Flow', () => {
    it('should complete the manual login flow', async function() {
      this.timeout(300000); // allow plenty of time

      const loginResult = await bot.startManualLogin();
      expect(loginResult).to.be.true;

      // Verify session was captured
      const session = await storage.getSessionData();
      expect(session).to.not.be.null;
      expect(session?.cookies).to.be.an('array');
      expect(session?.localStorage).to.be.an('object');
    });
  });

  describe('Creator Filtering & Invitation', () => {
    beforeEach(async () => {
      // Set up test configuration
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

      // Set up mock session
      const session: SessionData = {
        cookies: [{ name: 'test', value: 'cookie' }],
        localStorage: { key: 'value' },
        sessionStorage: { key: 'value' },
        userAgent: 'test-agent',
        viewport: { width: 1920, height: 1080 },
        timestamp: Date.now(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      await storage.saveSessionData(session);
    });

    it('should filter and invite creators based on criteria', async function() {
      this.timeout(600000); // 10 minutes for full flow

      // Start bot
      const startResult = await bot.start();
      expect(startResult).to.be.true;

      // Wait for creators to be processed
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Check invite count
      const inviteCount = await storage.getDailyInviteCount();
      expect(inviteCount).to.be.lessThanOrEqual(5); // Should respect limit

      // Verify some creators were processed
      const creators = await storage.listCreators(1, 10);
      expect(creators).to.be.an('array');
      expect(creators.some(c => c.invited)).to.be.true;
    });
  });

  describe('Rate Limiting & Performance', () => {
    it('should handle many creators without memory issues', async function() {
      this.timeout(300000); // 5 minutes

      // Create many test creators
      const mockCreators: Creator[] = Array(1000).fill(null).map((_, i) => ({
        username: `creator${i}`,
        followers: 5000 + i,
        invited: false
      }));

      await storage.saveCreators(mockCreators);

      // Start bot
      const startResult = await bot.start();
      expect(startResult).to.be.true;

      // Monitor rate limiting
      const initialStatus = await bot.getStatus();
      expect(initialStatus.isRateLimited).to.be.false;

      // Wait for some processing
      await new Promise(resolve => setTimeout(resolve, 30000));

      // Check rate limiting kicked in
      const finalStatus = await bot.getStatus();
      expect(finalStatus.queueLength).to.be.greaterThan(0);
    });
  });

  describe('Session Expiration & Recovery', () => {
    it('should handle expired sessions gracefully', async function() {
      this.timeout(300000); // 5 minutes

      // Set up expired session
      const expiredSession: SessionData = {
        cookies: [{ name: 'test', value: 'cookie' }],
        localStorage: { key: 'value' },
        sessionStorage: { key: 'value' },
        userAgent: 'test-agent',
        viewport: { width: 1920, height: 1080 },
        timestamp: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        createdAt: new Date(Date.now() - (25 * 60 * 60 * 1000)),
        expiresAt: new Date(Date.now() - (1 * 60 * 60 * 1000)) // Expired 1 hour ago
      };
      await storage.saveSessionData(expiredSession);

      // Try to start bot
      const startResult = await bot.start();
      expect(startResult).to.be.false;

      // Verify error status
      const status = await bot.getStatus();
      expect(status.status).to.equal('error');
      expect(status.lastError).to.include('session');
    });
  });

  describe('Browser Interaction', () => {
    it('should handle network issues and retries', async function() {
      this.timeout(300000); // 5 minutes

      // Start with valid session
      const session: SessionData = {
        cookies: [{ name: 'test', value: 'cookie' }],
        localStorage: { key: 'value' },
        sessionStorage: { key: 'value' },
        userAgent: 'test-agent',
        viewport: { width: 1920, height: 1080 },
        timestamp: Date.now(),
        createdAt: new Date(),
        expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
      };
      await storage.saveSessionData(session);

      // Start bot multiple times to test retry logic
      for (let i = 0; i < 3; i++) {
        const startResult = await bot.start();
        if (startResult) {
          // If successful, verify browser state
          const status = await bot.getStatus();
          expect(status.status).to.equal('running');
          break;
        }
        // Wait between retries
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    });
  });
});
