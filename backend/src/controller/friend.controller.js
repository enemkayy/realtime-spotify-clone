import { User } from "../models/user.model.js";

// Send friend request
export const sendFriendRequest = async (req, res, next) => {
  try {
    const { userId } = req.params; // Target user ID
    const senderId = req.auth.userId; // Current user's Clerk ID

    // Get sender's MongoDB user
    const sender = await User.findOne({ clerkId: senderId });
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // Get target user
    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if trying to add self
    if (sender._id.toString() === userId) {
      return res
        .status(400)
        .json({ message: "Cannot send friend request to yourself" });
    }

    // Check if already friends
    if (sender.friends.includes(userId)) {
      return res.status(400).json({ message: "Already friends" });
    }

    // Check if request already sent
    const existingRequest = targetUser.friendRequests.find(
      (req) =>
        req.from.toString() === sender._id.toString() &&
        req.status === "pending"
    );

    if (existingRequest) {
      return res.status(400).json({ message: "Friend request already sent" });
    }

    // Check if target user already sent request to sender (mutual request)
    const mutualRequest = sender.friendRequests.find(
      (req) =>
        req.from.toString() === targetUser._id.toString() &&
        req.status === "pending"
    );

    if (mutualRequest) {
      // Auto-accept mutual request
      sender.friends.push(targetUser._id);
      targetUser.friends.push(sender._id);

      // Remove pending requests
      sender.friendRequests = sender.friendRequests.filter(
        (req) => req.from.toString() !== targetUser._id.toString()
      );
      targetUser.sentRequests = targetUser.sentRequests.filter(
        (id) => id.toString() !== sender._id.toString()
      );

      await sender.save();
      await targetUser.save();

      return res.status(200).json({
        message: "Friend request accepted automatically (mutual request)",
        isFriend: true,
      });
    }

    // Add friend request to target user
    targetUser.friendRequests.push({
      from: sender._id,
      status: "pending",
    });

    // Track sent request
    sender.sentRequests.push(targetUser._id);

    await targetUser.save();
    await sender.save();

    res.status(200).json({ message: "Friend request sent successfully" });
  } catch (error) {
    console.error("Error in sendFriendRequest:", error);
    next(error);
  }
};

// Accept friend request
export const acceptFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params; // This is the request._id from frontend
    const currentUserClerkId = req.auth.userId;

    // Get current user
    const currentUser = await User.findOne({ clerkId: currentUserClerkId });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find the request by _id (NOT by from field)
    const requestIndex = currentUser.friendRequests.findIndex(
      (req) => req._id.toString() === requestId && req.status === "pending"
      //       ^^^ Changed from req.from to req._id
    );

    if (requestIndex === -1) {
      console.log("Request not found. requestId:", requestId);
      console.log("User requests:", currentUser.friendRequests);
      return res.status(404).json({ message: "Friend request not found" });
    }

    const request = currentUser.friendRequests[requestIndex];
    const senderId = request.from; // Get the sender's ID from the request

    // Get sender
    const sender = await User.findById(senderId);
    if (!sender) {
      return res.status(404).json({ message: "Sender not found" });
    }

    // Add to friends list (check for duplicates)
    if (!currentUser.friends.includes(senderId)) {
      currentUser.friends.push(senderId);
    }
    if (!sender.friends.includes(currentUser._id)) {
      sender.friends.push(currentUser._id);
    }

    // Update request status
    currentUser.friendRequests[requestIndex].status = "accepted";

    // Remove from sent requests
    sender.sentRequests = sender.sentRequests.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await sender.save();

    res.status(200).json({
      message: "Friend request accepted",
      friend: {
        _id: sender._id,
        fullName: sender.fullName,
        imageUrl: sender.imageUrl,
        clerkId: sender.clerkId,
      },
    });
  } catch (error) {
    console.error("Error in acceptFriendRequest:", error);
    next(error);
  }
};

