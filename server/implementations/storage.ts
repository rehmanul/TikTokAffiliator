import { BotConfig, BotStatus, SessionData, Creator } from '../../shared/schema';
import { IStorage } from '../storage';

// Enhanced InsertActivityLog interface with "status" property to match usage
interface InsertActivityLog {
  type: string;
  message: string;
  timestamp: Date;
  status?: string;
  details?: any;
}

class StorageImplementation implements IStorage {
  private botConfig: BotConfig | null = null;
  private sessionData: SessionData | null = null;
  private botStatus: BotStatus = {
    status: 'initialized',
  };
  private creators: Map<string, Creator> = new Map();
  private activityLogs: InsertActivityLog[] = [];
  private dailyInviteCount = 0;

  async getBotConfig(): Promise<BotConfig> {
    if (!this.botConfig) {
      this.botConfig = {
        email: process.env.TIKTOK_EMAIL || '',
        password: process.env.TIKTOK_PASSWORD || '',
        minFollowers: 1000,
        maxFollowers: 50000,
        categories: ['Electronics'],
        invitationLimit: 5,
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

  async saveSessionData(data: SessionData): Promise<void> {
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

  async getActivityLogs(page = 1, limit = 10, type?: string): Promise<InsertActivityLog[]> {
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

  // Creator-related
  async saveCreators(creators: Creator[]): Promise<void> {
    creators.forEach(creator => {
      this.creators.set(creator.username, creator);
    });
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

  async getCreators(): Promise<Creator[]> {
    return Array.from(this.creators.values());
  }

  // daily invites
  async getDailyInviteCount(): Promise<number> {
    return this.dailyInviteCount;
  }

  async incrementDailyInviteCount(): Promise<void> {
    this.dailyInviteCount++;
  }

  async resetDailyInviteCount(): Promise<void> {
    this.dailyInviteCount = 0;
  }

  async cleanup(): Promise<void> {
    this.sessionData = null;
    this.creators.clear();
    this.activityLogs = [];
    this.dailyInviteCount = 0;
  }
}

// Export a singleton instance
export const storage = new StorageImplementation();
