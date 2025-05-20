import { Page } from 'puppeteer';
import { Creator } from '@shared/schema';
import { randomDelay } from './sessionManager';

export type LogFunction = (message: string, type?: string, status?: string, details?: any) => Promise<void>;

export async function login(
  page: Page, 
  email: string, 
  password: string,
  logFn: LogFunction
): Promise<boolean> {
  try {
    await logFn('Navigating to TikTok Shop login page...', 'Login', 'Pending');
    
    // Navigate to login page
    await page.goto('https://seller-us.tiktok.com/account/login', { waitUntil: 'networkidle2' });
    
    await randomDelay(1000, 2000);
    
    await logFn('Login page loaded, entering credentials...', 'Login', 'Pending');
    
    // Enter email
    await page.type('input[name="email"]', email, { delay: 30 });
    
    await randomDelay(500, 1000);
    
    // Enter password
    await page.type('input[type="password"]', password, { delay: 30 });
    
    await randomDelay(500, 1000);
    
    // Check "Remember me" checkbox if it exists
    const rememberMeCheckbox = await page.$('input[type="checkbox"]');
    if (rememberMeCheckbox) {
      await rememberMeCheckbox.click();
    }
    
    await randomDelay(500, 1000);
    
    // Click login button
    await Promise.all([
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 60000 }),
      page.click('button[type="submit"]')
    ]);
    
    // Check if we're logged in
    const isLoggedIn = await page.evaluate(() => {
      return !document.querySelector('input[name="email"]');
    });
    
    if (isLoggedIn) {
      await logFn('Login successful', 'Login', 'Success');
      return true;
    } else {
      await logFn('Login failed', 'Login', 'Error');
      return false;
    }
  } catch (error) {
    await logFn(`Login error: ${(error as Error).message}`, 'Login', 'Error', { error: (error as Error).message });
    throw error;
  }
}

export async function checkVerificationRequired(page: Page): Promise<boolean> {
  try {
    // Check if verification code input is present
    const verificationInput = await page.$('input[placeholder*="verification" i]');
    
    // Check if captcha element is present
    const captchaElement = await page.$('div[class*="captcha" i]');
    
    // Check if any verification message is present
    const verificationMessage = await page.evaluate(() => {
      const elements = document.querySelectorAll('div, p, span');
      for (const el of elements) {
        const text = el.textContent?.toLowerCase() || '';
        if (text.includes('verification') || text.includes('captcha') || text.includes('security check')) {
          return true;
        }
      }
      return false;
    });
    
    return !!(verificationInput || captchaElement || verificationMessage);
  } catch (error) {
    console.error('Error checking verification:', error);
    return false;
  }
}

