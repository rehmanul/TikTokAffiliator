import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { IStorage } from '../storage';
import { BotConfig, BotStatus } from '../../shared/schema';
import { logger } from './utils/logger';
import { RateLimiter } from './utils/rateLimiter';
import {
  login,
  navigateToAffiliateCenter,
  applyFilters,
  inviteCreators,
  extractCreatorInfo,
  handleCaptcha
} from './botActions';

interface SessionData {
  cookies: any[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  userAgent: string;
  viewport: { width: number; height: number };
  timestamp: number;
}

export class TikTokBot {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: BotConfig | null = null;
  private isRunning = false;
  private rateLimiter: RateLimiter;
  private retryAttempts = 3;

  constructor(private storage: IStorage) {
    this.rateLimiter = new RateLimiter(20);
  }

  async init(): Promise<boolean> {
    try {
      logger.startMetric('bot_initialization');
      
      this.config = await this.storage.getBotConfig();
      if (!this.config) {
        throw new Error('Bot configuration not found');
      }

      puppeteer.use(StealthPlugin());

      this.browser = await puppeteer.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      });

      this.page = await this.browser.newPage();
      await this.page.setViewport({ width: 1920, height: 1080 });

      // Retrieve the raw session from storage
      const rawSession: any = await this.storage.getSessionData();
      if (rawSession) {
        const session: SessionData = {
          cookies: rawSession.cookies || [],
          localStorage: rawSession.localStorage || {},
          sessionStorage: rawSession.sessionStorage || {},
          userAgent: rawSession.userAgent || 'Mozilla/5.0',
          viewport: rawSession.viewport || { width: 1920, height: 1080 },
          timestamp: rawSession.timestamp ? rawSession.timestamp : Date.now()
        };
        await this.restoreSession(session);
      }

      await this.storage.updateBotStatus({ status: 'initialized' });
      logger.endMetric('bot_initialization', true);
      return true;
    } catch (error) {
      logger.endMetric('bot_initialization', false);
      logger.error('bot', 'Initialization failed', error as Error);
      await this.storage.updateBotStatus({
        status: 'error',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  private async restoreSession(session: SessionData): Promise<boolean> {
    if (!this.page) return false;

    try {
      if (session.cookies.length > 0) {
        await this.page.setCookie(...session.cookies);
      }
      
      // Restore localStorage
      await this.page.evaluate((data) => {
        Object.entries(data).forEach(([key, value]) => {
          localStorage.setItem(key, value);
        });
      }, session.localStorage);

      // Restore sessionStorage
      await this.page.evaluate((data) => {
        Object.entries(data).forEach(([key, value]) => {
          sessionStorage.setItem(key, value);
        });
      }, session.sessionStorage);

      // Set viewport & user agent
      await this.page.setViewport(session.viewport);
      await this.page.setUserAgent(session.userAgent);

      return true;
    } catch (error) {
      logger.error('session', 'Failed to restore session', error as Error);
      return false;
    }
  }

  async start(): Promise<boolean> {
    if (!this.config || !this.page) {
      const initSuccess = await this.init();
      if (!initSuccess || !this.config || !this.page) {
        throw new Error('Bot not initialized');
      }
    }

    try {
      this.isRunning = true;
      await this.storage.updateBotStatus({ status: 'running' });

      // Perform the login
      await this.rateLimiter.enqueue(async () => {
        await login(this.page!, {
          email: this.config!.email,
          password: this.config!.password
        });
      });

      // Navigate to the affiliate center
      await this.rateLimiter.enqueue(async () => {
        await navigateToAffiliateCenter(this.page!);
      });

      // Apply filter criteria
      await this.rateLimiter.enqueue(async () => {
        await applyFilters(this.page!, {
          minFollowers: this.config!.minFollowers,
          maxFollowers: this.config!.maxFollowers,
          categories: this.config!.categories
        });
      });

      // Gather creators
      const creators = await this.rateLimiter.enqueue(async () => {
        return extractCreatorInfo(this.page!);
      });

      // Invite creators
      await this.rateLimiter.enqueue(async () => {
        await inviteCreators(this.page!, creators, this.config!.invitationLimit);
      });

      return true;
    } catch (error) {
      logger.error('bot', 'Bot operation failed', error as Error);
      await this.storage.updateBotStatus({
        status: 'error',
        lastError: error instanceof Error ? error.message : 'Unknown error'
      });
      return false;
    }
  }

  async stop(): Promise<void> {
    this.isRunning = false;
    await this.storage.updateBotStatus({ status: 'stopped' });
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    await this.storage.cleanup();
  }

  async getStatus(): Promise<BotStatus & {
    queueLength: number;
    isRateLimited: boolean;
    consecutiveFailures: number;
  }> {
    const status = await this.storage.getBotStatus();
    const queueStatus = this.rateLimiter.getQueueStatus();
    
    return {
      ...status,
      queueLength: queueStatus.queueLength,
      isRateLimited: queueStatus.isRateLimited,
      consecutiveFailures: queueStatus.consecutiveFailures
    };
  }
}
