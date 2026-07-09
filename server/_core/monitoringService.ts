/**
 * Comprehensive Monitoring and Logging Service
 * Tracks system health, performance metrics, and errors
 */

interface MetricEntry {
  timestamp: number;
  value: number;
  labels?: Record<string, string>;
}

interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  uptime: number;
  memory: {
    used: number;
    total: number;
    percentage: number;
  };
  cpu: number;
  errors: number;
  warnings: number;
  lastCheck: number;
}

interface LogEntry {
  timestamp: number;
  level: "debug" | "info" | "warn" | "error";
  message: string;
  context?: Record<string, any>;
  stackTrace?: string;
}

class MonitoringService {
  private metrics = new Map<string, MetricEntry[]>();
  private logs: LogEntry[] = [];
  private errors = 0;
  private warnings = 0;
  private startTime = Date.now();
  private maxLogs = 10000;

  /**
   * Record metric
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    if (!this.metrics.has(name)) {
      this.metrics.set(name, []);
    }

    const entries = this.metrics.get(name)!;
    entries.push({
      timestamp: Date.now(),
      value,
      labels,
    });

    // Keep only last 1000 entries per metric
    if (entries.length > 1000) {
      entries.shift();
    }
  }

  /**
   * Get metric history
   */
  getMetric(name: string, limit: number = 100): MetricEntry[] {
    const entries = this.metrics.get(name) || [];
    return entries.slice(-limit);
  }

  /**
   * Get metric statistics
   */
  getMetricStats(name: string) {
    const entries = this.metrics.get(name) || [];
    if (entries.length === 0) {
      return null;
    }

    const values = entries.map((e) => e.value);
    const sum = values.reduce((a, b) => a + b, 0);
    const avg = sum / values.length;
    const min = Math.min(...values);
    const max = Math.max(...values);

    return { avg, min, max, count: values.length };
  }

  /**
   * Log message
   */
  log(
    level: "debug" | "info" | "warn" | "error",
    message: string,
    context?: Record<string, any>,
    stackTrace?: string
  ): void {
    const entry: LogEntry = {
      timestamp: Date.now(),
      level,
      message,
      context,
      stackTrace,
    };

    this.logs.push(entry);

    // Track errors and warnings
    if (level === "error") this.errors++;
    if (level === "warn") this.warnings++;

    // Keep only recent logs
    if (this.logs.length > this.maxLogs) {
      this.logs = this.logs.slice(-this.maxLogs);
    }

    // Console output for important levels
    if (level === "error" || level === "warn") {
      console.log(`[${level.toUpperCase()}] ${message}`, context || "");
    }
  }

  /**
   * Get logs
   */
  getLogs(level?: string, limit: number = 100): LogEntry[] {
    let filtered = this.logs;

    if (level) {
      filtered = filtered.filter((l) => l.level === level);
    }

    return filtered.slice(-limit);
  }

  /**
   * Get health status
   */
  getHealthStatus(): HealthStatus {
    const memUsage = process.memoryUsage();
    const uptime = Date.now() - this.startTime;

    return {
      status: this.errors > 10 ? "unhealthy" : this.warnings > 5 ? "degraded" : "healthy",
      uptime,
      memory: {
        used: Math.round(memUsage.heapUsed / 1024 / 1024),
        total: Math.round(memUsage.heapTotal / 1024 / 1024),
        percentage: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 100),
      },
      cpu: 0, // Would need native module
      errors: this.errors,
      warnings: this.warnings,
      lastCheck: Date.now(),
    };
  }

  /**
   * Clear logs
   */
  clearLogs(): void {
    this.logs = [];
    this.errors = 0;
    this.warnings = 0;
  }

  /**
   * Clear metrics
   */
  clearMetrics(): void {
    this.metrics.clear();
  }

  /**
   * Get all metrics names
   */
  getMetricNames(): string[] {
    return Array.from(this.metrics.keys());
  }
}

// Export singleton
export const monitoringService = new MonitoringService();

/**
 * Log debug message
 */
export function logDebug(message: string, context?: Record<string, any>): void {
  monitoringService.log("debug", message, context);
}

/**
 * Log info message
 */
export function logInfo(message: string, context?: Record<string, any>): void {
  monitoringService.log("info", message, context);
}

/**
 * Log warning message
 */
export function logWarning(message: string, context?: Record<string, any>): void {
  monitoringService.log("warn", message, context);
}

/**
 * Log error message
 */
export function logError(message: string, error?: Error, context?: Record<string, any>): void {
  monitoringService.log("error", message, context, error?.stack);
}

/**
 * Record API response time
 */
export function recordResponseTime(endpoint: string, duration: number): void {
  monitoringService.recordMetric("response_time", duration, { endpoint });
}

/**
 * Record API request count
 */
export function recordRequest(endpoint: string): void {
  monitoringService.recordMetric("request_count", 1, { endpoint });
}

/**
 * Record error count
 */
export function recordError(endpoint: string): void {
  monitoringService.recordMetric("error_count", 1, { endpoint });
}

export default monitoringService;
