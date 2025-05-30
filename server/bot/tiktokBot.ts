// Renaming the exported class to "TikTokBot" (with two capitals) so the import matches exactly.
// Defining SessionData with required createdAt and expiresAt as Date to align with the environment’s type expectations.
// Ensuring sessionStorage is present. Avoiding "object is possibly null" by null-checking this.browser and this.page.

import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';

const SELLER_BASE_URL = process.env.SELLER_BASE_URL || 'https://seller.tiktok.com';
import { IStorage } from '../storage';
import { BotConfig, BotStatus } from '../../shared/schema';
import { login } from './botActions';

// Placeholder logger
const logger = {
  info: (...args: any[]) => console.log('[INFO]', ...args),
  error: (...args: any[]) => console.error('[ERROR]', ...args),
  startMetric: (...args: any[]) => console.log('[startMetric]', ...args),
  endMetric: (...args: any[]) => console.log('[endMetric]', ...args),
};

// Simple rate limiter
class RateLimiter {
  private concurrency: number;
  private queue: Function[] = [];
  private activeCount = 0;

  constructor(concurrency: number) {
    this.concurrency = concurrency;
  }

  async enqueue<T>(task: () => Promise<T>): Promise<T> {
    if (this.activeCount >= this.concurrency) {
      await new Promise<void>(resolve => this.queue.push(resolve));
    }
    this.activeCount++;
    try {
      return await task();
    } finally {
      this.activeCount--;
      if (this.queue.length > 0) {
        const next = this.queue.shift();
        if (next) next();
      }
    }
  }

  getQueueStatus() {
    return {
      queueLength: this.queue.length,
      isRateLimited: this.activeCount >= this.concurrency,
      consecutiveFailures: 0,
    };
  }
}

// Minimal placeholders if you have real logic in separate files
async function navigateToAffiliateCenter(_page: Page) {/* placeholder */}
async function applyFilters(_page: Page, _options: any) {/* placeholder */}
async function extractCreatorInfo(_page: Page): Promise<any[]> { return []; }
async function inviteCreators(_page: Page, _creators: any[], _limit: number) {/* placeholder */}

/**
 * SessionData -- explicitly requires createdAt and expiresAt as Date
 */
export interface SessionData {
  userAgent: string;
  cookies: any[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  viewport: { width: number; height: number };
  createdAt: Date;
  expiresAt: Date;
  timestamp: number;
}

/**
 * TikTokBot -- matches the name used by your tiktokBotInstance
 */
export class TikTokBot {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: BotConfig | null = null;
  private isRunning = false;
  private rateLimiter: RateLimiter;

  constructor(private storage: IStorage) {
    this.rateLimiter = new RateLimiter(20);
    puppeteer.use(StealthPlugin());
  }

  /**
   * startManualLogin
   */
  async startManualLogin(): Promise<boolean> {
    logger.info('bot', 'Starting manual login process');
    const config = await this.storage.getBotConfig();
    try {
      const headless = process.env.HEADLESS_LOGIN !== 'false' && !process.env.DISPLAY;
      this.browser = await puppeteer.launch({
        headless,
        defaultViewport: headless ? { width: 1920, height: 1080 } : null,
        args: headless
          ? ['--no-sandbox', '--disable-setuid-sandbox']
          : ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox'],
      });
      if (!this.browser) throw new Error('Browser failed to launch');

      this.page = await this.browser.newPage();
      if (!this.page) throw new Error('New page could not be opened');

      await this.page.goto(`${SELLER_BASE_URL}/login`, {
        waitUntil: 'networkidle0',
      });

      if (headless) {
        await login(this.page, {
          email: config.email,
          password: config.password,
        });
      }

      await this.page.waitForSelector('.dashboard-container, .seller-dashboard', {
        timeout: 300000,
      });

      const session = await this.captureSession();
      session.createdAt = new Date();
      session.expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

      await this.storage.saveSessionData(session);

      logger.info('bot', 'Manual login successful, session saved');
      await this.browser.close();
      this.browser = null;
      this.page = null;
      return true;
    } catch (error) {
      logger.error('bot', 'Manual login failed', error);
      if (this.browser) {
        await this.browser.close();
      }
      this.browser = null;
      this.page = null;
      throw error;
    }
  }

