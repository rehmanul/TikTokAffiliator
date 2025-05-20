import { Page } from 'puppeteer';

export async function saveSession(page: Page): Promise<any> {
  try {
    // Get cookies
    const cookies = await page.cookies();
    
    // Get localStorage
    const localStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (key) {
          items[key] = localStorage.getItem(key);
        }
      }
      return items;
    });
    
    // Get sessionStorage
    const sessionStorage = await page.evaluate(() => {
      const items = {};
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (key) {
          items[key] = sessionStorage.getItem(key);
        }
      }
      return items;
    });
    
    return {
      cookies,
      localStorage,
      sessionStorage,
      timestamp: Date.now()
    };
  } catch (error) {
    console.error('Error saving session:', error);
    throw error;
  }
}

export async function loadSession(page: Page, sessionData: any): Promise<boolean> {
  try {
    if (!sessionData || !sessionData.cookies) {
      return false;
    }
    
    // Set cookies
    await page.setCookie(...sessionData.cookies);
    
    // Set localStorage
    if (sessionData.localStorage) {
      await page.evaluate((data) => {
        for (const key in data) {
          if (data[key]) {
            localStorage.setItem(key, data[key]);
          }
        }
      }, sessionData.localStorage);
    }
    
    // Set sessionStorage
    if (sessionData.sessionStorage) {
      await page.evaluate((data) => {
        for (const key in data) {
          if (data[key]) {
            sessionStorage.setItem(key, data[key]);
          }
        }
      }, sessionData.sessionStorage);
    }
    
    return true;
  } catch (error) {
    console.error('Error loading session:', error);
    return false;
  }
}

export async function randomDelay(min: number, max: number): Promise<void> {
  const delay = Math.floor(Math.random() * (max - min + 1)) + min;
  return new Promise(resolve => setTimeout(resolve, delay));
}

export function getRandomUserAgent(): string {
  const userAgents = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/92.0.4515.107 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.114 Safari/537.36',
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:89.0) Gecko/20100101 Firefox/89.0',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.1.1 Safari/605.1.15'
  ];
  
  return userAgents[Math.floor(Math.random() * userAgents.length)];
}
