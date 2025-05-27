import { Page } from 'puppeteer';

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface FilterOptions {
  minFollowers: number;
  maxFollowers: number;
  categories: string[];
}

export interface Creator {
  username: string;
  followers: number;
  invited: boolean;
}

export interface SessionData {
  cookies: any[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  userAgent: string;
  viewport: {
    width: number;
    height: number;
  };
  timestamp: number;
}

export interface EncryptedSessionData {
  data: string;
  iv: string;
  timestamp: number;
}

export type BotOperation<T> = () => Promise<T>;

export interface BotOperationResult<T> {
  success: boolean;
  data?: T;
  error?: Error;
}
