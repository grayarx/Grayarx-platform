import crypto from "crypto";

export interface SessionToken {
  token: string;
  userId: number;
  createdAt: number;
  expiresAt: number;
  rotatedAt: number;
  ipAddress?: string;
  userAgent?: string;
}

interface SessionStore {
  [key: string]: SessionToken;
}

class SessionRotationService {
  private sessions: SessionStore = {};
  private readonly tokenLifetime = 24 * 60 * 60 * 1000; // 24 hours
  private readonly rotationInterval = 60 * 60 * 1000; // 1 hour

  constructor() {
    // Clean up expired sessions every 10 minutes
    setInterval(() => this.cleanup(), 10 * 60 * 1000);
  }

  generateToken(userId: number, ipAddress?: string, userAgent?: string): SessionToken {
    const token = crypto.randomBytes(32).toString("hex");
    const now = Date.now();

    const session: SessionToken = {
      token,
      userId,
      createdAt: now,
      expiresAt: now + this.tokenLifetime,
      rotatedAt: now,
      ipAddress,
      userAgent,
    };

    this.sessions[token] = session;
    return session;
  }

  rotateToken(oldToken: string, ipAddress?: string, userAgent?: string): SessionToken | null {
    const oldSession = this.sessions[oldToken];
    if (!oldSession) return null;

    // Check if token needs rotation (older than rotation interval)
    if (Date.now() - oldSession.rotatedAt < this.rotationInterval) {
      return oldSession; // Token is still fresh, no rotation needed
    }

    // Generate new token
    const newSession = this.generateToken(oldSession.userId, ipAddress, userAgent);
    newSession.createdAt = oldSession.createdAt; // Preserve original creation time

    // Delete old token
    delete this.sessions[oldToken];

    return newSession;
  }

  validateToken(token: string): SessionToken | null {
    const session = this.sessions[token];
    if (!session) return null;

    // Check if token has expired
    if (Date.now() > session.expiresAt) {
      delete this.sessions[token];
      return null;
    }

    return session;
  }

  invalidateToken(token: string): void {
    delete this.sessions[token];
  }

  invalidateUserSessions(userId: number): void {
    for (const [token, session] of Object.entries(this.sessions)) {
      if (session.userId === userId) {
        delete this.sessions[token];
      }
    }
  }

  getActiveSessions(userId: number): SessionToken[] {
    return Object.values(this.sessions).filter(
      (session) => session.userId === userId && Date.now() <= session.expiresAt
    );
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [token, session] of Object.entries(this.sessions)) {
      if (now > session.expiresAt) {
        delete this.sessions[token];
      }
    }
  }
}

export const sessionRotation = new SessionRotationService();
