import { Router } from 'express';
import { Request, Response } from 'express';
import { tiktokBot } from '../bot/tiktokBotInstance'; // Make sure to export your TikTokBot from somewhere, e.g. tiktokBotInstance.ts

const router = Router();

/**
 * POST /api/bot/manual-login
 * Initiates manual login in a visible (non-headless) Puppeteer browser
 */
router.post('/manual-login', async (req: Request, res: Response) => {
  try {
    const success = await tiktokBot.startManualLogin();
    if (success) {
      return res.status(200).json({ message: 'Manual login completed successfully' });
    } else {
      return res.status(500).json({ error: 'Manual login failed or was cancelled' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

/**
 * POST /api/bot/start
 * Attempts to start the bot in headless mode using the saved session
 */
router.post('/start', async (req: Request, res: Response) => {
  try {
    const started = await tiktokBot.start();
    if (started) {
      return res.status(200).json({ message: 'Bot started successfully' });
    } else {
      return res.status(500).json({ error: 'Failed to start the bot' });
    }
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

/**
 * POST /api/bot/stop
 * Stops the bot, closes the browser, and cleans up
 */
router.post('/stop', async (req: Request, res: Response) => {
  try {
    await tiktokBot.stop();
    return res.status(200).json({ message: 'Bot stopped successfully' });
  } catch (err: any) {
    return res.status(500).json({ error: err.message || 'Unknown error' });
  }
});

export default router;
