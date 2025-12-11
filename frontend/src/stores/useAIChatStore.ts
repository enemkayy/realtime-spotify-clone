import { axiosInstance } from "@/lib/axios";
import { AIMessage, AISimilarResponse } from "@/types";
import { create } from "zustand";
import toast from "react-hot-toast";

interface AIChatStore {
    messages: AIMessage[];
    isLoading: boolean;
    error: string | null;

    sendMessage: (message: string) => Promise<void>;
    findSimilarSongs: (songId: string) => Promise<AISimilarResponse>;
    loadHistory: () => Promise<void>;
    clearChat: () => Promise<void>;
}

export const useAIChatStore = create<AIChatStore>((set) => ({
    messages: [],
    isLoading: false,
    error: null,

    sendMessage: async (message: string) => {
        if (!message.trim()) return;

        set({ isLoading: true, error: null });

        // Add user message immediately
        const userMessage: AIMessage = {
            role: "user",
            content: message,
            createdAt: new Date(),
        };
        set((state) => ({ messages: [...state.messages, userMessage] }));

        try {
            const response = await axiosInstance.post("/ai/chat", { message });

            if (!response.data) {
                throw new Error("Invalid response from AI");
            }

            const { message: aiMessageText, songs, reason, mood, matchScore } = response.data;

            const aiMessage: AIMessage = {
                role: "assistant",
                content: aiMessageText || "I processed your request.",
                songs: songs || [],
                metadata: {
                    reason: reason || "Based on your request",
                    mood: mood || "mixed",
                    matchScore: matchScore ?? 0,
                },
                createdAt: new Date(),
            };

            set((state) => ({ messages: [...state.messages, aiMessage] }));

            // Show toast for empty results
            if (songs?.length === 0) {
                toast.error("No songs found matching your request. Try adding more songs!", {
                    duration: 4000,
                    icon: "💡",
                });
            }
        } catch (error: any) {
            console.error("AI chat error:", error);

            const errorMsg = error.response?.data?.message || error.message || "AI request failed";

            // Handle 401 specifically - DON'T auto-reload
            if (error.response?.status === 401) {
                const authErrorMessage: AIMessage = {
                    role: "assistant",
                    content: "🔒 You need to be logged in to use the AI assistant. Please sign in and try again.",
                    metadata: {
                        reason: "Authentication required",
                        mood: "error",
                        matchScore: 0,
                    },
                    createdAt: new Date(),
                };

                set((state) => ({
                    messages: [...state.messages, authErrorMessage],
                    error: "Not authenticated",
                }));

                toast.error("Please sign in to continue", {
                    duration: 4000,
                    icon: "🔒",
                });

                // Remove the auto-reload - let user manually refresh if needed
                return;
            }

            // Other errors
            const errorMessage: AIMessage = {
                role: "assistant",
                content: `Sorry, I encountered an error: ${errorMsg}`,
                metadata: {
                    reason: "Error occurred",
                    mood: "error",
                    matchScore: 0,
                },
                createdAt: new Date(),
            };

            set((state) => ({
                messages: [...state.messages, errorMessage],
                error: errorMsg,
            }));

            toast.error(errorMsg);
        } finally {
            set({ isLoading: false });
        }
    },

    findSimilarSongs: async (songId: string) => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get(`/ai/similar/${songId}`);

            if (!response.data || !response.data.songs) {
                throw new Error("Invalid response format");
            }

            return response.data;
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Failed to find similar songs";

            if (error.response?.status === 401) {
                toast.error("Please sign in to use this feature", { icon: "🔒" });
            } else {
                toast.error(errorMsg);
            }

            set({ error: errorMsg });
            throw error;
        } finally {
            set({ isLoading: false });
        }
    },

    loadHistory: async () => {
        set({ isLoading: true, error: null });
        try {
            const response = await axiosInstance.get("/ai/history");

            const messages = Array.isArray(response.data)
                ? response.data.map((msg: any) => ({
                        ...msg,
                        songs: msg.recommendations || [], // Map 'recommendations' to 'songs'
                        createdAt: new Date(msg.createdAt),
                  }))
                : [];

            set({ messages });
        } catch (error: any) {
            console.error("Failed to load history:", error);
            // Silent fail for history (not critical)
        } finally {
            set({ isLoading: false });
        }
    },

    clearChat: async () => {
        try {
            await axiosInstance.delete("/ai/history");
            set({ messages: [], error: null });
            toast.success("Chat history cleared");
        } catch (error: any) {
            const errorMsg = error.response?.data?.message || "Failed to clear history";

            if (error.response?.status === 401) {
                toast.error("Please sign in to clear history");
            } else {
                toast.error(errorMsg);
            }
        }
    },
}));