export type BotStatus = {
  status: "running" | "stopped" | "initialized" | "error";
  lastLoginTime: string | null;
  invitationsSent: number;
  invitationsTarget: number;
  successRate: number;
  isRunning?: boolean;
  creatorsFound?: number;
};

export type BotConfig = {
  email: string;
  password: string;
  rememberCredentials: boolean;
  minFollowers: number;
  maxFollowers: number;
  categories: string[];
  invitationLimit: number;
  actionDelay: number;
  retryAttempts: number;
  operationMode: string;
  isActive: boolean;
};

export type ActivityLogType = "Login" | "Filter" | "Invite" | "Error" | "Verification" | "System" | "Navigation";

export type ActivityLogStatus = "Success" | "Pending" | "Error" | "Warning" | "Info";

export type ActivityLog = {
  id: number;
  timestamp: string;
  type: ActivityLogType;
  message: string;
  status: ActivityLogStatus;
  details: any | null;
};

export type Creator = {
  username: string;
  displayName?: string;
  category?: string;
  followers: number;
  demographic?: string;
  earnings?: string;
  engagement?: string;
  invited?: boolean;
};

export type NotificationType = "success" | "error" | "warning" | "info";

export type Notification = {
  id: string;
  title: string;
  message: string;
  type: NotificationType;
};
