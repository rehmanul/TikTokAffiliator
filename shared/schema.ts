import { pgTable, text, serial, integer, timestamp, json, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
});

export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Bot configuration
export const botConfigs = pgTable("bot_configs", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  password: text("password").notNull(),
  rememberCredentials: boolean("remember_credentials").default(true),
  minFollowers: integer("min_followers").default(1000),
  maxFollowers: integer("max_followers").default(2000),
  categories: text("categories").array().notNull(),
  invitationLimit: integer("invitation_limit").default(60),
  actionDelay: integer("action_delay").default(2000),
  retryAttempts: integer("retry_attempts").default(3),
  operationMode: text("operation_mode").default("human-like"),
  isActive: boolean("is_active").default(false)
});

export const insertBotConfigSchema = createInsertSchema(botConfigs).omit({
  id: true,
});

export type InsertBotConfig = z.infer<typeof insertBotConfigSchema>;
export type BotConfig = typeof botConfigs.$inferSelect;

// Activity logs
export const activityLogs = pgTable("activity_logs", {
  id: serial("id").primaryKey(),
  timestamp: timestamp("timestamp").defaultNow().notNull(),
  type: text("type").notNull(), // Login, Filter, Invite, Error
  message: text("message").notNull(),
  status: text("status").notNull(), // Success, Pending, Error
  details: json("details")
});

export const insertActivityLogSchema = createInsertSchema(activityLogs).omit({
  id: true,
});

export type InsertActivityLog = z.infer<typeof insertActivityLogSchema>;
export type ActivityLog = typeof activityLogs.$inferSelect;

// Bot status
export const botStatus = pgTable("bot_status", {
  id: serial("id").primaryKey(),
  status: text("status").notNull().default("stopped"), // running, stopped, error
  lastLoginTime: timestamp("last_login_time"),
  invitationsSent: integer("invitations_sent").default(0),
  invitationsTarget: integer("invitations_target").default(60),
  successRate: integer("success_rate").default(0),
  sessionData: json("session_data")
});

export const insertBotStatusSchema = createInsertSchema(botStatus).omit({
  id: true,
});

export type InsertBotStatus = z.infer<typeof insertBotStatusSchema>;
export type BotStatus = typeof botStatus.$inferSelect;

// Creator entity
export const creator = z.object({
  username: z.string(),
  displayName: z.string().optional(),
  category: z.string().optional(),
  followers: z.number(),
  demographic: z.string().optional(),
  earnings: z.string().optional(),
  engagement: z.string().optional(),
  invited: z.boolean().optional().default(false)
});

export type Creator = z.infer<typeof creator>;
