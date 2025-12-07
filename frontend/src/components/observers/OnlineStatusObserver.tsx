import { useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";

/**
 * Observer Pattern: Concrete Observer for Online Status
 * Observes socket events for user online/offline changes
 * Updates useChatStore state accordingly
 */
export const OnlineStatusObserver = () => {
  const { socket, updateOnlineUsers } = useChatStore();

  useEffect(() => {
    if (!socket) return;

    // Observer Pattern: Listen for user online event
    const handleUserOnline = (onlineUsers: string[]) => {
      console.log("🟢 [Observer] Users online update:", onlineUsers.length);
      updateOnlineUsers(onlineUsers);
    };

    // Observer Pattern: Listen for user connected event
    const handleUserConnected = (userId: string) => {
      console.log("🟢 [Observer] User connected:", userId);
      useChatStore.getState().onlineUsers.add(userId);
      updateOnlineUsers(Array.from(useChatStore.getState().onlineUsers));
    };

    // Observer Pattern: Listen for user disconnected event
    const handleUserDisconnected = (userId: string) => {
      console.log("⚫ [Observer] User disconnected:", userId);
      useChatStore.getState().onlineUsers.delete(userId);
      updateOnlineUsers(Array.from(useChatStore.getState().onlineUsers));
    };

    // Attach observers
    socket.on("users_online", handleUserOnline);
    socket.on("user_connected", handleUserConnected);
    socket.on("user_disconnected", handleUserDisconnected);

    // Detach observers on cleanup
    return () => {
      socket.off("users_online", handleUserOnline);
      socket.off("user_connected", handleUserConnected);
      socket.off("user_disconnected", handleUserDisconnected);
    };
  }, [socket, updateOnlineUsers]);

  return null; // Observer component doesn't render anything
};
