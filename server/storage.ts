import { 
  users, User, InsertUser,
  botConfigs, BotConfig, InsertBotConfig,
  activityLogs, ActivityLog, InsertActivityLog,
  botStatus, BotStatus, InsertBotStatus,
  Creator
} from "@shared/schema";

// Storage interface for all CRUD operations
export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Bot config operations
  getBotConfig(): Promise<BotConfig | undefined>;
  updateBotConfig(config: InsertBotConfig): Promise<BotConfig>;
  
  // Activity logs operations
  getActivityLogs(page?: number, limit?: number, type?: string): Promise<ActivityLog[]>;
  addActivityLog(log: InsertActivityLog): Promise<ActivityLog>;
  clearActivityLogs(): Promise<void>;
  
  // Bot status operations
  getBotStatus(): Promise<BotStatus | undefined>;
  updateBotStatus(status: Partial<InsertBotStatus>): Promise<BotStatus>;
  
  // Session data
  saveSessionData(sessionData: any): Promise<void>;
  getSessionData(): Promise<any>;
  
  // Creators cache
  saveCreators(creators: Creator[]): Promise<void>;
  getCreators(): Promise<Creator[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private botConfig: BotConfig | undefined;
  private activityLogs: ActivityLog[];
  private botCurrentStatus: BotStatus | undefined;
  private sessionCache: any;
  private creatorsCache: Creator[];
  currentId: number;
  private logId: number;

  constructor() {
    this.users = new Map();
    this.activityLogs = [];
    this.creatorsCache = [];
    this.currentId = 1;
    this.logId = 1;
    
    // Initialize default bot config
    this.botConfig = {
      id: 1,
      email: "user@example.com",
      password: "password123",
      rememberCredentials: true,
      minFollowers: 1000,
      maxFollowers: 2000,
      categories: ["Sports & Outdoor", "Fashion"],
      invitationLimit: 60,
      actionDelay: 2000,
      retryAttempts: 3,
      operationMode: "human-like",
      isActive: false
    };
    
    // Initialize default bot status
    this.botCurrentStatus = {
      id: 1,
      status: "stopped",
      lastLoginTime: null,
      invitationsSent: 0,
      invitationsTarget: 60,
      successRate: 95,
      sessionData: null
    };
    
    // Add some sample logs for initial UI render
    this.addActivityLog({
      timestamp: new Date(),
      type: "Login",
      message: "Successfully logged in to TikTok Shop",
      status: "Success",
      details: null
    });
    
    this.addActivityLog({
      timestamp: new Date(),
      type: "Filter",
      message: "Applied filters: 1000-2000 followers, Sports & Outdoor, Fashion",
      status: "Success",
      details: null
    });
    
    this.addActivityLog({
      timestamp: new Date(),
      type: "Invite",
      message: "Invited creator: @mertmachine5432",
      status: "Success",
      details: null
    });
    
    this.addActivityLog({
      timestamp: new Date(),
      type: "Invite",
      message: "Invited creator: @whitefield786",
      status: "Success",
      details: null
    });
    
    this.addActivityLog({
      timestamp: new Date(),
      type: "Error",
      message: "Verification code required, solving captcha...",
      status: "Pending",
      details: null
    });
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentId++;
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }
  
  // Bot config operations
  async getBotConfig(): Promise<BotConfig | undefined> {
    return this.botConfig;
  }
  
  async updateBotConfig(config: InsertBotConfig): Promise<BotConfig> {
    this.botConfig = { 
      id: this.botConfig?.id || 1, 
      ...config 
    };
    return this.botConfig;
  }
  
  // Activity logs operations
  async getActivityLogs(page: number = 1, limit: number = 10, type?: string): Promise<ActivityLog[]> {
    let logs = [...this.activityLogs];
    
    if (type && type !== 'All') {
      logs = logs.filter(log => log.type === type);
    }
    
    // Sort by timestamp (newest first)
    logs = logs.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
    
    // Paginate
    const start = (page - 1) * limit;
    const end = start + limit;
    
    return logs.slice(start, end);
  }
  
  async addActivityLog(log: InsertActivityLog): Promise<ActivityLog> {
    const newLog = { 
      id: this.logId++,
      ...log
    };
    this.activityLogs.push(newLog);
    return newLog;
  }
  
  async clearActivityLogs(): Promise<void> {
    this.activityLogs = [];
  }
  
  // Bot status operations
  async getBotStatus(): Promise<BotStatus | undefined> {
    return this.botCurrentStatus;
  }
  
  async updateBotStatus(status: Partial<InsertBotStatus>): Promise<BotStatus> {
    this.botCurrentStatus = {
      ...this.botCurrentStatus!,
      ...status
    };
    return this.botCurrentStatus;
  }
  
  // Session data
  async saveSessionData(sessionData: any): Promise<void> {
    this.sessionCache = sessionData;
  }
  
  async getSessionData(): Promise<any> {
    return this.sessionCache;
  }
  
  // Creators cache
  async saveCreators(creators: Creator[]): Promise<void> {
    this.creatorsCache = creators;
  }
  
  async getCreators(): Promise<Creator[]> {
    return this.creatorsCache;
  }
}

export const storage = new MemStorage();
