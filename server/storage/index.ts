// Define and export all storage interfaces with proper types

export interface SessionData {
  cookies: any[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  userAgent: string;
  viewport: { width: number; height: number };
  timestamp: number;
  createdAt: Date;
  expiresAt: Date;
}

export interface BotConfig {
  email: string;
  password: string;
  minFollowers: number;
  maxFollowers: number;
  categories: string[];
  invitationLimit: number;
}

export interface Creator {
  username: string;
  followers: number;
  invited?: boolean;
  invitedAt?: Date;
}

export interface ActivityLog {
  type: string;
  message: string;
  timestamp: Date;
  status?: string;
  metadata?: Record<string, any>;
}

export interface BotStatus {
  status: 'idle' | 'running' | 'error' | 'initialized' | 'stopped';
  lastError?: string;
  lastActivity?: ActivityLog;
}

export interface IStorage {
  // Session management
  getSessionData(): Promise<SessionData | null>;
  saveSessionData(data: SessionData | null): Promise<void>;
  
  // Bot configuration
  getBotConfig(): Promise<BotConfig>;
  updateBotConfig(config: BotConfig): Promise<void>;
  
  // Bot status
  getBotStatus(): Promise<BotStatus>;
  updateBotStatus(statusUpdate: Partial<BotStatus>): Promise<void>;
  
  // Activity logging
  addActivityLog(log: ActivityLog): Promise<void>;
  getActivityLogs(page: number, limit: number, type?: string): Promise<ActivityLog[]>;
  clearActivityLogs(): Promise<void>;
  
  // Creator management
  saveCreators(creators: Creator[]): Promise<void>;
  getCreators(): Promise<Creator[]>;
  getCreatorByUsername(username: string): Promise<Creator | null>;
  updateCreator(username: string, data: Partial<Creator>): Promise<void>;
  listCreators(page: number, limit: number): Promise<Creator[]>;
  
  // Daily invite tracking
  getDailyInviteCount(): Promise<number>;
  incrementDailyInviteCount(): Promise<void>;
  resetDailyInviteCount(): Promise<void>;
  
  // Cleanup
  cleanup(): Promise<void>;
}

// Re-export everything
