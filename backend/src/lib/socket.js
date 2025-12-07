import { Server } from "socket.io";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";
import { UserActivitySubject } from "./observers/UserActivitySubject.js";
import { SocketObserver } from "./observers/SocketObserver.js";

export const initializeSocket = (server) => {
	const io = new Server(server, {
		cors: {
			origin: "http://localhost:3000",
			credentials: true,
		},
	});

	// Observer Pattern: Create Subject
	const activitySubject = new UserActivitySubject();
	
	// Expose subject for controllers to use
	io.activitySubject = activitySubject;

	const userSockets = new Map(); // { userId: socketId} - kept for message routing

	io.on("connection", (socket) => {
		console.log(`🔌 Socket connected: ${socket.id}`);

		// Observer Pattern: Create observer for this socket
		const observer = new SocketObserver(socket, io);
		activitySubject.attach(observer);

		socket.on("user_connected", (userId) => {
			userSockets.set(userId, socket.id);
			observer.setUserId(userId);
			
			console.log(`👤 User authenticated: ${userId}`);

			// Send initial state to newly connected user BEFORE notifying others
			const state = activitySubject.getState();
			socket.emit("users_online", state.onlineUsers);
			socket.emit("activities", state.activities);
			console.log(`📤 Sent initial state to ${userId}: ${state.onlineUsers.length} users online`);

			// Observer Pattern: Notify all observers AFTER setup
			activitySubject.userWentOnline(userId, socket.id);
		});

		socket.on("update_activity", ({ userId, activity }) => {
			console.log("🎵 Activity updated:", userId, activity);
			
			// Observer Pattern: Notify all observers
			activitySubject.activityChanged(userId, activity);
		});

		socket.on("send_message", async (data) => {
			try {
				const { senderId, receiverId, content } = data;

				// senderId and receiverId are Clerk IDs, need to find MongoDB users for validation
				const sender = await User.findOne({ clerkId: senderId });
				const receiver = await User.findOne({ clerkId: receiverId });

				if (!sender) {
					socket.emit("message_error", "Sender not found");
					return;
				}

				if (!receiver) {
					socket.emit("message_error", "Receiver not found");
					return;
				}

				// Check if receiver is in sender's friends list (using MongoDB _id)
				const areFriends = sender.friends.some(
					(friendId) => friendId.toString() === receiver._id.toString()
				);

				if (!areFriends) {
					socket.emit("message_error", "You can only send messages to your friends");
					return;
				}

				// Save message with Clerk IDs (as per Message model schema)
				const message = await Message.create({
					senderId: senderId,
					receiverId: receiverId,
					content,
				});

				// send to receiver in realtime, if they're online
				const receiverSocketId = userSockets.get(receiverId);
				if (receiverSocketId) {
					io.to(receiverSocketId).emit("receive_message", message);
				}

				socket.emit("message_sent", message);
			} catch (error) {
				console.error("Message error:", error);
				socket.emit("message_error", error.message);
			}
		});

		socket.on("disconnect", () => {
			const disconnectedUserId = observer.userId;
			
			if (disconnectedUserId) {
				console.log(`👋 User ${disconnectedUserId} disconnected (socket: ${socket.id})`);
				
				// Remove from userSockets map
				userSockets.delete(disconnectedUserId);
				
				// Observer Pattern: Notify all observers BEFORE detaching
				activitySubject.userWentOffline(disconnectedUserId);
				activitySubject.detach(observer);
				
				console.log(`❌ Observer detached for ${disconnectedUserId}`);
			} else {
				// Socket disconnected before user_connected was emitted
				console.log(`🔌 Anonymous socket disconnected: ${socket.id}`);
				activitySubject.detach(observer);
			}
		});
	});

	return io;
};
