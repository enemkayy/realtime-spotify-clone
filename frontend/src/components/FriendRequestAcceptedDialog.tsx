import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { CheckCircle2 } from "lucide-react";

interface FriendRequestAcceptedDialogProps {
  isOpen: boolean;
  onClose: () => void;
  friendName: string;
  friendImageUrl?: string;
}

export const FriendRequestAcceptedDialog = ({
  isOpen,
  onClose,
  friendName,
  friendImageUrl,
}: FriendRequestAcceptedDialogProps) => {
  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="sm:max-w-md"
        aria-describedby="friend-request-accepted-description"
      >
        <DialogHeader>
          <div className="flex items-center justify-center mb-4">
            <div className="relative">
              <Avatar className="h-20 w-20 border-4 border-green-500">
                <AvatarImage src={friendImageUrl} alt={friendName} />
                <AvatarFallback className="text-2xl">
                  {friendName?.charAt(0)?.toUpperCase() || "?"}
                </AvatarFallback>
              </Avatar>
              <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1">
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
            </div>
          </div>

          <DialogTitle className="text-center text-2xl">
            Friend Request Accepted! 🎉
          </DialogTitle>

          <DialogDescription
            id="friend-request-accepted-description"
            className="text-center text-base mt-2"
          >
            <span className="font-semibold text-white">{friendName}</span>{" "}
            accepted your friend request.
            <br />
            You can now see each other's activities and chat!
          </DialogDescription>
        </DialogHeader>

        <div className="flex justify-center mt-4">
          <Button
            onClick={onClose}
            className="px-10 py-2 bg-green-500 hover:bg-green-600"
          >
            OK
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
