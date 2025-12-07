import { useEffect, useState } from "react";
import { FriendRequestAcceptedDialog } from "@/components/FriendRequestAcceptedDialog";

/**
 * Observer Pattern: Concrete Observer for Friend Activities
 * Listens to custom events triggered by socket listeners in useChatStore
 * Updates UI state and shows notifications
 */
export const FriendActivityObserver = () => {
  // State for accepted dialog
  const [acceptedDialog, setAcceptedDialog] = useState<{
    isOpen: boolean;
    friendName: string;
    friendImageUrl?: string;
  }>({
    isOpen: false,
    friendName: "",
    friendImageUrl: undefined,
  });

  useEffect(() => {
    // Listen for custom event from useChatStore
    const handleFriendRequestAccepted = (event: any) => {
      const data = event.detail;
      console.log("✅ [Observer Component] Friend request accepted event received:", data);
      
      // Show dialog
      setAcceptedDialog({
        isOpen: true,
        friendName: data.accepterName || "Someone",
        friendImageUrl: data.accepterImageUrl,
      });
    };

    // Attach event listener
    window.addEventListener("friend-request-accepted", handleFriendRequestAccepted);

    // Cleanup
    return () => {
      window.removeEventListener("friend-request-accepted", handleFriendRequestAccepted);
    };
  }, []);

  return (
    <FriendRequestAcceptedDialog
      isOpen={acceptedDialog.isOpen}
      onClose={() => setAcceptedDialog({ isOpen: false, friendName: "", friendImageUrl: undefined })}
      friendName={acceptedDialog.friendName}
      friendImageUrl={acceptedDialog.friendImageUrl}
    />
  );
};
