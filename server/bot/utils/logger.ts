import fs from 'fs';
import path from 'path';
import { performance } from 'perf_hooks';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';
export type LogCategory = 'bot' | 'session' | 'network' | 'captcha' | 'performance' | 'action';

interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: LogCategory;
  message: string;
  metadata?: Record<string, any>;
  error?: Error;
}

interface PerformanceMetric {
  name: string;
  startTime: number;
  duration?: number;
  success: boolean;
  metadata?: Record<string, any>;
}

class Logger {
  private static instance: Logger;
  private logDir: string;
  private metricsDir: string;
  private currentMetrics: Map<string, PerformanceMetric> = new Map();
  private readonly maxLogSize = 10 * 1024 * 1024; // 10MB
  private readonly maxLogFiles = 5;

  private constructor() {
    this.logDir = path.join(process.cwd(), 'logs');
    this.metricsDir = path.join(this.logDir, 'metrics');
    this.initializeDirectories();
  }

  public static getInstance(): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger();
    }
    return Logger.instance;
  }

  private initializeDirectories(): void {
    if (!fs.existsSync(this.logDir)) {
      fs.mkdirSync(this.logDir, { recursive: true });
    }
    if (!fs.existsSync(this.metricsDir)) {
      fs.mkdirSync(this.metricsDir, { recursive: true });
    }
  }

  private getLogFilePath(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.logDir, `bot-${date}.log`);
  }

  private getMetricsFilePath(): string {
    const date = new Date().toISOString().split('T')[0];
    return path.join(this.metricsDir, `metrics-${date}.json`);
  }

  private async rotateLogFiles(): Promise<void> {
    const logFile = this.getLogFilePath();
    
    try {
      const stats = await fs.promises.stat(logFile);
      
      if (stats.size >= this.maxLogSize) {
        const oldFiles = await fs.promises.readdir(this.logDir);
        const logFiles = oldFiles
          .filter(file => file.startsWith('bot-') && file.endsWith('.log'))
          .sort()
          .reverse();

        // Remove oldest files if we have too many
        while (logFiles.length >= this.maxLogFiles) {
          const oldestFile = logFiles.pop();
          if (oldestFile) {
            await fs.promises.unlink(path.join(this.logDir, oldestFile));
          }
        }

        // Rename current file with timestamp
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        await fs.promises.rename(
          logFile,
          path.join(this.logDir, `bot-${timestamp}.log`)
        );
      }
    } catch (error) {
      console.error('Error rotating log files:', error);
    }
  }

  public async log(
    level: LogLevel,
    category: LogCategory,
    message: string,
    metadata?: Record<string, any>,
    error?: Error
  ): Promise<void> {
    const entry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      metadata,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } as Error : undefined
    };

    const logLine = JSON.stringify(entry) + '\n';

    try {
      await this.rotateLogFiles();
      await fs.promises.appendFile(this.getLogFilePath(), logLine);
      
      // Also log to console in development
      if (process.env.NODE_ENV !== 'production') {
        console.log(`[${entry.timestamp}] ${entry.level.toUpperCase()} [${entry.category}]: ${entry.message}`);
        if (metadata) console.log('Metadata:', metadata);
        if (error) console.error('Error:', error);
      }
    } catch (err) {
      console.error('Failed to write log:', err);
    }
  }

  public startMetric(name: string, metadata?: Record<string, any>): void {
    this.currentMetrics.set(name, {
      name,
      startTime: performance.now(),
      success: false,
      metadata
    });
  }

  public endMetric(name: string, success: boolean = true, additionalMetadata?: Record<string, any>): void {
    const metric = this.currentMetrics.get(name);
    if (!metric) return;

    metric.duration = performance.now() - metric.startTime;
    metric.success = success;
    if (additionalMetadata) {
      metric.metadata = { ...metric.metadata, ...additionalMetadata };
    }

    this.saveMetric(metric);
    this.currentMetrics.delete(name);
  }

  private async saveMetric(metric: PerformanceMetric): Promise<void> {
    const metricsFile = this.getMetricsFilePath();
    const metricEntry = {
      timestamp: new Date().toISOString(),
      ...metric
    };

    try {
      let metrics: any[] = [];
      try {
        const content = await fs.promises.readFile(metricsFile, 'utf-8');
        metrics = JSON.parse(content);
      } catch (error) {
        // File doesn't exist or is invalid, start with empty array
      }

      metrics.push(metricEntry);
      await fs.promises.writeFile(metricsFile, JSON.stringify(metrics, null, 2));
    } catch (error) {
      console.error('Failed to save metric:', error);
    }
  }

  // Utility methods for common log types
  public async debug(category: LogCategory, message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('debug', category, message, metadata);
  }

  public async info(category: LogCategory, message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('info', category, message, metadata);
  }

  public async warn(category: LogCategory, message: string, metadata?: Record<string, any>): Promise<void> {
    await this.log('warn', category, message, metadata);
  }

  public async error(category: LogCategory, message: string, error?: Error, metadata?: Record<string, any>): Promise<void> {
    await this.log('error', category, message, metadata, error);
  }

  // Activity tracking for specific bot actions
  public async trackBotAction(
    action: string,
    success: boolean,
    duration: number,
    metadata?: Record<string, any>
  ): Promise<void> {
    await this.log(
      success ? 'info' : 'error',
      'action',
      `Bot action: ${action}`,
      {
        success,
        duration,
        ...metadata
      }
    );
  }
}

// Export singleton instance
export const logger = Logger.getInstance();
