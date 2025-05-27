import { expect } from 'chai';
import { describe, it, before, after } from 'mocha';
import puppeteer, { Browser, Page } from 'puppeteer';
import { login } from '../../server/bot/botActions';

describe('TikTok Login Flow Tests', () => {
  let browser: Browser;
  let page: Page;

  before(async () => {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    page = await browser.newPage();
  });

  after(async () => {
    await browser.close();
  });

  it('should handle login with valid credentials', async function() {
    this.timeout(30000);
    
    try {
      await login(page, {
        email: process.env.TIKTOK_EMAIL || '',
        password: process.env.TIKTOK_PASSWORD || ''
      });

      // Verify successful login
      const isLoggedIn = await page.evaluate(() => {
        return document.querySelector('.user-profile') !== null;
      });

      expect(isLoggedIn).to.be.true;
    } catch (error) {
      console.error('Login test failed:', error);
      throw error;
    }
  });

  it('should handle invalid credentials gracefully', async function() {
    this.timeout(30000);
    
    try {
      await login(page, {
        email: 'invalid@example.com',
        password: 'wrongpassword'
      });
      
      // Should throw an error for invalid credentials
      expect.fail('Should have thrown an error for invalid credentials');
    } catch (error) {
      expect(error).to.be.an('error');
      expect(error.message).to.include('Login failed');
    }
  });

  it('should handle network errors during login', async function() {
    this.timeout(30000);
    
    // Simulate offline mode
    await page.setOfflineMode(true);
    
    try {
      await login(page, {
        email: process.env.TIKTOK_EMAIL || '',
        password: process.env.TIKTOK_PASSWORD || ''
      });
      
      expect.fail('Should have thrown an error for network failure');
    } catch (error) {
      expect(error).to.be.an('error');
      expect(error.message).to.include('Login failed');
    } finally {
      await page.setOfflineMode(false);
    }
  });

  it('should maintain session after successful login', async function() {
    this.timeout(30000);
    
    try {
      await login(page, {
        email: process.env.TIKTOK_EMAIL || '',
        password: process.env.TIKTOK_PASSWORD || ''
      });

      // Get cookies after login
      const cookies = await page.cookies();
      expect(cookies).to.be.an('array').that.is.not.empty;

      // Navigate away and back to verify session persistence
      await page.goto('https://www.tiktok.com');
      await page.goto('https://seller-us.tiktok.com/homepage');

      const isStillLoggedIn = await page.evaluate(() => {
        return document.querySelector('.user-profile') !== null;
      });

      expect(isStillLoggedIn).to.be.true;
    } catch (error) {
      console.error('Session persistence test failed:', error);
      throw error;
    }
  });
});
