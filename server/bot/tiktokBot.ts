import puppeteer, { Browser, Page } from 'puppeteer';
import { 
  login, 
  navigateToAffiliateCenter, 
  applyFilters, 
  inviteCreators,
  checkVerificationRequired
} from './botActions';
import { handleCaptcha } from './captchaHandler';
import { saveSession, loadSession } from './sessionManager';
import { IStorage } from '../storage';
import { InsertActivityLog, BotConfig, Creator } from '@shared/schema';

export class TiktokBot {
  private browser: Browser | null = null;
  private page: Page | null = null;
  private storage: IStorage;
  private config: BotConfig | null = null;
  private isRunning: boolean = false;
  private stopRequested: boolean = false;
  private creatorsFound: Creator[] = [];
  private currentInvitationCount: number = 0;

  constructor(storage: IStorage) {
    this.storage = storage;
  }

  async init() {
    try {
      // Log initialization
      await this.log({
        timestamp: new Date(),
        type: 'System',
        message: 'Bot initializing...',
        status: 'Pending',
        details: null
      });

      // Load configuration
      this.config = await this.storage.getBotConfig();
      if (!this.config) {
        throw new Error('Bot configuration not found');
      }

      // Launch browser with stealth mode
      this.browser = await puppeteer.launch({
        headless: true, // We need to run it in headless mode in production
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--disable-gpu',
          '--window-size=1920,1080',
        ],
        defaultViewport: {
          width: 1920,
          height: 1080
        }
      });

      // Create a new page
      this.page = await this.browser.newPage();
      
      // Set user agent
      await this.page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36');
      
      // Set extra HTTP headers
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9'
      });

      // Try to load existing session
      const sessionData = await this.storage.getSessionData();
      if (sessionData) {
        try {
          await loadSession(this.page, sessionData);
          await this.log({
            timestamp: new Date(),
            type: 'System',
            message: 'Existing session loaded',
            status: 'Success',
            details: null
          });
        } catch (error) {
          await this.log({
            timestamp: new Date(),
            type: 'System',
            message: 'Failed to load existing session, will perform fresh login',
            status: 'Error',
            details: { error: (error as Error).message }
          });
        }
      }

      // Update bot status
      await this.storage.updateBotStatus({
        status: 'initialized'
      });

      await this.log({
        timestamp: new Date(),
        type: 'System',
        message: 'Bot initialized successfully',
        status: 'Success',
        details: null
      });

      return true;
    } catch (error) {
      await this.log({
        timestamp: new Date(),
        type: 'Error',
        message: `Bot initialization failed: ${(error as Error).message}`,
        status: 'Error',
        details: { error: (error as Error).message }
      });
      
      // Update bot status to error
      await this.storage.updateBotStatus({
        status: 'error'
      });
      
      return false;
    }
  }

  async start() {
    try {
      if (!this.browser || !this.page) {
        const initialized = await this.init();
        if (!initialized) {
          throw new Error('Failed to initialize bot');
        }
      }

      if (!this.page) {
        throw new Error('Browser page not initialized');
      }

      this.isRunning = true;
      this.stopRequested = false;
      
      // Update bot status
      await this.storage.updateBotStatus({
        status: 'running'
      });

      await this.log({
        timestamp: new Date(),
        type: 'System',
        message: 'Bot started',
        status: 'Success',
        details: null
      });

      // Start the bot process
      await this.runBotProcess();

      return true;
    } catch (error) {
      await this.log({
        timestamp: new Date(),
        type: 'Error',
        message: `Bot start failed: ${(error as Error).message}`,
        status: 'Error',
        details: { error: (error as Error).message }
      });
      
      this.isRunning = false;
      
      // Update bot status to error
      await this.storage.updateBotStatus({
        status: 'error'
      });
      
      return false;
    }
  }

  async stop() {
    try {
      this.stopRequested = true;
      
      // Wait for any running operation to complete
      await this.log({
        timestamp: new Date(),
        type: 'System',
        message: 'Stop requested, waiting for current operation to complete...',
        status: 'Pending',
        details: null
      });
      
      // Set a timeout in case the bot doesn't stop gracefully
      setTimeout(async () => {
        if (this.isRunning) {
          this.isRunning = false;
          
          // Update bot status
          await this.storage.updateBotStatus({
            status: 'stopped'
          });
          
          await this.log({
            timestamp: new Date(),
            type: 'System',
            message: 'Bot forcefully stopped after timeout',
            status: 'Warning',
            details: null
          });
        }
      }, 10000);
      
      return true;
    } catch (error) {
      await this.log({
        timestamp: new Date(),
        type: 'Error',
        message: `Bot stop failed: ${(error as Error).message}`,
        status: 'Error',
        details: { error: (error as Error).message }
      });
      
      return false;
    }
  }

  async getStatus() {
    return {
      isRunning: this.isRunning,
      creatorsFound: this.creatorsFound.length,
      invitationsSent: this.currentInvitationCount
    };
  }

  private async runBotProcess() {
    if (!this.page || !this.config) {
      throw new Error('Bot not properly initialized');
    }

    try {
      // Step 1: Login to TikTok Seller Center
      await this.log({
        timestamp: new Date(),
        type: 'Login',
        message: 'Logging in to TikTok Seller Center...',
        status: 'Pending',
        details: null
      });
      
      let loginSuccess = false;
      try {
        loginSuccess = await login(
          this.page, 
          this.config.email, 
          this.config.password,
          this.createLogFunction()
        );
      } catch (error) {
        // Check if verification is required
        const verificationRequired = await checkVerificationRequired(this.page);
        if (verificationRequired) {
          // Handle verification
          await this.log({
            timestamp: new Date(),
            type: 'Verification',
            message: 'Verification required, attempting to solve...',
            status: 'Pending',
            details: null
          });
          
          try {
            const verificationSuccess = await handleCaptcha(this.page, this.createLogFunction());
            if (verificationSuccess) {
              loginSuccess = true;
              
              await this.log({
                timestamp: new Date(),
                type: 'Verification',
                message: 'Verification completed successfully',
                status: 'Success',
                details: null
              });
            } else {
              throw new Error('Failed to complete verification');
            }
          } catch (verificationError) {
            await this.log({
              timestamp: new Date(),
              type: 'Error',
              message: `Verification failed: ${(verificationError as Error).message}`,
              status: 'Error',
              details: { error: (verificationError as Error).message }
            });
            throw verificationError;
          }
        } else {
          throw error;
        }
      }
      
      if (!loginSuccess) {
        throw new Error('Login failed');
      }
      
      await this.log({
        timestamp: new Date(),
        type: 'Login',
        message: 'Login successful',
        status: 'Success',
        details: null
      });
      
      // Save the session for future use
      const sessionData = await saveSession(this.page);
      await this.storage.saveSessionData(sessionData);
      
      // Update bot status with login time
      await this.storage.updateBotStatus({
        lastLoginTime: new Date()
      });
      
      // Step 2: Navigate to Affiliate Center
      await this.log({
        timestamp: new Date(),
        type: 'Navigation',
        message: 'Navigating to Affiliate Center...',
        status: 'Pending',
        details: null
      });
      
      const navigationSuccess = await navigateToAffiliateCenter(
        this.page,
        this.createLogFunction()
      );
      
      if (!navigationSuccess) {
        throw new Error('Failed to navigate to Affiliate Center');
      }
      
      await this.log({
        timestamp: new Date(),
        type: 'Navigation',
        message: 'Successfully navigated to Affiliate Center',
        status: 'Success',
        details: null
      });
      
      // Step 3: Apply filters to find creators
      await this.log({
        timestamp: new Date(),
        type: 'Filter',
        message: `Applying filters: ${this.config.minFollowers}-${this.config.maxFollowers} followers, ${this.config.categories.join(', ')}`,
        status: 'Pending',
        details: null
      });
      
      const creators = await applyFilters(
        this.page,
        {
          minFollowers: this.config.minFollowers,
          maxFollowers: this.config.maxFollowers,
          categories: this.config.categories
        },
        this.createLogFunction()
      );
      
      if (!creators || creators.length === 0) {
        await this.log({
          timestamp: new Date(),
          type: 'Filter',
          message: 'No creators found matching the criteria',
          status: 'Warning',
          details: null
        });
      } else {
        this.creatorsFound = creators;
        await this.storage.saveCreators(creators);
        
        await this.log({
          timestamp: new Date(),
          type: 'Filter',
          message: `Found ${creators.length} creators matching the criteria`,
          status: 'Success',
          details: { creatorCount: creators.length }
        });
        
        // Step 4: Send invitations to creators
        await this.log({
          timestamp: new Date(),
          type: 'Invite',
          message: 'Starting invitation process...',
          status: 'Pending',
          details: null
        });
        
        const invitationResults = await inviteCreators(
          this.page,
          creators,
          this.config.invitationLimit,
          this.config.actionDelay,
          this.stopRequested,
          this.createLogFunction()
        );
        
        this.currentInvitationCount = invitationResults.invited;
        
        // Update bot status with invitation count
        const currentBotStatus = await this.storage.getBotStatus();
        if (currentBotStatus) {
          await this.storage.updateBotStatus({
            invitationsSent: (currentBotStatus.invitationsSent || 0) + invitationResults.invited,
            successRate: invitationResults.successRate
          });
        }
        
        await this.log({
          timestamp: new Date(),
          type: 'Invite',
          message: `Invitation process completed. Sent ${invitationResults.invited} invitations with ${invitationResults.successRate}% success rate`,
          status: 'Success',
          details: invitationResults
        });
      }
      
      if (this.stopRequested) {
        await this.log({
          timestamp: new Date(),
          type: 'System',
          message: 'Bot stopped by user request',
          status: 'Success',
          details: null
        });
      } else {
        await this.log({
          timestamp: new Date(),
          type: 'System',
          message: 'Bot completed all tasks successfully',
          status: 'Success',
          details: null
        });
      }
      
      // Update bot status
      await this.storage.updateBotStatus({
        status: 'stopped'
      });
      
      this.isRunning = false;
    } catch (error) {
      await this.log({
        timestamp: new Date(),
        type: 'Error',
        message: `Bot process failed: ${(error as Error).message}`,
        status: 'Error',
        details: { error: (error as Error).message }
      });
      
      // Update bot status to error
      await this.storage.updateBotStatus({
        status: 'error'
      });
      
      this.isRunning = false;
    } finally {
      // Delay closing the browser to allow for any pending operations
      setTimeout(async () => {
        try {
          if (this.browser) {
            await this.browser.close();
            this.browser = null;
            this.page = null;
          }
        } catch (error) {
          console.error('Error closing browser:', error);
        }
      }, 5000);
    }
  }

  private async log(logEntry: InsertActivityLog): Promise<void> {
    await this.storage.addActivityLog(logEntry);
  }

  private createLogFunction() {
    return async (message: string, type: string = 'System', status: string = 'Info', details: any = null) => {
      await this.log({
        timestamp: new Date(),
        type,
        message,
        status,
        details
      });
    };
  }
}
