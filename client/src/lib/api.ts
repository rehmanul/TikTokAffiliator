import { ActivityLog, BotConfig, BotStatus, Creator } from "./types";
import { apiRequest } from "./queryClient";

// Bot Status
export async function getBotStatus(): Promise<BotStatus> {
  const res = await fetch("/api/status", { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to get bot status: ${res.statusText}`);
  }
  return res.json();
}

export async function startBot(): Promise<{ message: string }> {
  const res = await apiRequest("POST", "/api/start", undefined);
  return res.json();
}

export async function stopBot(): Promise<{ message: string }> {
  const res = await apiRequest("POST", "/api/stop", undefined);
  return res.json();
}

// Bot Configuration
export async function getBotConfig(): Promise<BotConfig> {
  const res = await fetch("/api/config", { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to get bot configuration: ${res.statusText}`);
  }
  return res.json();
}

export async function updateBotConfig(config: BotConfig): Promise<BotConfig> {
  const res = await apiRequest("POST", "/api/config", config);
  return res.json();
}

// Activity Logs
export async function getActivityLogs(page: number = 1, limit: number = 10, type?: string): Promise<ActivityLog[]> {
  const params = new URLSearchParams();
  params.append("page", page.toString());
  params.append("limit", limit.toString());
  if (type) {
    params.append("type", type);
  }
  
  const res = await fetch(`/api/logs?${params.toString()}`, { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to get activity logs: ${res.statusText}`);
  }
  return res.json();
}

export async function clearActivityLogs(): Promise<{ message: string }> {
  const res = await apiRequest("DELETE", "/api/logs", undefined);
  return res.json();
}

// Creators
export async function getCreators(): Promise<Creator[]> {
  const res = await fetch("/api/creators", { credentials: "include" });
  if (!res.ok) {
    throw new Error(`Failed to get creators: ${res.statusText}`);
  }
  return res.json();
}

// Verification
export async function submitVerificationCode(code: string): Promise<{ message: string }> {
  const res = await apiRequest("POST", "/api/verification", { code });
  return res.json();
}