export async function navigateToAffiliateCenter(page: Page, logFn: LogFunction): Promise<boolean> {
  try {
    await logFn('Navigating to Affiliate Centre...', 'Navigation', 'Pending');
    
    // Go to Affiliate Centre
    await page.goto('https://affiliate.tiktok.com/product/open-collaboration/shop_region=GB', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    await randomDelay(2000, 3000);
    
    // Check if we're in the right place
    const isAffiliateCentre = await page.evaluate(() => {
      return document.body.textContent?.includes('Affiliate Centre') || 
             document.body.textContent?.includes('Affiliate Center');
    });
    
    if (!isAffiliateCentre) {
      await logFn('Failed to navigate to Affiliate Centre', 'Navigation', 'Error');
      return false;
    }
    
    await logFn('Successfully navigated to Affiliate Centre', 'Navigation', 'Success');
    
    // Click on "Discover creators" in the sidebar
    await logFn('Navigating to Find Creators section...', 'Navigation', 'Pending');
    
    // Find and click on Discover creators section
    await page.evaluate(() => {
      const links = Array.from(document.querySelectorAll('a'));
      const discoverLink = links.find(link => 
        link.textContent?.includes('Discover creators') || 
        link.textContent?.includes('Find creators')
      );
      
      if (discoverLink) {
        discoverLink.click();
        return true;
      }
      return false;
    });
    
    await page.waitForNavigation({ waitUntil: 'networkidle2' });
    await randomDelay(2000, 3000);
    
    // Check if we're in Find creators section
    const isFindCreators = await page.evaluate(() => {
      return document.body.textContent?.includes('Find creators');
    });
    
    if (!isFindCreators) {
      await logFn('Failed to navigate to Find Creators section', 'Navigation', 'Error');
      return false;
    }
    
    await logFn('Successfully navigated to Find Creators section', 'Navigation', 'Success');
    return true;
  } catch (error) {
    await logFn(`Navigation error: ${(error as Error).message}`, 'Navigation', 'Error', { error: (error as Error).message });
    return false;
  }
}

export async function applyFilters(
  page: Page, 
  filters: { 
    minFollowers: number,
    maxFollowers: number,
    categories: string[]
  },
  logFn: LogFunction
): Promise<Creator[]> {
  try {
    await logFn(`Applying filters: ${filters.minFollowers}-${filters.maxFollowers} followers, ${filters.categories.join(', ')}`, 'Filter', 'Pending');
    
    // Click on Followers tab
    await page.evaluate(() => {
      const tabs = Array.from(document.querySelectorAll('button, div[role="tab"]'));
      const followersTab = tabs.find(tab => tab.textContent?.includes('Followers'));
      if (followersTab) {
        (followersTab as HTMLElement).click();
        return true;
      }
      return false;
    });
    
    await randomDelay(1000, 2000);
    
    // Set follower range
    await page.evaluate((min, max) => {
      // Try to find follower count filter button
      const filterButtons = Array.from(document.querySelectorAll('button, div[role="button"]'));
      const followerButton = filterButtons.find(button => 
        button.textContent?.toLowerCase().includes('follower') || 
        button.textContent?.toLowerCase().includes('following')
      );
      
      if (followerButton) {
        (followerButton as HTMLElement).click();
      }
      
      // Try to find min/max follower inputs
      setTimeout(() => {
        const inputs = Array.from(document.querySelectorAll('input[type="number"]'));
        if (inputs.length >= 2) {
          // Assume first is min, second is max
          const minInput = inputs[0];
          const maxInput = inputs[1];
          
          // Clear and set min
          minInput.value = '';
          minInput.dispatchEvent(new Event('input', { bubbles: true }));
          minInput.value = min.toString();
          minInput.dispatchEvent(new Event('input', { bubbles: true }));
          minInput.dispatchEvent(new Event('change', { bubbles: true }));
          
          // Clear and set max
          maxInput.value = '';
          maxInput.dispatchEvent(new Event('input', { bubbles: true }));
          maxInput.value = max.toString();
          maxInput.dispatchEvent(new Event('input', { bubbles: true }));
          maxInput.dispatchEvent(new Event('change', { bubbles: true }));
        }
      }, 500);
      
    }, filters.minFollowers, filters.maxFollowers);
    
    await randomDelay(2000, 3000);
    
    // Apply categories if needed
    if (filters.categories.length > 0) {
      await logFn(`Applying category filters: ${filters.categories.join(', ')}`, 'Filter', 'Pending');
      
      for (const category of filters.categories) {
        await page.evaluate((categoryName) => {
          // Try to find category filter button
          const filterButtons = Array.from(document.querySelectorAll('button, div[role="button"]'));
          const categoryButton = filterButtons.find(button => 
            button.textContent?.toLowerCase().includes('category') || 
            button.textContent?.toLowerCase().includes('product')
          );
          
          if (categoryButton) {
            (categoryButton as HTMLElement).click();
            
            // Wait for dropdown to appear
            setTimeout(() => {
              // Try to find the specific category checkbox
              const checkboxes = Array.from(document.querySelectorAll('input[type="checkbox"]'));
              for (const checkbox of checkboxes) {
                const label = checkbox.parentElement?.textContent;
                if (label && label.includes(categoryName)) {
                  (checkbox as HTMLElement).click();
                  break;
                }
              }
            }, 500);
          }
        }, category);
        
        await randomDelay(1000, 2000);
      }
    }
    
    // Wait for creators to load
    await page.waitForFunction(() => {
      const elements = document.querySelectorAll('tr, div[role="row"]');
      return elements.length > 2; // Assuming header row
    }, { timeout: 30000 });
    
    await randomDelay(2000, 3000);
    
    // Scrape the creators from the table
    const creators = await page.evaluate(() => {
      const results: Creator[] = [];
      
      // Try to find rows in the table or grid
      const rows = Array.from(document.querySelectorAll('tr, div[role="row"]')).slice(1); // Skip header
      
      for (const row of rows) {
        const cells = Array.from(row.querySelectorAll('td, div[role="cell"]'));
        if (cells.length > 3) {
          // Extract creator details from cells
          let username = '';
          let displayName = '';
          let category = '';
          let followers = 0;
          let earnings = '';
          let engagement = '';
          
          // Username is usually in the first column with an image
          const usernameCell = cells[0];
          username = usernameCell.textContent?.trim() || '';
          
          // Look for @ symbol to identify username
          const atMatch = username.match(/@([a-zA-Z0-9_]+)/);
          if (atMatch) {
            username = atMatch[1];
          }
          
          // Try to get display name
          displayName = usernameCell.querySelector('div')?.textContent?.trim() || '';
          
          // Category might be in a dedicated cell or with an icon
          const categoryElements = Array.from(cells).find(cell => {
            return cell.textContent?.includes('Sports') || 
                  cell.textContent?.includes('Fashion') ||
                  cell.textContent?.includes('Electronics') ||
                  cell.textContent?.includes('Home');
          });
          category = categoryElements?.textContent?.trim() || '';
          
          // Followers typically has K, M suffix
          const followersText = Array.from(cells).find(cell => {
            const text = cell.textContent || '';
            return text.includes('K') || text.includes('M') || /[0-9]+(\.[0-9]+)?[KkMm]/.test(text);
          })?.textContent?.trim() || '';
          
          if (followersText) {
            const numMatch = followersText.match(/([0-9]+(\.[0-9]+)?)[KkMm]?/);
            if (numMatch) {
              const num = parseFloat(numMatch[1]);
              if (followersText.toUpperCase().includes('K')) {
                followers = Math.round(num * 1000);
              } else if (followersText.toUpperCase().includes('M')) {
                followers = Math.round(num * 1000000);
              } else {
                followers = num;
              }
            }
          }
          
          // Earnings may have currency symbol
          earnings = Array.from(cells).find(cell => {
            const text = cell.textContent || '';
            return text.includes('£') || text.includes('$') || text.includes('€');
          })?.textContent?.trim() || '';
          
          // Engagement rate usually has % symbol
          engagement = Array.from(cells).find(cell => {
            const text = cell.textContent || '';
            return text.includes('%');
          })?.textContent?.trim() || '';
          
          if (username) {
            results.push({
              username,
              displayName: displayName !== username ? displayName : undefined,
              category: category || undefined,
              followers,
              earnings: earnings || undefined,
              engagement: engagement || undefined,
              invited: false
            });
          }
        }
      }
      
      return results;
    });
    
    await logFn(`Found ${creators.length} creators matching the criteria`, 'Filter', 'Success');
    return creators;
  } catch (error) {
    await logFn(`Filter error: ${(error as Error).message}`, 'Filter', 'Error', { error: (error as Error).message });
    return [];
  }
}

export async function inviteCreators(
  page: Page,
  creators: Creator[],
  limit: number,
  actionDelay: number,
  stopRequested: boolean,
  logFn: LogFunction
): Promise<{ invited: number, failed: number, skipped: number, successRate: number }> {
  let invited = 0;
  let failed = 0;
  let skipped = 0;
  
  try {
    await logFn(`Starting to invite up to ${limit} creators`, 'Invite', 'Pending');
    
    // Limit to maximum number of invites
    const creatorsToInvite = limit > 0 ? creators.slice(0, limit) : creators;
    
    for (let i = 0; i < creatorsToInvite.length; i++) {
      // Check if stop was requested
      if (stopRequested) {
        await logFn('Invitation process stopped by user request', 'Invite', 'Info');
        break;
      }
      
      const creator = creatorsToInvite[i];
      
      await logFn(`Attempting to invite creator: ${creator.username}`, 'Invite', 'Pending');
      
      try {
        // Find and click invite button for this creator
        const inviteSuccess = await page.evaluate((creatorUsername) => {
          const rows = Array.from(document.querySelectorAll('tr, div[role="row"]')).slice(1); // Skip header
          
          for (const row of rows) {
            const usernameCell = row.querySelector('td, div[role="cell"]');
            if (usernameCell && usernameCell.textContent?.includes(creatorUsername)) {
              // Found the row for this creator
              const inviteButton = row.querySelector('button');
              if (inviteButton && inviteButton.textContent?.includes('Invite')) {
                inviteButton.click();
                return true;
              }
            }
          }
          
          return false;
        }, creator.username);
        
        if (inviteSuccess) {
          await randomDelay(actionDelay * 0.5, actionDelay * 1.5);
          
          // Confirm any prompts if needed
          const confirmPrompt = await page.evaluate(() => {
            const confirmButton = Array.from(document.querySelectorAll('button')).find(
              button => button.textContent?.includes('Confirm') || button.textContent?.includes('OK')
            );
            
            if (confirmButton) {
              confirmButton.click();
              return true;
            }
            
            return false;
          });
          
          invited++;
          creator.invited = true;
          
          await logFn(
            `Successfully invited creator: ${creator.username}${confirmPrompt ? ' (confirmation dialog accepted)' : ''}`, 
            'Invite', 
            'Success', 
            { creator }
          );
        } else {
          skipped++;
          await logFn(
            `Could not find invite button for creator: ${creator.username}`, 
            'Invite', 
            'Warning', 
            { creator }
          );
        }
      } catch (error) {
        failed++;
        await logFn(
          `Failed to invite creator ${creator.username}: ${(error as Error).message}`, 
          'Invite', 
          'Error', 
          { error: (error as Error).message, creator }
        );
      }
      
      // Random delay between invitations to look more human
      await randomDelay(actionDelay * 0.8, actionDelay * 1.2);
    }
    
    const total = invited + failed;
    const successRate = total > 0 ? Math.round((invited / total) * 100) : 0;
    
    await logFn(
      `Invitation process completed. Invited: ${invited}, Failed: ${failed}, Skipped: ${skipped}, Success rate: ${successRate}%`, 
      'Invite', 
      'Success', 
      { invited, failed, skipped, successRate }
    );
    
    return { invited, failed, skipped, successRate };
  } catch (error) {
    await logFn(
      `Invitation process error: ${(error as Error).message}`, 
      'Invite', 
      'Error', 
      { error: (error as Error).message }
    );
    
    return { invited, failed, skipped, successRate: 0 };
  }
}
