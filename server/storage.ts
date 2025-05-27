import {
  BotConfig,
  BotStatus,
  SessionData,
  Creator,
  ActivityLog,
  InsertActivityLog,
} from '../shared/schema';

export interface IStorage {
  // Bot Configuration
  getBotConfig(): Promise<BotConfig>;
  updateBotConfig(config: Partial<BotConfig>): Promise<void>;
  
  // Session Management
  getSessionData(): Promise<SessionData | null>;
  saveSessionData(data: SessionData | null): Promise<void>;
  
  // Bot Status
  getBotStatus(): Promise<BotStatus>;
  updateBotStatus(status: Partial<BotStatus>): Promise<void>;
  
  // Activity Logging
  addActivityLog(log: InsertActivityLog): Promise<void>;
  
  // Creator Management
  saveCreators(creators: Creator[]): Promise<void>;
  getCreatorByUsername(username: string): Promise<Creator | null>;
  updateCreator(username: string, data: Partial<Creator>): Promise<void>;
  
  // Invitation Tracking
  getDailyInviteCount(): Promise<number>;
  incrementDailyInviteCount(): Promise<void>;
  resetDailyInviteCount(): Promise<void>;
  
  // Cleanup
  cleanup(): Promise<void>;
}

// Implementation can be added here or in separate files for different storage backends
// For example: SQLiteStorage, PostgresStorage, etc.

export type {
  BotConfig,
  BotStatus,
  SessionData,
  Creator,
  ActivityLog,
  InsertActivityLog,
};
