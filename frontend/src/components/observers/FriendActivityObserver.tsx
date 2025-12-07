import { useEffect } from "react";
import { useChatStore } from "@/stores/useChatStore";
import { useFriendStore } from "@/stores/useFriendStore";
import toast from "react-hot-toast";

/**
 * Observer Pattern: Concrete Observer for Friend Activities
 * Observes socket events for friend requests and user activities
 * Updates UI state and shows notifications
 */
export const FriendActivityObserver = () => {
  const { socket } = useChatStore();
  const { 
    fetchPendingRequests, 
    incrementPendingRequestsCount, 
    updateSearchResultStatus 
  } = useFriendStore();

  useEffect(() => {
    if (!socket) return;

    // Observer Pattern: Listen for new friend request
    const handleNewFriendRequest = (request: any) => {
      console.log("📨 [Observer] New friend request received:", request);
      
      // Update pending requests count
      incrementPendingRequestsCount();
      
      // Refresh pending requests list
      fetchPendingRequests();
      
      // Show toast notification
      toast.success(`${request.senderData?.fullName || "Someone"} sent you a friend request!`, {
        duration: 4000,
        icon: "👋",
      });
    };

    // Observer Pattern: Listen for friend request acceptance
    const handleFriendRequestAccepted = (data: any) => {
      console.log("✅ [Observer] Friend request accepted:", data);
      
      // Show toast notification
      toast.success(`${data.accepterName || "Someone"} accepted your friend request!`, {
        duration: 4000,
        icon: "🎉",
      });
      
      // Refresh friends list
      fetchPendingRequests();
    };

    // Observer Pattern: Listen for friend request rejection
    const handleFriendRequestRejected = (data: any) => {
      console.log("❌ [Observer] Friend request rejected:", data);
      
      // Update search results if viewing
      updateSearchResultStatus(data.rejectedBy, "none");
      
      // Show toast notification (optional, might be too harsh)
      // toast.error("Friend request was declined", { duration: 3000 });
    };

    // Observer Pattern: Listen for activity updates
    const handleActivityUpdated = (data: { userId: string; activity: string }) => {
      console.log("🎵 [Observer] Activity updated:", data);
      
      // Could update UI to show what friends are listening to
      // For now, just log it
    };

    // Attach observers
    socket.on("new_friend_request", handleNewFriendRequest);
    socket.on("friend_request_accepted", handleFriendRequestAccepted);
    socket.on("friend_request_rejected", handleFriendRequestRejected);
    socket.on("activity_updated", handleActivityUpdated);

    // Detach observers on cleanup
    return () => {
      socket.off("new_friend_request", handleNewFriendRequest);
      socket.off("friend_request_accepted", handleFriendRequestAccepted);
      socket.off("friend_request_rejected", handleFriendRequestRejected);
      socket.off("activity_updated", handleActivityUpdated);
    };
  }, [socket, fetchPendingRequests, incrementPendingRequestsCount, updateSearchResultStatus]);

  return null; // Observer component doesn't render anything
};
