import { axiosInstance } from "@/lib/axios";
import { User } from "@/types";
import { create } from "zustand";

export interface FriendRequest {
	_id: string;
	from: User;
	status: "pending" | "accepted" | "rejected";
	createdAt: string;
}

export interface UserWithRelationship extends User {
	relationshipStatus: "stranger" | "friend" | "pending" | "received" | "blocked";
}

interface FriendStore {
	friends: User[];
	closeFriends: User[];
	pendingRequests: FriendRequest[];
	searchResults: UserWithRelationship[];
	isLoading: boolean;
	error: string | null;

	// Friend operations
	fetchFriends: () => Promise<void>;
	sendFriendRequest: (userId: string) => Promise<void>;
	acceptFriendRequest: (requestId: string) => Promise<void>;
	rejectFriendRequest: (requestId: string) => Promise<void>;
	removeFriend: (friendId: string) => Promise<void>;

	// Friend requests
	fetchPendingRequests: () => Promise<void>;

	// Close friends operations
	fetchCloseFriends: () => Promise<void>;
	addCloseFriend: (friendId: string) => Promise<void>;
	removeCloseFriend: (friendId: string) => Promise<void>;

	// Search
	searchUsers: (query: string) => Promise<void>;
	clearSearchResults: () => void;

	// Block operations
	blockUser: (userId: string) => Promise<void>;
	unblockUser: (userId: string) => Promise<void>;
}

export const useFriendStore = create<FriendStore>((set, get) => ({
	friends: [],
	closeFriends: [],
	pendingRequests: [],
	searchResults: [],
	isLoading: false,
	error: null,

	fetchFriends: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/friends");
			set({ friends: response.data });
		} catch (error: any) {
			const errorMessage = error.response?.data?.message || "Failed to fetch friends";
			console.error("fetchFriends error:", errorMessage);
			set({ error: errorMessage, friends: [] }); // Set empty array on error
		} finally {
			set({ isLoading: false });
		}
	},

	sendFriendRequest: async (userId: string) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.post(`/friends/request/${userId}`);
			// Update search results to reflect new status
			set((state) => ({
				searchResults: state.searchResults.map((user) =>
					user._id === userId
						? { ...user, relationshipStatus: "pending" as const }
						: user
				),
			}));
		} catch (error: any) {
			set({ error: error.response?.data?.message || "Failed to send friend request" });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	acceptFriendRequest: async (requestId: string) => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.post(`/friends/accept/${requestId}`);
			// Remove from pending requests
			set((state) => ({
				pendingRequests: state.pendingRequests.filter((req) => req._id !== requestId),
				friends: [...state.friends, response.data.friend],
			}));
		} catch (error: any) {
			set({ error: error.response?.data?.message || "Failed to accept friend request" });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	rejectFriendRequest: async (requestId: string) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.post(`/friends/reject/${requestId}`);
			// Remove from pending requests
			set((state) => ({
				pendingRequests: state.pendingRequests.filter((req) => req._id !== requestId),
			}));
		} catch (error: any) {
			set({ error: error.response?.data?.message || "Failed to reject friend request" });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	removeFriend: async (friendId: string) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.delete(`/friends/${friendId}`);
			set((state) => ({
				friends: state.friends.filter((friend) => friend._id !== friendId),
				closeFriends: state.closeFriends.filter((friend) => friend._id !== friendId),
			}));
		} catch (error: any) {
			set({ error: error.response?.data?.message || "Failed to remove friend" });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	fetchPendingRequests: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/friends/requests");
			set({ pendingRequests: Array.isArray(response.data) ? response.data : [] });
		} catch (error: any) {
			const errorMessage = error.response?.data?.message || "Failed to fetch pending requests";
			console.error("fetchPendingRequests error:", errorMessage);
			set({ error: errorMessage, pendingRequests: [] });
		} finally {
			set({ isLoading: false });
		}
	},

	fetchCloseFriends: async () => {
		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get("/friends/close");
			set({ closeFriends: Array.isArray(response.data) ? response.data : [] });
		} catch (error: any) {
			const errorMessage = error.response?.data?.message || "Failed to fetch close friends";
			console.error("fetchCloseFriends error:", errorMessage);
			set({ error: errorMessage, closeFriends: [] }); // Set empty array on error
		} finally {
			set({ isLoading: false });
		}
	},

	addCloseFriend: async (friendId: string) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.post(`/friends/close/${friendId}`);
			// Find friend and add to close friends
			const friend = get().friends.find((f) => f._id === friendId);
			if (friend) {
				set((state) => ({
					closeFriends: [...state.closeFriends, friend],
				}));
			}
		} catch (error: any) {
			set({ error: error.response?.data?.message || "Failed to add close friend" });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	removeCloseFriend: async (friendId: string) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.delete(`/friends/close/${friendId}`);
			set((state) => ({
				closeFriends: state.closeFriends.filter((friend) => friend._id !== friendId),
			}));
		} catch (error: any) {
			set({ error: error.response?.data?.message || "Failed to remove close friend" });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	searchUsers: async (query: string) => {
		if (!query.trim()) {
			set({ searchResults: [] });
			return;
		}

		set({ isLoading: true, error: null });
		try {
			const response = await axiosInstance.get(`/friends/search?q=${encodeURIComponent(query)}`);
			set({ searchResults: Array.isArray(response.data) ? response.data : [] });
		} catch (error: any) {
			set({ error: error.response?.data?.message || "Failed to search users" });
		} finally {
			set({ isLoading: false });
		}
	},

	clearSearchResults: () => {
		set({ searchResults: [] });
	},

	blockUser: async (userId: string) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.post(`/friends/block/${userId}`);
			// Remove from friends and close friends if present
			set((state) => ({
				friends: state.friends.filter((friend) => friend._id !== userId),
				closeFriends: state.closeFriends.filter((friend) => friend._id !== userId),
				searchResults: state.searchResults.map((user) =>
					user._id === userId
						? { ...user, relationshipStatus: "blocked" as const }
						: user
				),
			}));
		} catch (error: any) {
			set({ error: error.response?.data?.message || "Failed to block user" });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},

	unblockUser: async (userId: string) => {
		set({ isLoading: true, error: null });
		try {
			await axiosInstance.delete(`/friends/block/${userId}`);
			set((state) => ({
				searchResults: state.searchResults.map((user) =>
					user._id === userId
						? { ...user, relationshipStatus: "stranger" as const }
						: user
				),
			}));
		} catch (error: any) {
			set({ error: error.response?.data?.message || "Failed to unblock user" });
			throw error;
		} finally {
			set({ isLoading: false });
		}
	},
}));