  /**
   * captureSession
   */
  private async captureSession(): Promise<SessionData> {
    if (!this.page) {
      throw new Error('No browser page available to capture session');
    }

    const cookies = await this.page.cookies();
    const localStorageObj = await this.page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          items[key] = localStorage.getItem(key) || '';
        }
      }
      return items;
    });
    const sessionStorageObj = await this.page.evaluate(() => {
      const items: Record<string, string> = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          items[key] = sessionStorage.getItem(key) || '';
        }
      }
      return items;
    });

    const userAgent = await this.page.browser().userAgent();
    const viewport = this.page.viewport() || { width: 1920, height: 1080 };

    return {
      userAgent,
      cookies,
      localStorage: localStorageObj,
      sessionStorage: sessionStorageObj,
      viewport,
      timestamp: Date.now(),
      // We'll initialize them to some defaults; they will be overwritten after capturing
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 24 * 3600 * 1000),
    };
  }

  /**
   * initBot
   */
  private async initBot(headless = true): Promise<boolean> {
    logger.startMetric('bot_initialization');
    try {
      this.config = await this.storage.getBotConfig();
      if (!this.config) {
        throw new Error('Bot configuration not found');
      }

      this.browser = await puppeteer.launch({
        headless,
        args: ['--no-sandbox', '--disable-setuid-sandbox'],
      });
      if (!this.browser) {
        throw new Error('Failed to launch Puppeteer');
      }

      this.page = await this.browser.newPage();
      if (!this.page) {
        throw new Error('Failed to open new page');
      }

      const savedSession = await this.storage.getSessionData();
      if (!savedSession) {
        throw new Error('No saved session found. Please run startManualLogin first.');
      }

      await this.restoreSession(savedSession);

      const isValid = await this.verifySession();
      if (!isValid) {
        throw new Error('Session invalid or expired. Please run startManualLogin again.');
      }

      await this.storage.updateBotStatus({ status: 'initialized' });
      logger.endMetric('bot_initialization', true);
      return true;
    } catch (error: any) {
      logger.endMetric('bot_initialization', false);
      logger.error('bot', 'Initialization failed', error);
      await this.storage.updateBotStatus({ status: 'error', lastError: error.message });
      return false;
    }
  }

  /**
   * restoreSession
   */
  private async restoreSession(session: SessionData): Promise<void> {
    if (!this.page) return;

    if (session.cookies?.length) {
      await this.page.setCookie(...session.cookies);
    }
    await this.page.evaluate((data) => {
      for (const [key, value] of Object.entries(data)) {
        localStorage.setItem(key, value);
      }
    }, session.localStorage);

    await this.page.evaluate((data) => {
      for (const [key, value] of Object.entries(data)) {
        sessionStorage.setItem(key, value);
      }
    }, session.sessionStorage);

    await this.page.setViewport(session.viewport);
    await this.page.setUserAgent(session.userAgent);
  }

  /**
   * verifySession
   */
  private async verifySession(): Promise<boolean> {
    if (!this.page) return false;
    try {
      await this.page.goto(`${SELLER_BASE_URL}/api/v1/user/info`, {
        waitUntil: 'networkidle0',
      });
      const content = await this.page.content();
      return !(content.includes('login') || content.includes('unauthorized'));
    } catch {
      return false;
    }
  }

  /**
   * start
   */
  public async start(): Promise<boolean> {
    const ok = await this.initBot(true);
    if (!ok || !this.config || !this.page) {
      logger.error('bot', 'Bot not initialized properly');
      await this.storage.updateBotStatus({ status: 'error', lastError: 'Bot not initialized' });
      return false;
    }

    this.isRunning = true;
    await this.storage.updateBotStatus({ status: 'running' });

    try {
      // Navigate
      await this.rateLimiter.enqueue(async () => {
        await navigateToAffiliateCenter(this.page!);
      });

      // Convert to int safely
      const minFollowers = parseInt(String(this.config.minFollowers), 10) || 0;
      const maxFollowers = parseInt(String(this.config.maxFollowers), 10) || 99999999;

      // Apply
      await this.rateLimiter.enqueue(async () => {
        await applyFilters(this.page!, {
          minFollowers,
          maxFollowers,
          categories: this.config!.categories,
        });
      });

      // Extract
      const creators = await this.rateLimiter.enqueue(() => {
        return extractCreatorInfo(this.page!);
      });

      // Invite
      const invitationLimit = parseInt(String(this.config.invitationLimit), 10) || 5;
      await this.rateLimiter.enqueue(async () => {
        await inviteCreators(this.page!, creators, invitationLimit);
      });

      return true;
    } catch (err: any) {
      logger.error('bot', 'Bot operation failed', err);
      await this.storage.updateBotStatus({ status: 'error', lastError: err.message });
      return false;
    }
  }

  /**
   * stop
   */
  public async stop(): Promise<void> {
    this.isRunning = false;
    await this.storage.updateBotStatus({ status: 'stopped' });

    if (this.browser) {
      await this.browser.close();
    }
    this.browser = null;
    this.page = null;

    await this.storage.cleanup();
  }

  /**
   * getStatus
   */
  public async getStatus(): Promise<BotStatus & {
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
      consecutiveFailures: queueStatus.consecutiveFailures,
    };
  }
}
