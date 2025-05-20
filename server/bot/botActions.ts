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
    
    // Go to dashboard
    await page.goto('https://seller-uk.tiktok.com/product/dashboard', {
      waitUntil: 'networkidle2',
      timeout: 60000
    });
    
    await randomDelay(2000, 3000);
    
    // Click on the Target Collaboration section
    // Using the selector you provided
    await logFn('Locating Target Collaboration section...', 'Navigation', 'Pending');
    
    try {
      // Try the CSS selector first
      const targetCollaborationSelector = '#root > div > div.container > div > div > div.flex.justify-between.mb-21 > div:nth-child(2)';
      await page.waitForSelector(targetCollaborationSelector, { timeout: 10000 });
      await page.click(targetCollaborationSelector);
    } catch (error) {
      // If CSS selector fails, try XPath
      const targetCollaborationXPath = '/html/body/div[1]/div/div[2]/div/div/div[2]/div[2]';
      await page.waitForXPath(targetCollaborationXPath, { timeout: 10000 });
      const [targetElement] = await page.$x(targetCollaborationXPath);
      if (targetElement) {
        await targetElement.click();
      } else {
        throw new Error('Target collaboration element not found');
      }
    }
    
    await randomDelay(3000, 5000);
    
    // Wait for the new window to open with the affiliate invitation URL
    await logFn('Waiting for affiliate invitation page...', 'Navigation', 'Pending');
    const pages = await page.browser().pages();
    const affiliatePage = pages.find(p => 
      p.url().includes('affiliate.tiktok.com/connection/target-invitation')
    );
    
    if (!affiliatePage) {
      throw new Error('Affiliate invitation page not opened');
    }
    
    // Switch to the new page
    await logFn('Switching to affiliate invitation page...', 'Navigation', 'Pending');
    await affiliatePage.bringToFront();
    
    await randomDelay(2000, 3000);
    
    // Check if we're in the right place
    const isAffiliateCentre = await affiliatePage.evaluate(() => {
      return document.body.textContent?.includes('Target Invitation') || 
             document.body.textContent?.includes('Find creators');
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
    
    // Click on the Creators button to access filter options
    const creatorsButtonXPath = '//button[contains(@data-tid, "m4b_button") and .//span[text()="Creators"]]';
    
    try {
      await logFn('Clicking on Creators button...', 'Filter', 'Pending');
      await page.waitForXPath(creatorsButtonXPath, { timeout: 10000 });
      const [creatorsButton] = await page.$x(creatorsButtonXPath);
      if (creatorsButton) {
        await creatorsButton.click();
      } else {
        // Try the menu item instead
        const findCreatorsXPath = '//div[contains(@class, "m4b-menu-item-children") and text()="Find creators"]';
        const [findCreatorsElement] = await page.$x(findCreatorsXPath);
        if (findCreatorsElement) {
          await findCreatorsElement.click();
        } else {
          throw new Error('Could not find Creators button or menu item');
        }
      }
    } catch (error) {
      await logFn(`Failed to click Creators button: ${(error as Error).message}`, 'Filter', 'Error');
      // Try to continue even if this step fails
    }
    
    await randomDelay(2000, 3000);
    
    // Try to locate and click the filter button using the provided selector
    const filterButtonXPath = '/html/body/div[2]/div/div[2]/main/div/div/div/div/div[3]/div/div/div/div[2]/div[1]/div[1]/div[2]/div/label[1]/button';
    
    try {
      await logFn('Accessing filter options...', 'Filter', 'Pending');
      await page.waitForXPath(filterButtonXPath, { timeout: 10000 });
      const [filterButton] = await page.$x(filterButtonXPath);
      if (filterButton) {
        await filterButton.click();
        await logFn('Filter button clicked successfully', 'Filter', 'Success');
      } else {
        // Try a more general approach if the specific XPath fails
        const buttonText = 'Filter';
        const generalFilterXPath = `//button[contains(., '${buttonText}')]`;
        const [generalFilterButton] = await page.$x(generalFilterXPath);
        if (generalFilterButton) {
          await generalFilterButton.click();
          await logFn('General filter button clicked', 'Filter', 'Success');
        } else {
          throw new Error('Filter button not found');
        }
      }
    } catch (error) {
      await logFn(`Failed to click filter button: ${(error as Error).message}`, 'Filter', 'Error');
    }
    
    await randomDelay(2000, 3000);
    
    // Set follower range
    await logFn(`Setting follower range to ${filters.minFollowers}-${filters.maxFollowers}...`, 'Filter', 'Pending');
    
    try {
      // Find the Followers filter section
      const followersFilterXPath = "//div[contains(text(), 'Followers')]";
      await page.waitForXPath(followersFilterXPath, { timeout: 5000 });
      const [followersFilterElement] = await page.$x(followersFilterXPath);
      
      if (followersFilterElement) {
        await followersFilterElement.click();
        await randomDelay(1000, 2000);
        
        // Now try to find the min/max input fields
        const inputFields = await page.$$('input[placeholder*="Min"], input[placeholder*="Max"]');
        
        if (inputFields.length >= 2) {
          // Assume first is min, second is max
          const minInput = inputFields[0];
          const maxInput = inputFields[1];
          
          // Clear and set min followers
          await minInput.click({ clickCount: 3 }); // Select all text
          await minInput.type(filters.minFollowers.toString());
          
          await randomDelay(500, 1000);
          
          // Clear and set max followers
          await maxInput.click({ clickCount: 3 }); // Select all text
          await maxInput.type(filters.maxFollowers.toString());
          
          await logFn(`Set follower range: ${filters.minFollowers}-${filters.maxFollowers}`, 'Filter', 'Success');
        } else {
          await logFn('Could not find min/max follower input fields', 'Filter', 'Warning');
        }
      } else {
        await logFn('Could not find followers filter section', 'Filter', 'Warning');
      }
    } catch (error) {
      await logFn(`Error setting follower range: ${(error as Error).message}`, 'Filter', 'Error');
    }
    
    // Apply button after setting followers
    const applyButtonXPath = "//button[contains(text(), 'Apply') or contains(text(), 'Confirm') or contains(text(), 'OK')]";
    try {
      const [applyButton] = await page.$x(applyButtonXPath);
      if (applyButton) {
        await applyButton.click();
        await logFn('Applied follower filter', 'Filter', 'Success');
      }
    } catch (error) {
      await logFn(`Could not click apply button: ${(error as Error).message}`, 'Filter', 'Warning');
    }
    
    await randomDelay(2000, 3000);
    
    // Apply categories if specified
    if (filters.categories && filters.categories.length > 0) {
      await logFn(`Setting categories: ${filters.categories.join(', ')}...`, 'Filter', 'Pending');
      
      try {
        // Click on the Filter button again to open filters
        const [filterButton] = await page.$x(filterButtonXPath);
        if (filterButton) {
          await filterButton.click();
          await randomDelay(1000, 2000);
          
          // Find and click on category filter
          const categoryFilterXPath = "//div[contains(text(), 'Category')]";
          const [categoryFilter] = await page.$x(categoryFilterXPath);
          
          if (categoryFilter) {
            await categoryFilter.click();
            await randomDelay(1000, 2000);
            
            // For each category, try to find and click the corresponding checkbox
            for (const category of filters.categories) {
              const categoryXPath = `//span[contains(text(), '${category}')]`;
              try {
                const [categoryElement] = await page.$x(categoryXPath);
                if (categoryElement) {
                  await categoryElement.click();
                  await logFn(`Selected category: ${category}`, 'Filter', 'Success');
                }
              } catch (categoryError) {
                await logFn(`Could not select category ${category}`, 'Filter', 'Warning');
              }
              
              await randomDelay(500, 1000);
            }
            
            // Apply categories
            const [applyButton] = await page.$x(applyButtonXPath);
            if (applyButton) {
              await applyButton.click();
              await logFn('Applied category filters', 'Filter', 'Success');
            }
          } else {
            await logFn('Could not find category filter', 'Filter', 'Warning');
          }
        }
      } catch (error) {
        await logFn(`Error setting categories: ${(error as Error).message}`, 'Filter', 'Error');
      }
    }
    
    await randomDelay(3000, 5000);
    
    // Wait for creators to load in the table
    try {
      const creatorTableXPath = "//table//tbody/tr";
      await page.waitForXPath(creatorTableXPath, { timeout: 20000 });
      await logFn('Creator listing loaded successfully', 'Filter', 'Success');
    } catch (error) {
      await logFn(`Waiting for creator table timed out: ${(error as Error).message}`, 'Filter', 'Warning');
    }
    
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
        // Locate and click the "Invite" button for this creator
        const inviteButtonXPath = `//tbody/tr[contains(., '${creator.username}')]//button[contains(., 'Invite')]`;
        const firstRowInviteButtonXPath = `/html/body/div[2]/div/div[2]/main/div/div/div/div/div[5]/div/div/div/div[2]/div[2]/div/div/div/div/div/div[2]/table/tbody/tr[1]/td[7]/div/span/div/span/div/button`;
        
        let inviteButtonClicked = false;
        try {
          // First try with specific username
          await page.waitForXPath(inviteButtonXPath, { timeout: 5000 });
          const [inviteButton] = await page.$x(inviteButtonXPath);
          if (inviteButton) {
            await inviteButton.click();
            inviteButtonClicked = true;
          }
        } catch (error) {
          // If specific button fails, try the first row button (from your XPath)
          try {
            await page.waitForXPath(firstRowInviteButtonXPath, { timeout: 5000 });
            const [firstRowButton] = await page.$x(firstRowInviteButtonXPath);
            if (firstRowButton) {
              await firstRowButton.click();
              inviteButtonClicked = true;
            }
          } catch (firstRowError) {
            // If both approaches fail, try generic button selector
            const genericInviteXPath = `//button[contains(., 'Invite')]`;
            try {
              const [genericButton] = await page.$x(genericInviteXPath);
              if (genericButton) {
                await genericButton.click();
                inviteButtonClicked = true;
              }
            } catch (genericError) {
              throw new Error(`Could not find any invite button: ${genericError.message}`);
            }
          }
        }
        
        if (!inviteButtonClicked) {
          skipped++;
          await logFn(`Could not find invite button for creator: ${creator.username}`, 'Invite', 'Warning', { creator });
          continue;
        }
        
        await randomDelay(2000, 3000);
        
        // Fill in the invitation form with the message
        try {
          // Default message based on your requirements (power bank promotion)
          const defaultMessage = `Hi there!
We'd love for you to promote our top-selling power bank. It went viral on our main account @digi4u and it has been super popular since then- you probably already came across it! 
This is a fantastic opportunity to get more exposure with the new link from our fresh account as it isn't saturated yet. Additionally, you'll earn a 10% commission on every sale. Please free to request a free sample!`;
          
          // Find the message textarea
          const textareaXPath = `//textarea`;
          await page.waitForXPath(textareaXPath, { timeout: 5000 });
          const [textarea] = await page.$x(textareaXPath);
          
          if (textarea) {
            // Clear existing text and type our message
            await textarea.click({ clickCount: 3 }); // Select all text
            await textarea.type(defaultMessage);
            await logFn(`Filled invitation message for ${creator.username}`, 'Invite', 'Success');
          }
        } catch (messageError) {
          await logFn(`Warning: Could not fill message: ${messageError.message}`, 'Invite', 'Warning');
          // Continue anyway as this might not be critical
        }
        
        await randomDelay(1000, 2000);
        
        // Select commission options if needed
        try {
          const radioButtonXPath = `//label[contains(@class, 'arco-radio')]`;
          const [radioButton] = await page.$x(radioButtonXPath);
          if (radioButton) {
            await radioButton.click();
            await logFn(`Selected commission option`, 'Invite', 'Success');
          }
        } catch (radioError) {
          // Not critical if this fails
        }
        
        await randomDelay(1000, 2000);
        
        // Click the final "Create Invitation" button
        const createInvitationXPath = `/html/body/div[18]/div[2]/div/div[2]/div[2]`;
        const genericCreateXPath = `//button[contains(., 'Create') or contains(., 'Send') or contains(., 'Invite') or contains(., 'Confirm')]`;
        
        let invitationCreated = false;
        try {
          // First try with specific XPath
          const [createButton] = await page.$x(createInvitationXPath);
          if (createButton) {
            await createButton.click();
            invitationCreated = true;
          } 
        } catch (error) {
          // Try generic button
          try {
            const [genericButton] = await page.$x(genericCreateXPath);
            if (genericButton) {
              await genericButton.click();
              invitationCreated = true;
            }
          } catch (genericError) {
            throw new Error(`Could not find create invitation button: ${genericError.message}`);
          }
        }
        
        if (invitationCreated) {
          invited++;
          creator.invited = true;
          
          await logFn(`Successfully invited creator: ${creator.username}`, 'Invite', 'Success', { creator });
          
          // Handle any confirmation dialogs
          await randomDelay(1000, 2000);
          try {
            const confirmButtonXPath = `//button[contains(., 'OK') or contains(., 'Confirm') or contains(., 'Got it')]`;
            const [confirmButton] = await page.$x(confirmButtonXPath);
            if (confirmButton) {
              await confirmButton.click();
            }
          } catch (confirmError) {
            // Not critical if no confirmation dialog
          }
        } else {
          failed++;
          await logFn(`Failed to create invitation for creator: ${creator.username}`, 'Invite', 'Error', { creator });
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
