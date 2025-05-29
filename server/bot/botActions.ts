import { Page } from 'puppeteer';
import { Creator } from '../../shared/schema';

interface FilterOptions {
  minFollowers: number;
  maxFollowers: number;
  categories: string[];
}

export async function login(page: Page, credentials: { email: string; password: string }): Promise<void> {
  try {
    await page.goto('https://www.tiktok.com/login', { waitUntil: 'networkidle0' });
    
    // Fill in login form
    await page.type('input[name="email"]', credentials.email);
    await page.type('input[name="password"]', credentials.password);
    
    // Click login button and wait for navigation
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('button[type="submit"]')
    ]);
  } catch (error) {
    throw new Error(`Login failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

const SELLER_BASE_URL = process.env.SELLER_BASE_URL || 'https://seller.tiktok.com';

export async function navigateToAffiliateCenter(page: Page): Promise<void> {
  try {
    await page.goto(`${SELLER_BASE_URL}/homepage`, { waitUntil: 'networkidle0' });
    
    // Navigate to affiliate section
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle0' }),
      page.click('a[href*="affiliate"]')
    ]);
  } catch (error) {
    throw new Error(`Navigation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function applyFilters(page: Page, options: FilterOptions): Promise<void> {
  try {
    // Open filters modal
    await page.click('button[data-e2e="filter-button"]');
    await page.waitForSelector('.filter-modal', { visible: true });
    
    // Set follower range
    await page.type('input[name="min-followers"]', options.minFollowers.toString());
    await page.type('input[name="max-followers"]', options.maxFollowers.toString());
    
    // Select categories
    for (const category of options.categories) {
      await page.click(`label[data-value="${category}"]`);
    }
    
    // Apply filters and wait for results
    await Promise.all([
      page.waitForSelector('.loading-indicator', { hidden: true }),
      page.click('button[type="submit"]')
    ]);
  } catch (error) {
    throw new Error(`Filter application failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function extractCreatorInfo(page: Page): Promise<Creator[]> {
  try {
    return await page.evaluate(() => {
      const creators: Creator[] = [];
      const creatorElements = document.querySelectorAll('.creator-card');
      
      creatorElements.forEach((element) => {
        const username = element.querySelector('.username')?.textContent || '';
        const followersText = element.querySelector('.followers')?.textContent || '0';
        const followers = parseInt(followersText.replace(/[^0-9]/g, ''));
        
        creators.push({
          username,
          followers,
          invited: false
        });
      });
      
      return creators;
    });
  } catch (error) {
    throw new Error(`Creator info extraction failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

export async function inviteCreators(page: Page, creators: Creator[], limit: number): Promise<void> {
  let invitedCount = 0;
  
  for (const creator of creators) {
    if (invitedCount >= limit) break;
    
    try {
      // Click invite button for creator
      await page.click(`button[data-creator-id="${creator.username}"]`);
      
      // Wait for invitation confirmation
      await page.waitForSelector('.invitation-sent-message', { timeout: 5000 });
      
      invitedCount++;
      
      // Add delay between invites
      await page.evaluate(() => new Promise(resolve => setTimeout(resolve, 2000)));
    } catch (error) {
      console.error(`Failed to invite creator ${creator.username}:`, error);
      // Continue with next creator even if one fails
    }
  }
}

export async function handleCaptcha(page: Page): Promise<boolean> {
  try {
    const captchaFrame = await page.waitForSelector('iframe[title*="captcha"]', { timeout: 5000 });
    if (!captchaFrame) return false;

    const frame = await captchaFrame.contentFrame();
    if (!frame) return false;

    // Wait for captcha to be solved
    await frame.waitForSelector('.captcha-success', { timeout: 30000 });
    return true;
  } catch (error) {
    console.error('Captcha handling failed:', error);
    return false;
  }
}
