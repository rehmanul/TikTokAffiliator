import { BotConfig, BotStatus, SessionData, Creator, InsertActivityLog } from '../../shared/schema';
import { IStorage } from '../storage/index';

export class StorageImplementation implements IStorage {
  private botConfig: BotConfig | null = null;
  private sessionData: SessionData | null = null;
  private botStatus: BotStatus = {
    status: 'initialized',
    lastLoginTime: new Date(),
    invitationsSent: 0,
    successRate: 0
  };
  private creators: Map<string, Creator> = new Map();
  private activityLogs: InsertActivityLog[] = [];
  private dailyInviteCount: number = 0;

  async getBotConfig(): Promise<BotConfig> {
    if (!this.botConfig) {
      this.botConfig = {
        email: process.env.TIKTOK_EMAIL || '',
        password: process.env.TIKTOK_PASSWORD || '',
        minFollowers: 1000,
        maxFollowers: 50000,
        categories: ['Electronics'],
        invitationLimit: 5,
        actionDelay: 3000,
        retryAttempts: 3,
        retryDelay: 5000,
        sessionTimeout: 3600000,
        logLevel: 'info',
        screenshotOnError: true,
        maxDailyInvites: 100
      };
    }
    return this.botConfig;
  }

  async updateBotConfig(config: Partial<BotConfig>): Promise<void> {
    this.botConfig = { ...await this.getBotConfig(), ...config };
  }

  async getSessionData(): Promise<SessionData | null> {
    return this.sessionData;
  }

  async saveSessionData(data: SessionData | null): Promise<void> {
    this.sessionData = data;
  }

  async getBotStatus(): Promise<BotStatus> {
    return this.botStatus;
  }

  async updateBotStatus(status: Partial<BotStatus>): Promise<void> {
    this.botStatus = { ...this.botStatus, ...status };
  }

  async addActivityLog(log: InsertActivityLog): Promise<void> {
    this.activityLogs.push(log);
  }

  async saveCreators(creators: Creator[]): Promise<void> {
    creators.forEach(creator => {
      this.creators.set(creator.username, creator);
    });
  }

  async getCreators(): Promise<Creator[]> {
    return Array.from(this.creators.values());
  }

  async getCreatorByUsername(username: string): Promise<Creator | null> {
    return this.creators.get(username) || null;
  }

  async updateCreator(username: string, data: Partial<Creator>): Promise<void> {
    const creator = await this.getCreatorByUsername(username);
    if (creator) {
      this.creators.set(username, { ...creator, ...data });
    }
  }

  async getDailyInviteCount(): Promise<number> {
    return this.dailyInviteCount;
  }

  async incrementDailyInviteCount(): Promise<void> {
    this.dailyInviteCount++;
  }

  async resetDailyInviteCount(): Promise<void> {
    this.dailyInviteCount = 0;
  }

  async getActivityLogs(page: number = 1, limit: number = 10, type?: string): Promise<InsertActivityLog[]> {
    let logs = [...this.activityLogs];
    if (type) {
      logs = logs.filter(log => log.type === type);
    }
    const start = (page - 1) * limit;
    return logs.slice(start, start + limit);
  }

  async clearActivityLogs(): Promise<void> {
    this.activityLogs = [];
  }

  async cleanup(): Promise<void> {
    this.sessionData = null;
    this.creators.clear();
    this.activityLogs = [];
    this.dailyInviteCount = 0;
    this.botConfig = null;
    this.botStatus = {
      status: 'initialized',
      lastLoginTime: new Date(),
      invitationsSent: 0,
      successRate: 0
    };
  }
}

// Export a singleton instance
export const storage = new StorageImplementation();
