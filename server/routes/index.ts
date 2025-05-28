import express, { Request, Response, type Application } from "express";
import { createServer, type Server } from "http";
import { storage } from "../storage/storage-impl";
import { TikTokBot } from "../bot/tiktokBot";
import { z } from "zod";
import { BotConfigSchema } from "../../shared/schema";

// Initialize the bot instance used in production
const defaultBot = new TikTokBot(storage);
export async function registerRoutes(app: Application, botInstance: TikTokBot = defaultBot): Promise<Server> {
  // Create API router
  const apiRouter = express.Router();
  
  // Get bot status
  apiRouter.get("/status", async (_req: Request, res: Response) => {
    try {
      const status = await storage.getBotStatus();
      const botInstanceStatus = await botInstance.getStatus();
      
      res.json({
        ...status,
        ...botInstanceStatus
      });
    } catch (error) {
      res.status(500).json({ message: `Failed to get bot status: ${(error as Error).message}` });
    }
  });
  
  // Manual login to capture a session
  apiRouter.post("/manual-login", async (_req: Request, res: Response) => {
    try {
      const success = await botInstance.startManualLogin();
      if (success) {
        return res.json({ message: "Manual login completed successfully" });
      }
      return res.status(500).json({ error: "Manual login failed or was cancelled" });
    } catch (err: any) {
      return res.status(500).json({ error: err.message || "Unknown error" });
    }
  });

  // Start the bot
  apiRouter.post("/start", async (_req: Request, res: Response) => {
    try {
      // Check if bot is already running
      const status = await storage.getBotStatus();
      if (status?.status === "running") {
        return res.status(400).json({ message: "Bot is already running" });
      }
      
      // Start the bot
        const success = await botInstance.start();
      
      if (success) {
        res.json({ message: "Bot started successfully" });
      } else {
        res.status(500).json({ message: "Failed to start bot" });
      }
    } catch (error) {
      res.status(500).json({ message: `Failed to start bot: ${(error as Error).message}` });
    }
  });
  
  // Stop the bot
  apiRouter.post("/stop", async (_req: Request, res: Response) => {
    try {
      await botInstance.stop();
      res.json({ message: "Bot stopped successfully" });
    } catch (error) {
      res.status(500).json({ message: `Failed to stop bot: ${(error as Error).message}` });
    }
  });
  
  // Get bot configuration
  apiRouter.get("/config", async (_req: Request, res: Response) => {
    try {
      const config = await storage.getBotConfig();
      res.json(config);
    } catch (error) {
      res.status(500).json({ message: `Failed to get bot configuration: ${(error as Error).message}` });
    }
  });
  
  // Update bot configuration
  apiRouter.post("/config", async (req: Request, res: Response) => {
    try {
      // Validate request body
      const configData = BotConfigSchema.parse(req.body);
      
      // Update config
      await storage.updateBotConfig(configData);
      
      res.json({ message: "Bot configuration updated" });
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid configuration data", errors: error.errors });
      } else {
        res.status(500).json({ message: `Failed to update bot configuration: ${(error as Error).message}` });
      }
    }
  });
  
  // Get activity logs
  apiRouter.get("/logs", async (req: Request, res: Response) => {
    try {
      const page = req.query.page ? parseInt(req.query.page as string, 10) : 1;
      const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : 10;
      const type = req.query.type as string | undefined;
      
      const logs = await storage.getActivityLogs(page, limit, type);
      res.json(logs);
    } catch (error) {
      res.status(500).json({ message: `Failed to get activity logs: ${(error as Error).message}` });
    }
  });
  
  // Clear activity logs
  apiRouter.delete("/logs", async (_req: Request, res: Response) => {
    try {
      await storage.clearActivityLogs();
      res.json({ message: "Activity logs cleared successfully" });
    } catch (error) {
      res.status(500).json({ message: `Failed to clear activity logs: ${(error as Error).message}` });
    }
  });
  
  // Get creators
  apiRouter.get("/creators", async (_req: Request, res: Response) => {
    try {
      const creators = await storage.getCreators();
      res.json(creators);
    } catch (error) {
      res.status(500).json({ message: `Failed to get creators: ${(error as Error).message}` });
    }
  });
  
  // Submit verification code
  apiRouter.post("/verification", async (req: Request, res: Response) => {
    try {
      const { code } = req.body;
      
      if (!code) {
        return res.status(400).json({ message: "Verification code is required" });
      }
      
      // In a real implementation, this would send the code to the bot
      // For now, just log it
      await storage.addActivityLog({
        timestamp: new Date(),
        type: "Verification",
        message: `Verification code submitted: ${code}`,
        status: "Pending",
        details: null
      });
      
      res.json({ message: "Verification code submitted" });
    } catch (error) {
      res.status(500).json({ message: `Failed to submit verification code: ${(error as Error).message}` });
    }
  });
  
  // Mount API routes
  app.use("/api", apiRouter);

  // Create and return HTTP server
  const httpServer = createServer(app);
  return httpServer;
}
