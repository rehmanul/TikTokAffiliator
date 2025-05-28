import { Browser, Page } from 'puppeteer';
import puppeteer from 'puppeteer-extra';
import StealthPlugin from 'puppeteer-extra-plugin-stealth';
import { IStorage } from '../storage/index';
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
import {
  Creator,
  SessionData,
  EncryptedSessionData,
  BotOperation
} from './types';

puppeteer.use(StealthPlugin());

export class EnhancedTiktokBot {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private config: BotConfig | null = null;
  private isRunning = false;
  private rateLimiter: RateLimiter;
  private retryAttempts = 3;

  constructor(private storage: IStorage) {
    this.rateLimiter = new RateLimiter(20); // 20 requests per minute
  }

  async init(): Promise<boolean> {
    try {
      logger.startMetric('bot_initialization');
      await logger.info('bot', 'Initializing TikTok bot');

      this.config = await this.storage.getBotConfig();
      if (!this.config) {
        throw new Error('Bot configuration not found');
      }

      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-web-security',
          '--disable-features=IsolateOrigins,site-per-process',
          '--disable-dev-shm-usage'
        ],
        defaultViewport: { width: 1920, height: 1080 }
      });

      this.page = await this.browser.newPage();
      await this.setupRequestInterception();
      
      const success = await this.handleSession();
      if (!success) {
        throw new Error('Session handling failed');
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

  private async setupRequestInterception(): Promise<void> {
    if (!this.page) return;
    
    await this.page.setRequestInterception(true);
    this.page.on('request', request => {
      void this.rateLimiter.enqueue(async () => {
        try {
          await request.continue();
        } catch (error) {
          logger.error('network', 'Request failed', error as Error);
          request.abort();
        }
      });
    });
  }

  private async handleSession(): Promise<boolean> {
    try {
      logger.startMetric('session_handling');
      
      // Get current session data
      const currentSession = await this.getCurrentSession();
      if (currentSession && this.isSessionValid(currentSession)) {
        if (await this.restoreSession(currentSession)) {
          logger.info('session', 'Successfully restored existing session');
          return true;
        }
      }

      // If no valid session, perform login
      await this.performLogin();
      
      // Save new session
      await this.saveCurrentSession();
      logger.info('session', 'New session established and saved');

      logger.endMetric('session_handling', true);
      return true;
    } catch (error) {
      logger.endMetric('session_handling', false);
      logger.error('session', 'Session handling failed', error as Error);
      return false;
    }
  }

  private async getCurrentSession(): Promise<SessionData | null> {
    if (!this.page) return null;

    try {
      const cookies = await this.page.cookies();
      const localStorage = await this.page.evaluate(() => {
        const data: Record<string, string> = {};
        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          if (key) {
            data[key] = localStorage.getItem(key) || '';
          }
        }
        return data;
      });

      const sessionStorage = await this.page.evaluate(() => {
        const data: Record<string, string> = {};
        for (let i = 0; i < sessionStorage.length; i++) {
          const key = sessionStorage.key(i);
          if (key) {
            data[key] = sessionStorage.getItem(key) || '';
          }
        }
        return data;
      });

      const viewport = this.page.viewport() || { width: 1920, height: 1080 };
      const userAgent = await this.page.evaluate(() => navigator.userAgent);

      return {
        cookies,
        localStorage,
        sessionStorage,
        viewport,
        userAgent,
        timestamp: Date.now()
      };
    } catch (error) {
      logger.error('session', 'Failed to get current session', error as Error);
      return null;
    }
  }

  private async saveCurrentSession(): Promise<void> {
    const session = await this.getCurrentSession();
    if (session) {
      await this.storage.saveSessionData(session);
    }
  }

  private isSessionValid(session: SessionData): boolean {
    const maxAge = 24 * 60 * 60 * 1000; // 24 hours
    return Date.now() - session.timestamp < maxAge;
  }

  private async restoreSession(session: SessionData): Promise<boolean> {
    if (!this.page) return false;

    try {
      await this.page.setCookie(...session.cookies);
      
      await this.page.evaluate((data) => {
        localStorage.clear();
        for (const [key, value] of Object.entries(data)) {
          localStorage.setItem(key, value);
        }
      }, session.localStorage);

      await this.page.evaluate((data) => {
        sessionStorage.clear();
        for (const [key, value] of Object.entries(data)) {
          sessionStorage.setItem(key, value);
        }
      }, session.sessionStorage);

      await this.page.setViewport(session.viewport);
      await this.page.setUserAgent(session.userAgent);

      return true;
    } catch (error) {
      logger.error('session', 'Failed to restore session', error as Error);
      return false;
    }
  }

  private async performLogin(): Promise<void> {
    if (!this.config || !this.page) throw new Error('Bot not properly initialized');
    
    logger.startMetric('login');
    try {
      await this.rateLimiter.enqueue(async () => {
        await login(this.page!, {
          email: this.config!.email,
          password: this.config!.password
        });
      });
      logger.endMetric('login', true);
    } catch (error) {
      logger.endMetric('login', false);
      throw error;
    }
  }

  async start(): Promise<boolean> {
    if (!this.config || !this.page) {
      throw new Error('Bot not initialized');
    }

    try {
      this.isRunning = true;
      await this.storage.updateBotStatus({ status: 'running' });
      logger.info('bot', 'Starting bot operations');

      await this.retryOperation(
        async () => navigateToAffiliateCenter(this.page!),
        'Navigate to affiliate center'
      );

      await this.retryOperation(
        async () => applyFilters(this.page!, {
          minFollowers: this.config!.minFollowers,
          maxFollowers: this.config!.maxFollowers,
          categories: this.config!.categories
        }),
        'Apply filters'
      );

      const creators = await this.retryOperation(
        async () => extractCreatorInfo(this.page!),
        'Extract creator info'
      );

      await this.retryOperation(
        async () => inviteCreators(this.page!, creators, this.config!.invitationLimit),
        'Invite creators'
      );

      logger.info('bot', 'Bot operations completed successfully');
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

  private async retryOperation<T>(
    operation: BotOperation<T>,
    operationName: string,
    maxRetries: number = this.retryAttempts
  ): Promise<T> {
    let lastError: Error | null = null;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        logger.startMetric(`operation_${operationName}`);
        const result = await this.rateLimiter.enqueue(operation);
        logger.endMetric(`operation_${operationName}`, true);
        return result;
      } catch (error) {
        lastError = error as Error;
        logger.endMetric(`operation_${operationName}`, false);
        logger.warn('bot', `${operationName} failed, attempt ${attempt}/${maxRetries}`, {
          error: lastError,
          attempt,
          maxRetries
        });

        if (attempt < maxRetries) {
          if (await this.checkForCaptcha()) {
            continue;
          }
          const delay = Math.min(1000 * Math.pow(2, attempt), 30000);
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }
    }

    throw lastError || new Error(`${operationName} failed after ${maxRetries} attempts`);
  }

  private async checkForCaptcha(): Promise<boolean> {
    if (!this.page) return false;

    try {
      logger.startMetric('captcha_check');
      const hasCaptcha = await this.page.evaluate(() => {
        return !!document.querySelector('iframe[title*="captcha" i]') ||
               !!document.querySelector('div[class*="captcha" i]');
      });

      if (hasCaptcha) {
        logger.info('captcha', 'Captcha detected, attempting to solve');
        const solved = await handleCaptcha(this.page);
        logger.endMetric('captcha_check', solved);
        return solved;
      }

      logger.endMetric('captcha_check', true);
      return false;
    } catch (error) {
      logger.endMetric('captcha_check', false);
      logger.error('captcha', 'Captcha check failed', error as Error);
      return false;
    }
  }

  async stop(): Promise<void> {
    logger.info('bot', 'Stopping bot');
    this.isRunning = false;
    await this.storage.updateBotStatus({ status: 'stopped' });
    await this.cleanup();
  }

  async getStatus(): Promise<BotStatus & { 
    queueLength: number; 
    isRateLimited: boolean; 
    consecutiveFailures: number 
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

  private async cleanup(): Promise<void> {
    logger.info('bot', 'Cleaning up resources');
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
      this.page = null;
    }
    await this.storage.cleanup();
  }
}
