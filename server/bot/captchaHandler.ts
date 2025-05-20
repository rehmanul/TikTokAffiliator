import { Page } from 'puppeteer';
import { randomDelay } from './sessionManager';
import { LogFunction } from './botActions';

export async function handleCaptcha(page: Page, logFn: LogFunction): Promise<boolean> {
  try {
    await logFn('Attempting to handle verification/captcha...', 'Verification', 'Pending');
    
    // Check for different types of verification
    const verificationType = await detectVerificationType(page);
    
    switch (verificationType) {
      case 'code':
        return await handleVerificationCode(page, logFn);
      case 'slider':
        return await handleSliderCaptcha(page, logFn);
      case 'image':
        return await handleImageCaptcha(page, logFn);
      case 'none':
        await logFn('No verification method detected, proceeding...', 'Verification', 'Success');
        return true;
      default:
        throw new Error('Unknown verification type');
    }
  } catch (error) {
    await logFn(`Captcha handling error: ${(error as Error).message}`, 'Verification', 'Error', { error: (error as Error).message });
    return false;
  }
}

async function detectVerificationType(page: Page): Promise<'code' | 'slider' | 'image' | 'none'> {
  // Check for verification code input
  const hasCodeInput = await page.evaluate(() => {
    return !!document.querySelector('input[placeholder*="verification" i], input[placeholder*="code" i]');
  });
  
  if (hasCodeInput) return 'code';
  
  // Check for slider captcha
  const hasSlider = await page.evaluate(() => {
    return !!document.querySelector('div[class*="slider" i], div[class*="drag" i]');
  });
  
  if (hasSlider) return 'slider';
  
  // Check for image captcha
  const hasImageCaptcha = await page.evaluate(() => {
    return !!document.querySelector('div[class*="captcha" i] img, img[class*="captcha" i]');
  });
  
  if (hasImageCaptcha) return 'image';
  
  return 'none';
}

async function handleVerificationCode(page: Page, logFn: LogFunction): Promise<boolean> {
  await logFn('Verification code detected, checking for code...', 'Verification', 'Pending');
  
  // In a real implementation, this would:
  // 1. Check email/SMS for verification code
  // 2. Extract code from message
  // 3. Input code into the field
  
  // For this demo, we'll simulate input of the verification code
  // In a production implementation, this would need to be replaced with actual code
  
  // Simulated verification code for demonstration
  const simulatedCode = '639678';
  
  await logFn(`Entering verification code: ${simulatedCode}`, 'Verification', 'Pending');
  
  // Find verification code input field
  const codeInputFound = await page.evaluate((code) => {
    const inputs = Array.from(document.querySelectorAll('input'));
    const codeInput = inputs.find(input => 
      input.placeholder?.toLowerCase().includes('verification') || 
      input.placeholder?.toLowerCase().includes('code') ||
      input.type === 'tel'  // Often used for verification code inputs
    );
    
    if (codeInput) {
      // Clear the input
      codeInput.value = '';
      codeInput.dispatchEvent(new Event('input', { bubbles: true }));
      
      // Type the code with small delays between characters
      for (let i = 0; i < code.length; i++) {
        setTimeout(() => {
          codeInput.value += code[i];
          codeInput.dispatchEvent(new Event('input', { bubbles: true }));
          
          if (i === code.length - 1) {
            codeInput.dispatchEvent(new Event('change', { bubbles: true }));
          }
        }, i * 100);
      }
      
      return true;
    }
    
    return false;
  }, simulatedCode);
  
  if (!codeInputFound) {
    await logFn('Could not find verification code input field', 'Verification', 'Error');
    return false;
  }
  
  await randomDelay(1000, 2000);
  
  // Click the submit/verify button
  const submitResult = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const submitButton = buttons.find(button => 
      button.textContent?.toLowerCase().includes('submit') || 
      button.textContent?.toLowerCase().includes('verify') ||
      button.textContent?.toLowerCase().includes('confirm')
    );
    
    if (submitButton) {
      submitButton.click();
      return true;
    }
    
    return false;
  });
  
  if (!submitResult) {
    await logFn('Could not find submit button for verification code', 'Verification', 'Error');
    return false;
  }
  
  // Wait for navigation or success indication
  try {
    await page.waitForNavigation({ timeout: 15000 });
    await logFn('Verification code accepted, proceeding...', 'Verification', 'Success');
    return true;
  } catch (error) {
    // Check if we're still on the verification page
    const stillOnVerification = await page.evaluate(() => {
      return !!document.querySelector('input[placeholder*="verification" i], input[placeholder*="code" i]');
    });
    
    if (stillOnVerification) {
      await logFn('Verification code seems to be incorrect', 'Verification', 'Error');
      return false;
    } else {
      // We might have successfully verified without a page navigation
      await logFn('Verification appears successful', 'Verification', 'Success');
      return true;
    }
  }
}

