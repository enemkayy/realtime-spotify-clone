import { Server } from "socket.io";
import { Message } from "../models/message.model.js";
import { User } from "../models/user.model.js";

export const initializeSocket = (server) => {
	const io = new Server(server, {
		cors: {
			origin: "http://localhost:3000",
			credentials: true,
		},
	});

	const userSockets = new Map(); // { userId: socketId}
	const userActivities = new Map(); // {userId: activity}

	io.on("connection", (socket) => {
		socket.on("user_connected", (userId) => {
			userSockets.set(userId, socket.id);
			userActivities.set(userId, "Idle");

			// broadcast to all connected sockets that this user just logged in
			io.emit("user_connected", userId);

			socket.emit("users_online", Array.from(userSockets.keys()));

			io.emit("activities", Array.from(userActivities.entries()));
		});

		socket.on("update_activity", ({ userId, activity }) => {
			console.log("activity updated", userId, activity);
			userActivities.set(userId, activity);
			io.emit("activity_updated", { userId, activity });
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
			let disconnectedUserId;
			for (const [userId, socketId] of userSockets.entries()) {
				// find disconnected user
				if (socketId === socket.id) {
					disconnectedUserId = userId;
					userSockets.delete(userId);
					userActivities.delete(userId);
					break;
				}
			}
			if (disconnectedUserId) {
				io.emit("user_disconnected", disconnectedUserId);
			}
		});
	});
};