// Reject friend request
export const rejectFriendRequest = async (req, res, next) => {
  try {
    const { requestId } = req.params;
    const currentUserClerkId = req.auth.userId;

    const currentUser = await User.findOne({ clerkId: currentUserClerkId });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Find and update request
    const requestIndex = currentUser.friendRequests.findIndex(
      (req) => req.from.toString() === requestId && req.status === "pending"
    );

    if (requestIndex === -1) {
      return res.status(404).json({ message: "Friend request not found" });
    }

    // Update status to rejected
    currentUser.friendRequests[requestIndex].status = "rejected";

    // Remove from sender's sent requests
    const sender = await User.findById(requestId);
    if (sender) {
      sender.sentRequests = sender.sentRequests.filter(
        (id) => id.toString() !== currentUser._id.toString()
      );
      await sender.save();
    }

    await currentUser.save();

    res.status(200).json({ message: "Friend request rejected" });
  } catch (error) {
    console.error("Error in rejectFriendRequest:", error);
    next(error);
  }
};

// Remove friend (unfriend)
export const removeFriend = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const currentUserClerkId = req.auth.userId;

    const currentUser = await User.findOne({ clerkId: currentUserClerkId });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const friend = await User.findById(friendId);
    if (!friend) {
      return res.status(404).json({ message: "Friend not found" });
    }

    // Remove from friends list
    currentUser.friends = currentUser.friends.filter(
      (id) => id.toString() !== friendId
    );
    friend.friends = friend.friends.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    // Remove from close friends if exists
    currentUser.closeFriends = currentUser.closeFriends.filter(
      (id) => id.toString() !== friendId
    );
    friend.closeFriends = friend.closeFriends.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    await currentUser.save();
    await friend.save();

    res.status(200).json({ message: "Friend removed successfully" });
  } catch (error) {
    console.error("Error in removeFriend:", error);
    next(error);
  }
};

// Get friends list
export const getFriends = async (req, res, next) => {
  try {
    const currentUserClerkId = req.auth.userId;

    const currentUser = await User.findOne({
      clerkId: currentUserClerkId,
    }).populate({
      path: "friends",
      select: "fullName imageUrl clerkId closeFriends",
      populate: {
        path: "closeFriends",
        select: "clerkId"
      }
    });

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(currentUser.friends || []);
  } catch (error) {
    console.error("Error in getFriends:", error);
    next(error);
  }
};

// Get pending friend requests
export const getPendingRequests = async (req, res, next) => {
  try {
    const currentUserClerkId = req.auth.userId;

    const currentUser = await User.findOne({
      clerkId: currentUserClerkId,
    }).populate("friendRequests.from", "fullName imageUrl clerkId");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const pendingRequests = currentUser.friendRequests
      .filter((req) => req.status === "pending")
      .map((req) => ({
        _id: req._id,
        from: req.from,
        createdAt: req.createdAt,
      }));

    res.status(200).json(pendingRequests || []);
  } catch (error) {
    console.error("Error in getPendingRequests:", error);
    next(error);
  }
};

// Search users (for adding friends)
export const searchUsers = async (req, res, next) => {
  try {
    const { q } = req.query;
    const currentUserClerkId = req.auth.userId;

    if (!q || q.trim().length === 0) {
      return res.status(400).json({ message: "Search query required" });
    }

    const currentUser = await User.findOne({ clerkId: currentUserClerkId });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Search by full name (case insensitive)
    const users = await User.find({
      _id: { $ne: currentUser._id }, // Exclude self
      fullName: { $regex: q, $options: "i" },
    })
      .select("fullName imageUrl clerkId")
      .limit(20);

    // Add relationship status to each user
    const usersWithStatus = users.map((user) => {
      let status = "stranger";

      if (
        currentUser.friends.some((id) => id.toString() === user._id.toString())
      ) {
        status = "friend";
      } else if (
        currentUser.sentRequests.some(
          (id) => id.toString() === user._id.toString()
        )
      ) {
        status = "pending";
      } else if (
        currentUser.friendRequests.some(
          (req) =>
            req.from.toString() === user._id.toString() &&
            req.status === "pending"
        )
      ) {
        status = "received";
      }

      return {
        ...user.toObject(),
        relationshipStatus: status,
      };
    });

    res.status(200).json(usersWithStatus || []);
  } catch (error) {
    console.error("Error in searchUsers:", error);
    next(error);
  }
};

