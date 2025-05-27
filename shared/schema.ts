import { z } from "zod";

// Define Zod schemas
export const BotConfigSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
  minFollowers: z.number().min(0),
  maxFollowers: z.number().min(0),
  categories: z.array(z.string()),
  invitationLimit: z.number().min(0)
});

// Define all shared types and interfaces
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
  actionDelay: number;
  retryAttempts: number;
  retryDelay: number;
  sessionTimeout: number;
  maxConcurrentRequests?: number;
  requestTimeout?: number;
  maxRequestsPerMinute?: number;
  userAgent?: string;
  proxyUrl?: string;
  logLevel?: string;
  screenshotOnError?: boolean;
  maxDailyInvites?: number;
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

// Extended log type used when inserting logs into storage
export interface InsertActivityLog extends ActivityLog {
  details?: any;
}

export interface BotStatus {
  status: 'idle' | 'running' | 'error' | 'initialized' | 'stopped';
  lastError?: string;
  lastActivity?: ActivityLog;
  isRateLimited?: boolean;
  queueLength?: number;
  lastLoginTime?: Date;
  invitationsSent?: number;
  successRate?: number;
  currentOperation?: string;
  uptime?: number;
  memoryUsage?: number;
  cpuUsage?: number;
}

export interface StorageConfig {
  sessionExpiry: number; // milliseconds
  maxInvitesPerDay: number;
  rateLimitDelay: number; // milliseconds
  maxRetries: number;
}

// Export types from Zod schemas
export type BotConfigType = z.infer<typeof BotConfigSchema>;
