interface QueuedRequest {
  execute: () => Promise<any>;
  priority: number;
  timestamp: number;
}

export class RateLimiter {
  private queue: QueuedRequest[] = [];
  private processing: boolean = false;
  private lastRequestTime: number = 0;
  private consecutiveFailures: number = 0;
  private baseDelay: number = 2000; // Base delay between requests
  private maxDelay: number = 30000; // Maximum delay
  private minDelay: number = 1000; // Minimum delay
  private jitterFactor: number = 0.2; // 20% random jitter

  constructor(
    private maxRequestsPerMinute: number = 20,
    private maxConcurrent: number = 1
  ) {}

  async enqueue<T>(
    action: () => Promise<T>,
    priority: number = 0
  ): Promise<T> {
    return new Promise((resolve, reject) => {
      this.queue.push({
        execute: async () => {
          try {
            const result = await this.executeWithRetry(action);
            resolve(result);
            return result;
          } catch (error) {
            reject(error);
            throw error;
          }
        },
        priority,
        timestamp: Date.now()
      });

      // Sort queue by priority (higher first) and timestamp
      this.queue.sort((a, b) => {
        if (a.priority !== b.priority) {
          return b.priority - a.priority;
        }
        return a.timestamp - b.timestamp;
      });

      if (!this.processing) {
        this.processQueue();
      }
    });
  }

  private async processQueue(): Promise<void> {
    if (this.queue.length === 0) {
      this.processing = false;
      return;
    }

    this.processing = true;

    try {
      const request = this.queue.shift();
      if (!request) {
        this.processing = false;
        return;
      }

      // Calculate delay based on rate limiting and backoff
      const delay = this.calculateDelay();
      await this.delay(delay);

      try {
        await request.execute();
        this.consecutiveFailures = 0;
        this.lastRequestTime = Date.now();
      } catch (error) {
        this.consecutiveFailures++;
        console.error('Request failed:', error);
        throw error;
      }
    } finally {
      // Continue processing queue
      setImmediate(() => this.processQueue());
    }
  }

  private calculateDelay(): number {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    
    // Calculate base delay with exponential backoff
    let delay = this.baseDelay * Math.pow(2, this.consecutiveFailures);
    delay = Math.min(delay, this.maxDelay);
    delay = Math.max(delay, this.minDelay);

    // Add rate limiting delay if needed
    const minTimeBetweenRequests = (60 * 1000) / this.maxRequestsPerMinute;
    if (timeSinceLastRequest < minTimeBetweenRequests) {
      delay = Math.max(delay, minTimeBetweenRequests - timeSinceLastRequest);
    }

    // Add random jitter
    const jitter = delay * this.jitterFactor;
    delay += Math.random() * jitter * 2 - jitter;

    return delay;
  }

  private async executeWithRetry<T>(
    action: () => Promise<T>,
    maxRetries: number = 3
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        return await action();
      } catch (error) {
        lastError = error as Error;
        this.consecutiveFailures++;
        
        if (attempt < maxRetries - 1) {
          const delay = this.calculateDelay();
          await this.delay(delay);
        }
      }
    }

    throw lastError || new Error('All retry attempts failed');
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Utility method to check if we're being rate limited
  private isRateLimited(): boolean {
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    const minTimeBetweenRequests = (60 * 1000) / this.maxRequestsPerMinute;
    return timeSinceLastRequest < minTimeBetweenRequests;
  }

  // Get current queue status
  public getQueueStatus(): {
    queueLength: number;
    isProcessing: boolean;
    consecutiveFailures: number;
    isRateLimited: boolean;
  } {
    return {
      queueLength: this.queue.length,
      isProcessing: this.processing,
      consecutiveFailures: this.consecutiveFailures,
      isRateLimited: this.isRateLimited()
    };
  }
}

// Create a singleton instance for global rate limiting
export const globalRateLimiter = new RateLimiter();

// Decorator for rate-limited methods
export function rateLimited(
  priority: number = 0
) {
  return function (
    target: any,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = function (...args: any[]) {
      return globalRateLimiter.enqueue(
        () => originalMethod.apply(this, args),
        priority
      );
    };

    return descriptor;
  };
}
