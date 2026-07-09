/**
 * Monitoring and metrics for authentication system
 */

export interface AuthMetrics {
  totalLogins: number;
  failedLogins: number;
  successfulSignups: number;
  failedSignups: number;
  twoFactorEnabled: number;
  socialAccountsLinked: number;
  passwordResets: number;
  suspiciousActivities: number;
  averageLoginTime: number;
}

export interface HealthStatus {
  status: "healthy" | "degraded" | "unhealthy";
  timestamp: Date;
  metrics: {
    databaseConnection: boolean;
    emailService: boolean;
    smsService: boolean;
    oauthProviders: boolean;
  };
  errors: string[];
}

class MonitoringService {
  private metrics: AuthMetrics = {
    totalLogins: 0,
    failedLogins: 0,
    successfulSignups: 0,
    failedSignups: 0,
    twoFactorEnabled: 0,
    socialAccountsLinked: 0,
    passwordResets: 0,
    suspiciousActivities: 0,
    averageLoginTime: 0,
  };

  private loginTimes: number[] = [];
  private errors: string[] = [];
  private lastHealthCheck: HealthStatus | null = null;

  /**
   * Record a successful login
   */
  recordLogin(duration: number): void {
    this.metrics.totalLogins++;
    this.loginTimes.push(duration);
    if (this.loginTimes.length > 1000) {
      this.loginTimes.shift();
    }
    this.updateAverageLoginTime();
  }

  /**
   * Record a failed login
   */
  recordFailedLogin(): void {
    this.metrics.failedLogins++;
  }

  /**
   * Record a successful signup
   */
  recordSignup(): void {
    this.metrics.successfulSignups++;
  }

  /**
   * Record a failed signup
   */
  recordFailedSignup(): void {
    this.metrics.failedSignups++;
  }

  /**
   * Record 2FA enabled
   */
  record2FAEnabled(): void {
    this.metrics.twoFactorEnabled++;
  }

  /**
   * Record social account linked
   */
  recordSocialAccountLinked(): void {
    this.metrics.socialAccountsLinked++;
  }

  /**
   * Record password reset
   */
  recordPasswordReset(): void {
    this.metrics.passwordResets++;
  }

  /**
   * Record suspicious activity
   */
  recordSuspiciousActivity(description: string): void {
    this.metrics.suspiciousActivities++;
    this.recordError(`Suspicious activity: ${description}`);
  }

  /**
   * Record an error
   */
  recordError(error: string): void {
    this.errors.push(`[${new Date().toISOString()}] ${error}`);
    if (this.errors.length > 100) {
      this.errors.shift();
    }
  }

  /**
   * Get current metrics
   */
  getMetrics(): AuthMetrics {
    return { ...this.metrics };
  }

  /**
   * Get recent errors
   */
  getErrors(limit: number = 10): string[] {
    return this.errors.slice(-limit);
  }

  /**
   * Get health status
   */
  async getHealthStatus(): Promise<HealthStatus> {
    const status: HealthStatus = {
      status: "healthy",
      timestamp: new Date(),
      metrics: {
        databaseConnection: true,
        emailService: true,
        smsService: true,
        oauthProviders: true,
      },
      errors: this.getErrors(5),
    };

    // Check for high failure rates
    const failureRate = this.metrics.failedLogins / Math.max(this.metrics.totalLogins, 1);
    if (failureRate > 0.5) {
      status.status = "degraded";
      status.errors.push("High login failure rate detected");
    }

    // Check for suspicious activity
    if (this.metrics.suspiciousActivities > 10) {
      status.status = "degraded";
      status.errors.push("Multiple suspicious activities detected");
    }

    this.lastHealthCheck = status;
    return status;
  }

  /**
   * Get last health check
   */
  getLastHealthCheck(): HealthStatus | null {
    return this.lastHealthCheck;
  }

  /**
   * Reset metrics (for testing)
   */
  reset(): void {
    this.metrics = {
      totalLogins: 0,
      failedLogins: 0,
      successfulSignups: 0,
      failedSignups: 0,
      twoFactorEnabled: 0,
      socialAccountsLinked: 0,
      passwordResets: 0,
      suspiciousActivities: 0,
      averageLoginTime: 0,
    };
    this.loginTimes = [];
    this.errors = [];
    this.lastHealthCheck = null;
  }

  /**
   * Get success rate
   */
  getSuccessRate(): number {
    const total = this.metrics.totalLogins + this.metrics.failedLogins;
    if (total === 0) return 0;
    return (this.metrics.totalLogins / total) * 100;
  }

  /**
   * Get signup success rate
   */
  getSignupSuccessRate(): number {
    const total = this.metrics.successfulSignups + this.metrics.failedSignups;
    if (total === 0) return 0;
    return (this.metrics.successfulSignups / total) * 100;
  }

  /**
   * Get 2FA adoption rate
   */
  get2FAAdoptionRate(): number {
    if (this.metrics.successfulSignups === 0) return 0;
    return (this.metrics.twoFactorEnabled / this.metrics.successfulSignups) * 100;
  }

  /**
   * Update average login time
   */
  private updateAverageLoginTime(): void {
    if (this.loginTimes.length === 0) {
      this.metrics.averageLoginTime = 0;
      return;
    }
    const sum = this.loginTimes.reduce((a, b) => a + b, 0);
    this.metrics.averageLoginTime = sum / this.loginTimes.length;
  }
}

export const monitoring = new MonitoringService();
