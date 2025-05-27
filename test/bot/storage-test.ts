import { expect } from 'chai';
import { InMemoryStorage } from '../../server/bot/tiktokBotInstance';

describe('InMemoryStorage', () => {
  let storage: InMemoryStorage;

  beforeEach(() => {
    storage = new InMemoryStorage();
  });

  describe('Daily Invite Count', () => {
    it('should start with zero invites', async () => {
      const count = await storage.getDailyInviteCount();
      expect(count).to.equal(0);
    });

    it('should increment invite count', async () => {
      await storage.incrementDailyInviteCount();
      const count = await storage.getDailyInviteCount();
      expect(count).to.equal(1);
    });

    it('should reset invite count', async () => {
      await storage.incrementDailyInviteCount();
      await storage.incrementDailyInviteCount();
      await storage.resetDailyInviteCount();
      const count = await storage.getDailyInviteCount();
      expect(count).to.equal(0);
    });
  });

  describe('Session Management', () => {
    const mockSession = {
      cookies: [{ name: 'test', value: 'cookie' }],
      localStorage: { key: 'value' },
      sessionStorage: { key: 'value' },
      userAgent: 'test-agent',
      viewport: { width: 1920, height: 1080 },
      timestamp: Date.now(),
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000)
    };

    it('should save and retrieve session data', async () => {
      await storage.saveSessionData(mockSession);
      const retrieved = await storage.getSessionData();
      expect(retrieved).to.deep.equal(mockSession);
    });
  });

  describe('Bot Configuration', () => {
    const mockConfig = {
      email: "test@example.com",
      password: "password123",
      minFollowers: 1000,
      maxFollowers: 100000,
      categories: ["Fashion"],
      invitationLimit: 5
    };

    it('should save and retrieve bot configuration', async () => {
      await storage.updateBotConfig(mockConfig);
      const retrieved = await storage.getBotConfig();
      expect(retrieved).to.deep.equal(mockConfig);
    });
  });

  describe('Creator Management', () => {
    const mockCreators = [
      { username: 'creator1', followers: 5000 },
      { username: 'creator2', followers: 10000 }
    ];

    it('should save and list creators', async () => {
      await storage.saveCreators(mockCreators);
      const listed = await storage.listCreators(1, 10);
      expect(listed).to.deep.equal(mockCreators);
    });

    it('should find creator by username', async () => {
      await storage.saveCreators(mockCreators);
      const creator = await storage.getCreatorByUsername('creator1');
      expect(creator).to.deep.equal(mockCreators[0]);
    });

    it('should update creator', async () => {
      await storage.saveCreators(mockCreators);
      const updatedCreator = { ...mockCreators[0], followers: 6000 };
      await storage.updateCreator(updatedCreator);
      const retrieved = await storage.getCreatorByUsername('creator1');
      expect(retrieved).to.deep.equal(updatedCreator);
    });
  });

  describe('Activity Logs', () => {
    it('should add and clear logs', async () => {
      const mockLog = { type: 'test', message: 'test log' };
      await storage.addActivityLog(mockLog);
      await storage.clearLogs();
      // Since we don't have a method to retrieve logs, we can't verify directly
      // But this at least ensures the methods don't throw errors
    });
  });

  describe('Cleanup', () => {
    it('should reset all data on cleanup', async () => {
      // Set some data
      await storage.saveSessionData({ some: 'session' });
      await storage.updateBotConfig({ some: 'config' });
      await storage.saveCreators([{ username: 'test' }]);
      await storage.incrementDailyInviteCount();

      // Cleanup
      await storage.cleanup();

      // Verify everything is reset
      expect(await storage.getSessionData()).to.be.null;
      expect(await storage.getDailyInviteCount()).to.equal(0);
      expect(await storage.listCreators(1, 10)).to.deep.equal([]);
    });
  });
});