async function handleSliderCaptcha(page: Page, logFn: LogFunction): Promise<boolean> {
  await logFn('Slider captcha detected, attempting to solve...', 'Verification', 'Pending');
  
  // This would require a more complex implementation to:
  // 1. Identify the slider element
  // 2. Calculate the distance to move
  // 3. Perform mouse actions to mimic human-like slider movement
  
  // For demonstration purposes, we'll simulate a simplified slider interaction
  const sliderSolved = await page.evaluate(() => {
    const sliderHandle = document.querySelector('div[class*="slider" i] span, div[class*="drag" i] span');
    const sliderTrack = document.querySelector('div[class*="slider" i], div[class*="drag" i]');
    
    if (sliderHandle && sliderTrack) {
      // Get slider dimensions
      const handleRect = sliderHandle.getBoundingClientRect();
      const trackRect = sliderTrack.getBoundingClientRect();
      
      // Calculate target position (end of track)
      const startX = handleRect.left + handleRect.width / 2;
      const startY = handleRect.top + handleRect.height / 2;
      const endX = trackRect.right - 10; // Leave a small margin
      const endY = startY;
      
      // Simulate events for slider drag
      // Mouse down on handle
      sliderHandle.dispatchEvent(new MouseEvent('mousedown', {
        bubbles: true,
        clientX: startX,
        clientY: startY
      }));
      
      // Mouse move to end position
      document.dispatchEvent(new MouseEvent('mousemove', {
        bubbles: true,
        clientX: endX,
        clientY: endY
      }));
      
      // Mouse up at end position
      document.dispatchEvent(new MouseEvent('mouseup', {
        bubbles: true,
        clientX: endX,
        clientY: endY
      }));
      
      return true;
    }
    
    return false;
  });
  
  if (!sliderSolved) {
    await logFn('Could not locate slider elements', 'Verification', 'Error');
    return false;
  }
  
  // Wait to see if the slider captcha is accepted
  await randomDelay(2000, 4000);
  
  // Check if captcha is still present
  const captchaStillPresent = await page.evaluate(() => {
    return !!document.querySelector('div[class*="slider" i], div[class*="drag" i]');
  });
  
  if (captchaStillPresent) {
    await logFn('Slider captcha still present after attempt, may have failed', 'Verification', 'Warning');
    return false;
  } else {
    await logFn('Slider captcha appears to be solved', 'Verification', 'Success');
    return true;
  }
}

async function handleImageCaptcha(page: Page, logFn: LogFunction): Promise<boolean> {
  await logFn('Image captcha detected, this requires manual intervention', 'Verification', 'Warning');
  
  // In a real implementation, this would integrate with a captcha solving service
  // or notify the user to manually solve the captcha
  
  // For this demo, we'll indicate that manual intervention is needed
  await logFn('Image captchas require integration with a captcha solving service', 'Verification', 'Warning');
  
  // Wait for a reasonable time to simulate captcha solving
  await randomDelay(5000, 10000);
  
  // Check if captcha is still present
  const captchaStillPresent = await page.evaluate(() => {
    return !!document.querySelector('div[class*="captcha" i] img, img[class*="captcha" i]');
  });
  
  if (captchaStillPresent) {
    await logFn('Image captcha still present, manual intervention required', 'Verification', 'Error');
    return false;
  } else {
    await logFn('Image captcha no longer present, proceeding', 'Verification', 'Success');
    return true;
  }
}
