// Observer Pattern: Concrete Observer
// Observes UserActivitySubject and emits socket events

export class SocketObserver {
  constructor(socket, io) {
    this.socket = socket;
    this.io = io;
    this.userId = null;
  }

  setUserId(userId) {
    this.userId = userId;
  }

  // Observer Pattern: update method
  update(event, data) {
    switch (event) {
      case "user_online":
        this.handleUserOnline(data);
        break;

      case "user_offline":
        this.handleUserOffline(data);
        break;

      case "activity_updated":
        this.handleActivityUpdated(data);
        break;

      case "friend_request_received":
        this.handleFriendRequestReceived(data);
        break;

      case "friend_request_accepted":
        this.handleFriendRequestAccepted(data);
        break;

      case "friend_request_rejected":
        this.handleFriendRequestRejected(data);
        break;

      default:
        console.log(`⚠️ Unknown event: ${event}`);
    }
  }

  // Handle: User came online
  handleUserOnline(data) {
    if (data.userId === this.userId) {
      // User just connected - skip duplicate notification
      console.log(`📥 Observer ${this.userId}: Skipping self-notification`);
    } else {
      // Notify this observer about the new online user
      this.socket.emit("user_connected", data.userId);
      // Also send updated full list
      this.socket.emit("users_online", data.onlineUsers);
      console.log(`📢 Observer ${this.userId}: Notified about ${data.userId} coming online`);
    }
  }

  // Handle: User went offline
  handleUserOffline(data) {
    // Don't notify the user who went offline (they're disconnected)
    if (data.userId !== this.userId) {
      this.socket.emit("user_disconnected", data.userId);
      // Send updated full list
      this.socket.emit("users_online", data.onlineUsers);
      console.log(`📢 Observer ${this.userId}: Notified about ${data.userId} going offline`);
    }
  }

  // Handle: Activity updated
  handleActivityUpdated(data) {
    // Broadcast to all connected users
    this.socket.emit("activity_updated", {
      userId: data.userId,
      activity: data.activity,
    });
  }

  // Handle: Friend request received
  handleFriendRequestReceived(data) {
    // Only notify the target user
    if (data.targetUserId === this.userId) {
      this.socket.emit("new_friend_request", data.request);
      console.log(`📨 Sent friend request notification to ${this.userId}`);
    }
  }

  // Handle: Friend request accepted
  handleFriendRequestAccepted(data) {
    // Notify both users involved
    if (data.userId === this.userId || data.friendId === this.userId) {
      this.socket.emit("friend_request_accepted", {
        accepterId: data.userId,
        friendId: data.friendId,
        accepterName: data.accepterData?.fullName,
        accepterImage: data.accepterData?.imageUrl,
      });
      console.log(`✅ Sent acceptance notification to ${this.userId}`);
    }
  }

  // Handle: Friend request rejected
  handleFriendRequestRejected(data) {
    // Only notify the original sender
    if (data.senderId === this.userId) {
      this.socket.emit("friend_request_rejected", {
        rejectedBy: data.rejecterId,
      });
      console.log(`❌ Sent rejection notification to ${this.userId}`);
    }
  }
}
