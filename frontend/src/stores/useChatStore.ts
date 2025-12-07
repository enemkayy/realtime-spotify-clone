import { axiosInstance } from "@/lib/axios";
import { Message, User } from "@/types";
import { create } from "zustand";
import { io } from "socket.io-client";

interface ChatStore {
	users: User[];
	isLoading: boolean;
	error: string | null;
	socket: any;
	isConnected: boolean;
	onlineUsers: Set<string>;
	userActivities: Map<string, string>;
	messages: Message[];
	selectedUser: User | null;
	isAIChat: boolean; // NEW: track if AI chat is active

	fetchUsers: () => Promise<void>;
	initSocket: (userId: string) => void;
	disconnectSocket: () => void;
	sendMessage: (receiverId: string, senderId: string, content: string) => void;
	fetchMessages: (userId: string) => Promise<void>;
	setSelectedUser: (user: User | null) => void;
	setAIChat: (isAI: boolean) => void; // NEW: toggle AI chat
}

const baseURL = import.meta.env.MODE === "development" ? "http://localhost:5000" : "/";

const socket = io(baseURL, {
	autoConnect: false, // only connect if user is authenticated
	withCredentials: true,
});

export const useChatStore = create<ChatStore>((set, get) => ({
	users: [],
	isLoading: false,
	error: null,
	socket: socket,
	isConnected: false,
	onlineUsers: new Set(),
	userActivities: new Map(),
	messages: [],
	selectedUser: null,
	isAIChat: false, // NEW

	setSelectedUser: (user) => set({ selectedUser: user }),
	setAIChat: (isAI) => set({ isAIChat: isAI }), // NEW

	fetchUsers: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/users");
			set({ users: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},

	initSocket: (userId) => {
		if (!get().isConnected) {
			socket.auth = { userId };
			
			console.log(`🔌 [Frontend] Initializing socket for user: ${userId}`);
			
			// Remove any existing listeners to prevent duplicates
			socket.removeAllListeners();
			
			// Setup event listeners BEFORE connecting
			socket.on("users_online", (users: string[]) => {
				console.log("🟢 [Frontend] Received users_online:", users);
				set({ onlineUsers: new Set(users) });
			});
			
			socket.on("user_connected", (connectedUserId: string) => {
				console.log("🟢 [Frontend] User connected:", connectedUserId);
				set((state) => {
					const newOnlineUsers = new Set(state.onlineUsers);
					newOnlineUsers.add(connectedUserId);
					return { onlineUsers: newOnlineUsers };
				});
			});
			
			socket.on("user_disconnected", (disconnectedUserId: string) => {
				console.log("⚫ [Frontend] User disconnected:", disconnectedUserId);
				set((state) => {
					const newOnlineUsers = new Set(state.onlineUsers);
					newOnlineUsers.delete(disconnectedUserId);
					return { onlineUsers: newOnlineUsers };
				});
			});
			
			socket.on("activity_updated", ({ userId: activityUserId, activity }: { userId: string; activity: string }) => {
				console.log("🎵 [Frontend] Activity updated:", activityUserId, activity);
				set((state) => {
					const newActivities = new Map(state.userActivities);
					newActivities.set(activityUserId, activity);
					return { userActivities: newActivities };
				});
			});
			
		// Connect AFTER listeners are setup
		socket.connect();
		
		// Emit user_connected AFTER socket is connected
		socket.on("connect", () => {
			console.log("✅ [Frontend] Socket connected, emitting user_connected");
			socket.emit("user_connected", userId);
			set({ isConnected: true });
		});
		
		socket.on("connect_error", (error) => {
			console.error("❌ [Frontend] Socket connection error:", error);
		});

		socket.on("activities", (activities: Record<string, string>) => {
			console.log("🎵 [Frontend] Received activities:", Object.keys(activities).length);
			set({ userActivities: new Map(Object.entries(activities)) });
		});

		socket.on("receive_message", (message: Message) => {
			set((state) => ({
				messages: [...state.messages, message],
			}));
		});

		socket.on("message_sent", (message: Message) => {
			set((state) => ({
				messages: [...state.messages, message],
			}));
		});

	socket.on("friend_request_rejected", ({ rejectedBy }) => {
		// Update search results to show "stranger" status
		import("./useFriendStore").then(({ useFriendStore }) => {
			useFriendStore.getState().updateSearchResultStatus(rejectedBy, "stranger");
		});
	});

	socket.on("message_error", (error: string) => {
		console.error("Message error:", error);
		// You can show a toast here if needed
		// toast.error(error);
	});
	}
},	disconnectSocket: () => {
		if (get().isConnected) {
			socket.disconnect();
			set({ isConnected: false });
		}
	},

	sendMessage: async (receiverId, senderId, content) => {
		const socket = get().socket;
		if (!socket) return;

		socket.emit("send_message", { receiverId, senderId, content });
	},

	fetchMessages: async (userId: string) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get(`/users/messages/${userId}`);
			set({ messages: response.data });
		} catch (error: any) {
			set({ error: error.response.data.message });
		} finally {
			set({ isLoading: false });
		}
	},
}));
