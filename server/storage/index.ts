// Re-export the shared interfaces so consumers only import from this module
export type {
  SessionData,
  BotConfig,
  Creator,
  ActivityLog,
  InsertActivityLog,
  BotStatus,
} from '../../shared/schema';

import type {
  SessionData,
  BotConfig,
  Creator,
  ActivityLog,
  InsertActivityLog,
  BotStatus,
} from '../../shared/schema';

export interface IStorage {
  // Session management
  getSessionData(): Promise<SessionData | null>;
  saveSessionData(data: SessionData | null): Promise<void>;

  // Bot configuration
  getBotConfig(): Promise<BotConfig>;
  updateBotConfig(config: Partial<BotConfig>): Promise<void>;
  
  // Bot status
  getBotStatus(): Promise<BotStatus>;
  updateBotStatus(statusUpdate: Partial<BotStatus>): Promise<void>;
  
  // Activity logging
  addActivityLog(log: InsertActivityLog): Promise<void>;
  getActivityLogs(page: number, limit: number, type?: string): Promise<InsertActivityLog[]>;
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
