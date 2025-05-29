import crypto from 'crypto';
import { Page } from 'puppeteer';

const ENCRYPTION_KEY = process.env.SESSION_ENCRYPTION_KEY || 'your-fallback-encryption-key';
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours
const SELLER_BASE_URL = process.env.SELLER_BASE_URL || 'https://seller.tiktok.com';

interface EncryptedSession {
  data: string;
  iv: string;
}

interface SessionData {
  cookies: any[];
  localStorage: Record<string, string>;
  sessionStorage: Record<string, string>;
  timestamp: number;
  userAgent: string;
}

export function encryptSession(session: SessionData): EncryptedSession {
  const iv = crypto.randomBytes(16);
  const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(ENCRYPTION_KEY), iv);
  
  const encrypted = Buffer.concat([
    cipher.update(JSON.stringify(session), 'utf8'),
    cipher.final()
  ]);

  return {
    data: encrypted.toString('base64'),
    iv: iv.toString('base64')
  };
}

export function decryptSession(encrypted: EncryptedSession): SessionData {
  const decipher = crypto.createDecipheriv(
    'aes-256-gcm',
    Buffer.from(ENCRYPTION_KEY),
    Buffer.from(encrypted.iv, 'base64')
  );

  const decrypted = Buffer.concat([
    decipher.update(Buffer.from(encrypted.data, 'base64')),
    decipher.final()
  ]);

  return JSON.parse(decrypted.toString('utf8'));
}

export function isSessionValid(session: SessionData): boolean {
  if (!session || !session.timestamp) return false;
  
  const age = Date.now() - session.timestamp;
  return age < SESSION_EXPIRY;
}

export async function validateAndRefreshSession(page: Page, session: SessionData): Promise<boolean> {
  try {
    if (!isSessionValid(session)) {
      return false;
    }

    // Test session by making a simple request
    await page.goto(`${SELLER_BASE_URL}/api/v1/user/info`, {
      waitUntil: 'networkidle0'
    });

    const response = await page.evaluate(() => {
      return fetch(`${SELLER_BASE_URL}/api/v1/user/info`).then(r => r.json());
    });

    if (response.code !== 0) {
      return false;
    }

    return true;
  } catch (error) {
    console.error('Session validation failed:', error);
    return false;
  }
}

export async function refreshSession(page: Page): Promise<SessionData | null> {
  try {
    // Get fresh cookies
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

    const userAgent = await page.evaluate(() => navigator.userAgent);
    
    return {
      cookies,
      localStorage,
      sessionStorage,
      timestamp: Date.now(),
      userAgent
    };
  } catch (error) {
    console.error('Session refresh failed:', error);
    return null;
  }
}
