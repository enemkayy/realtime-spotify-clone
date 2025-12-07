// Observer Pattern: Subject (Observable)
// Manages user online/offline status and friend requests

export class UserActivitySubject {
  constructor() {
    this.observers = new Set();
    this.onlineUsers = new Map(); // userId -> socketId
    this.userActivities = new Map(); // userId -> activity
  }

  // Attach observer (socket connection)
  attach(observer) {
    this.observers.add(observer);
    console.log(`✅ Observer attached. Total: ${this.observers.size}`);
  }

  // Detach observer (socket disconnect)
  detach(observer) {
    this.observers.delete(observer);
    console.log(`❌ Observer detached. Total: ${this.observers.size}`);
  }

  // Notify all observers
  notify(event, data) {
    console.log(`📢 Notifying ${this.observers.size} observers: ${event}`);
    
    let count = 0;
    this.observers.forEach((observer) => {
      count++;
      const observerUserId = observer.userId || 'not-set';
      console.log(`   → Observer ${count}: userId=${observerUserId}`);
      observer.update(event, data);
    });
  }

  // Business logic: User went online
  userWentOnline(userId, socketId) {
    this.onlineUsers.set(userId, socketId);
    this.userActivities.set(userId, "Idle");
    
    console.log(`🟢 User online: ${userId}`);
    
    this.notify("user_online", {
      userId,
      onlineUsers: Array.from(this.onlineUsers.keys()),
      activities: Object.fromEntries(this.userActivities),
    });
  }

  // Business logic: User went offline
  userWentOffline(userId) {
    this.onlineUsers.delete(userId);
    this.userActivities.delete(userId);
    
    console.log(`⚫ User offline: ${userId}`);
    
    this.notify("user_offline", {
      userId,
      onlineUsers: Array.from(this.onlineUsers.keys()),
    });
  }

  // Business logic: Activity changed
  activityChanged(userId, activity) {
    if (this.onlineUsers.has(userId)) {
      this.userActivities.set(userId, activity);
      
      this.notify("activity_updated", {
        userId,
        activity,
      });
    }
  }

  // Business logic: Friend request received
  friendRequestReceived(targetUserId, request) {
    console.log(`📨 Friend request: ${request.from.fullName} → ${targetUserId}`);
    
    this.notify("friend_request_received", {
      targetUserId,
      request,
    });
  }

  // Business logic: Friend request accepted
  friendRequestAccepted(userId, friendId, accepterData) {
    console.log(`✅ Friend request accepted: ${userId} ↔ ${friendId}`);
    
    this.notify("friend_request_accepted", {
      userId,
      friendId,
      accepterData,
    });
  }

  // Business logic: Friend request rejected
  friendRequestRejected(senderId, rejecterId) {
    console.log(`❌ Friend request rejected by: ${rejecterId}`);
    
    this.notify("friend_request_rejected", {
      senderId,
      rejecterId,
    });
  }

  // Get current state
  getState() {
    return {
      onlineUsers: Array.from(this.onlineUsers.keys()),
      activities: Object.fromEntries(this.userActivities),
    };
  }

  // Get socket ID for user
  getSocketId(userId) {
    return this.onlineUsers.get(userId);
  }
}
