import { TikTokBot } from './tiktokBot';
import { IStorage, SessionData, BotConfig, Creator, ActivityLog, BotStatus } from '../storage';

// Export the InMemoryStorage class so it can be used in tests
export class InMemoryStorage implements IStorage {
  private sessionData: SessionData | null = null;
  private botConfig: BotConfig = {
    email: "",
    password: "",
    minFollowers: 1000,
    maxFollowers: 100000,
    categories: [],
    invitationLimit: 5,
    actionDelay: 0,
    retryAttempts: 0,
    retryDelay: 0,
    sessionTimeout: 0
  };
  private botStatus: BotStatus = { status: 'idle' };
  private dailyInviteCount: number = 0;
  private creators: Creator[] = [];
  private activityLogs: ActivityLog[] = [];

  async getSessionData(): Promise<SessionData | null> {
    return this.sessionData;
  }

  async saveSessionData(data: SessionData | null): Promise<void> {
    this.sessionData = data;
  }

  async getBotConfig(): Promise<BotConfig> {
    return this.botConfig;
  }

  async updateBotConfig(config: Partial<BotConfig>): Promise<void> {
    this.botConfig = { ...this.botConfig, ...config };
  }

  async getBotStatus(): Promise<BotStatus> {
    return this.botStatus;
  }

  async updateBotStatus(statusUpdate: Partial<BotStatus>): Promise<void> {
    this.botStatus = { ...this.botStatus, ...statusUpdate };
  }

  async addActivityLog(log: ActivityLog): Promise<void> {
    this.activityLogs.push({
      ...log,
      timestamp: new Date()
    });
  }

  async clearLogs(): Promise<void> {
    this.activityLogs = [];
  }

  async saveCreators(creators: Creator[]): Promise<void> {
    this.creators = creators;
  }

  async getCreatorByUsername(username: string): Promise<Creator | null> {
    return this.creators.find(c => c.username === username) || null;
  }

  async updateCreator(username: string, data: Partial<Creator>): Promise<void> {
    const creator = await this.getCreatorByUsername(username);
    if (creator) {
      Object.assign(creator, data);
    }
  }

  async listCreators(page: number, limit: number): Promise<Creator[]> {
    const start = (page - 1) * limit;
    const end = start + limit;
    return this.creators.slice(start, end);
  }

  async getDailyInviteCount(): Promise<number> {
    return this.dailyInviteCount;
  }

  async incrementDailyInviteCount(): Promise<void> {
    this.dailyInviteCount += 1;
  }

  async resetDailyInviteCount(): Promise<void> {
    this.dailyInviteCount = 0;
  }

  async cleanup(): Promise<void> {
    // Reset all in-memory data
    this.sessionData = null;
    this.botConfig = {
      email: "",
      password: "",
      minFollowers: 1000,
      maxFollowers: 100000,
      categories: [],
      invitationLimit: 5,
      actionDelay: 0,
      retryAttempts: 0,
      retryDelay: 0,
      sessionTimeout: 0
    };
    this.botStatus = { status: 'idle' };
    this.dailyInviteCount = 0;
    this.creators = [];
    this.activityLogs = [];
  }
}

// Create storage instance
const storage = new InMemoryStorage();

// Export bot instance
export const tiktokBot = new TikTokBot(storage);
