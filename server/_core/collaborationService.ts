/**
 * Real-Time Collaboration Service
 * Manages user presence, activity feeds, and concurrent access
 */

import { EventEmitter } from "events";

interface UserPresence {
  userId: number;
  username: string;
  dealershipId: number;
  currentPage: string;
  lastActive: Date;
  cursorPosition?: { x: number; y: number };
  color: string;
}

interface ActivityEvent {
  id: string;
  userId: number;
  username: string;
  dealershipId: number;
  action: string;
  resourceType: string;
  resourceId: number;
  timestamp: Date;
  metadata?: Record<string, any>;
}

class CollaborationService extends EventEmitter {
  private userPresence = new Map<number, UserPresence>();
  private activityFeed: ActivityEvent[] = [];
  private maxFeedSize = 1000;
  private colors = ["#FF6B6B", "#4ECDC4", "#45B7D1", "#FFA07A", "#98D8C8"];

  addUserPresence(userId: number, username: string, dealershipId: number, page: string): UserPresence {
    const presence: UserPresence = {
      userId,
      username,
      dealershipId,
      currentPage: page,
      lastActive: new Date(),
      color: this.colors[userId % this.colors.length],
    };
    this.userPresence.set(userId, presence);
    this.emit("presence-updated", presence);
    return presence;
  }

  removeUserPresence(userId: number): void {
    this.userPresence.delete(userId);
    this.emit("presence-removed", userId);
  }

  updateUserPresence(userId: number, page: string, cursor?: { x: number; y: number }): void {
    const presence = this.userPresence.get(userId);
    if (presence) {
      presence.currentPage = page;
      presence.lastActive = new Date();
      if (cursor) presence.cursorPosition = cursor;
      this.emit("presence-updated", presence);
    }
  }

  getUsersOnPage(dealershipId: number, page: string): UserPresence[] {
    return Array.from(this.userPresence.values()).filter(
      (p) => p.dealershipId === dealershipId && p.currentPage === page
    );
  }

  getAllPresence(dealershipId: number): UserPresence[] {
    return Array.from(this.userPresence.values()).filter((p) => p.dealershipId === dealershipId);
  }

  logActivity(userId: number, username: string, dealershipId: number, action: string, resourceType: string, resourceId: number, metadata?: Record<string, any>): ActivityEvent {
    const event: ActivityEvent = {
      id: `${Date.now()}-${Math.random()}`,
      userId,
      username,
      dealershipId,
      action,
      resourceType,
      resourceId,
      timestamp: new Date(),
      metadata,
    };

    this.activityFeed.unshift(event);
    if (this.activityFeed.length > this.maxFeedSize) {
      this.activityFeed.pop();
    }

    this.emit("activity-logged", event);
    return event;
  }

  getActivityFeed(dealershipId: number, limit: number = 50, offset: number = 0): ActivityEvent[] {
    return this.activityFeed
      .filter((e) => e.dealershipId === dealershipId)
      .slice(offset, offset + limit);
  }

  getActivityByResource(dealershipId: number, resourceType: string, resourceId: number): ActivityEvent[] {
    return this.activityFeed.filter(
      (e) => e.dealershipId === dealershipId && e.resourceType === resourceType && e.resourceId === resourceId
    );
  }

  getActivityByUser(dealershipId: number, userId: number): ActivityEvent[] {
    return this.activityFeed.filter((e) => e.dealershipId === dealershipId && e.userId === userId);
  }

  clearOldActivity(daysOld: number = 30): number {
    const cutoff = new Date(Date.now() - daysOld * 24 * 60 * 60 * 1000);
    const before = this.activityFeed.length;
    this.activityFeed = this.activityFeed.filter((e) => e.timestamp > cutoff);
    return before - this.activityFeed.length;
  }
}

export const collaborationService = new CollaborationService();
