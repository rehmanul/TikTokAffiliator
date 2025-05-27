import type { BotConfig, BotStatus, Creator } from '../../../shared/schema';

export type { BotConfig, BotStatus, Creator };

export type NotificationType = 'success' | 'error' | 'warning' | 'info';

export interface ActivityLog {
  id: string;
  timestamp: string;
  type: 'System' | 'Bot' | 'Verification' | 'Error';
  status: 'Success' | 'Pending' | 'Failed';
  message: string;
}