// Add to close friends
export const addCloseFriend = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const currentUserClerkId = req.auth.userId;

    const currentUser = await User.findOne({ clerkId: currentUserClerkId });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if they are friends first
    if (!currentUser.friends.includes(friendId)) {
      return res
        .status(400)
        .json({ message: "Can only add friends to close friends list" });
    }

    // Check if already in close friends
    if (currentUser.closeFriends.includes(friendId)) {
      return res.status(400).json({ message: "Already in close friends" });
    }

    currentUser.closeFriends.push(friendId);
    await currentUser.save();

    res.status(200).json({ message: "Added to close friends" });
  } catch (error) {
    console.error("Error in addCloseFriend:", error);
    next(error);
  }
};

// Remove from close friends
export const removeCloseFriend = async (req, res, next) => {
  try {
    const { friendId } = req.params;
    const currentUserClerkId = req.auth.userId;

    const currentUser = await User.findOne({ clerkId: currentUserClerkId });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.closeFriends = currentUser.closeFriends.filter(
      (id) => id.toString() !== friendId
    );
    await currentUser.save();

    res.status(200).json({ message: "Removed from close friends" });
  } catch (error) {
    console.error("Error in removeCloseFriend:", error);
    next(error);
  }
};

// Get close friends list
export const getCloseFriends = async (req, res, next) => {
  try {
    const currentUserClerkId = req.auth.userId;

    const currentUser = await User.findOne({
      clerkId: currentUserClerkId,
    }).populate("closeFriends", "fullName imageUrl clerkId");

    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json(currentUser.closeFriends || []);
  } catch (error) {
    console.error("Error in getCloseFriends:", error);
    next(error);
  }
};

// Block user
export const blockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserClerkId = req.auth.userId;

    const currentUser = await User.findOne({ clerkId: currentUserClerkId });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    const targetUser = await User.findById(userId);
    if (!targetUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if already blocked
    if (currentUser.blockedUsers.includes(userId)) {
      return res.status(400).json({ message: "User already blocked" });
    }

    // Remove from friends and close friends
    currentUser.friends = currentUser.friends.filter(
      (id) => id.toString() !== userId
    );
    currentUser.closeFriends = currentUser.closeFriends.filter(
      (id) => id.toString() !== userId
    );
    targetUser.friends = targetUser.friends.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );
    targetUser.closeFriends = targetUser.closeFriends.filter(
      (id) => id.toString() !== currentUser._id.toString()
    );

    // Add to blocked list
    currentUser.blockedUsers.push(userId);

    await currentUser.save();
    await targetUser.save();

    res.status(200).json({ message: "User blocked successfully" });
  } catch (error) {
    console.error("Error in blockUser:", error);
    next(error);
  }
};

// Unblock user
export const unblockUser = async (req, res, next) => {
  try {
    const { userId } = req.params;
    const currentUserClerkId = req.auth.userId;

    const currentUser = await User.findOne({ clerkId: currentUserClerkId });
    if (!currentUser) {
      return res.status(404).json({ message: "User not found" });
    }

    currentUser.blockedUsers = currentUser.blockedUsers.filter(
      (id) => id.toString() !== userId
    );
    await currentUser.save();

    res.status(200).json({ message: "User unblocked successfully" });
  } catch (error) {
    console.error("Error in unblockUser:", error);
    next(error);
  }
};
