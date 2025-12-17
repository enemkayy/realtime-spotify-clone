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

      case "added_to_close_friend":
        this.handleAddedToCloseFriend(data);
        break;

      case "removed_from_close_friend":
        this.handleRemovedFromCloseFriend(data);
        break;

      default:
        console.log(`Unknown event: ${event}`);
    }
  }

  // Handle: User came online
  handleUserOnline(data) {
    if (data.userId === this.userId) {
      // User just connected - skip duplicate notification
      console.log(`Observer ${this.userId}: Skipping self-notification`);
    } else {
      // Notify this observer about the new online user
      this.socket.emit("user_connected", data.userId);
      // Also send updated full list
      this.socket.emit("users_online", data.onlineUsers);
      // Send activities too
      if (data.activities) {
        this.socket.emit("activities", data.activities);
      }
      console.log(
        `Observer ${this.userId}: Notified about ${data.userId} coming online`
      );
    }
  }

  // Handle: User went offline
  handleUserOffline(data) {
    // Don't notify the user who went offline (they're disconnected)
    if (data.userId !== this.userId) {
      this.socket.emit("user_disconnected", data.userId);
      // Send updated full list
      this.socket.emit("users_online", data.onlineUsers);
      console.log(
        `Observer ${this.userId}: Notified about ${data.userId} going offline`
      );
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
      console.log(`Sent friend request notification to ${this.userId}`);
    }
  }

  // Handle: Friend request accepted
  handleFriendRequestAccepted(data) {
    console.log(`   [SocketObserver] handleFriendRequestAccepted called`);
    console.log(`   - This observer userId: ${this.userId}`);
    console.log(`   - Event data.userId (accepter): ${data.userId}`);
    console.log(`   - Event data.friendId (sender): ${data.friendId}`);
    console.log(`   - Event data.accepterData:`, data.accepterData);

    // Only notify the sender (friendId) about the acceptance
    // userId = person who accepted (receiver)
    // friendId = person who sent the request (sender)
    if (data.friendId === this.userId) {
      console.log(`MATCH! Sending notification to sender ${this.userId}`);
      this.socket.emit("friend_request_accepted", {
        accepterId: data.userId,
        friendId: data.friendId,
        accepterName: data.accepterData?.fullName,
        accepterImageUrl: data.accepterData?.imageUrl,
      });
      console.log(
        `Sent acceptance notification to sender ${this.userId} (accepter: ${data.accepterData?.fullName})`
      );
    } else {
      console.log(
        `⏭SKIP: This observer (${this.userId}) is not the sender (${data.friendId})`
      );
    }
  }

  // Handle: Friend request rejected
  handleFriendRequestRejected(data) {
    // Only notify the original sender
    if (data.senderId === this.userId) {
      this.socket.emit("friend_request_rejected", {
        rejectedBy: data.rejecterId,
      });
      console.log(`Sent rejection notification to ${this.userId}`);
    }
  }

  // Handle: Added to close friend
  handleAddedToCloseFriend(data) {
    console.log(`⭐ [SocketObserver] handleAddedToCloseFriend called`);
    console.log(`   - This observer userId: ${this.userId}`);
    console.log(`   - Event data.friendId (who was added): ${data.friendId}`);
    console.log(`   - Event data.addedByUserId (who added): ${data.addedByUserId}`);
    console.log(`   - Event data.currentActivity: ${data.currentActivity}`);
    
    // Notify the friend who was added about the current activity of the person who added them
    if (data.friendId === this.userId) {
      console.log(`✅ MATCH! Sending activity sync to ${this.userId}`);
      this.socket.emit("close_friend_activity_sync", {
        userId: data.addedByUserId,
        activity: data.currentActivity,
      });
      console.log(`✅ Emitted "close_friend_activity_sync" to ${this.userId} for user ${data.addedByUserId}: ${data.currentActivity}`);
    } else {
      console.log(`⏭ SKIP: This observer (${this.userId}) is not the friend who was added (${data.friendId})`);
    }
  }

  // Handle: Removed from close friend
  handleRemovedFromCloseFriend(data) {
    console.log(`❌ [SocketObserver] handleRemovedFromCloseFriend called`);
    console.log(`   - This observer userId: ${this.userId}`);
    console.log(`   - Event data.friendId (who was removed): ${data.friendId}`);
    console.log(`   - Event data.removedByUserId (who removed): ${data.removedByUserId}`);
    
    // Notify the friend who was removed to stop showing the remover's activity
    if (data.friendId === this.userId) {
      console.log(`✅ MATCH! Notifying ${this.userId} to refresh close friends`);
      this.socket.emit("removed_from_close_friend", {
        userId: data.removedByUserId,
      });
      console.log(`✅ Emitted "removed_from_close_friend" to ${this.userId} for user ${data.removedByUserId}`);
    } else {
      console.log(`⏭ SKIP: This observer (${this.userId}) is not the friend who was removed (${data.friendId})`);
    }
  }
}
