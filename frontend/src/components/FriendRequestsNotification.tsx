import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { useFriendStore } from "@/stores/useFriendStore";
import { Bell, Check, X } from "lucide-react";
import { useEffect } from "react";
import toast from "react-hot-toast";

const FriendRequestsNotification = () => {
	const { pendingRequests, fetchPendingRequests, acceptFriendRequest, rejectFriendRequest } = useFriendStore();

	useEffect(() => {
		fetchPendingRequests().catch(err => {
			console.error("Failed to fetch pending requests:", err);
		});
		// Poll for new requests every 30 seconds
		const interval = setInterval(() => {
			fetchPendingRequests().catch(err => {
				console.error("Failed to fetch pending requests:", err);
			});
		}, 30000);
		return () => clearInterval(interval);
	}, [fetchPendingRequests]);

	const handleAccept = async (requestId: string) => {
		try {
			await acceptFriendRequest(requestId);
			toast.success("Friend request accepted!");
		} catch (error) {
			toast.error("Failed to accept friend request");
		}
	};

	const handleReject = async (requestId: string) => {
		try {
			await rejectFriendRequest(requestId);
			toast.success("Friend request rejected");
		} catch (error) {
			toast.error("Failed to reject friend request");
		}
	};

	return (
		<Dialog>
			<DialogTrigger asChild>
				<Button variant="ghost" size="icon" className="size-8 relative">
					<Bell className="size-4" />
					{pendingRequests.length > 0 && (
						<Badge 
							variant="destructive" 
							className="absolute -top-1 -right-1 size-5 p-0 flex items-center justify-center text-[10px]"
						>
							{pendingRequests.length}
						</Badge>
					)}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
				<DialogHeader>
					<DialogTitle>Friend Requests</DialogTitle>
				</DialogHeader>

				<ScrollArea className="max-h-[400px] rounded-md border border-zinc-800">
					{pendingRequests.length === 0 ? (
						<div className="p-8 text-center text-zinc-400">
							<Bell className="size-12 mx-auto mb-4 opacity-50" />
							<p className="text-sm">No friend requests</p>
						</div>
					) : (
						<div className="p-4 space-y-3">
							{pendingRequests.map((request) => (
								<div
									key={request._id}
									className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
								>
									<Avatar className="size-10 border border-zinc-700">
										<AvatarImage src={request.from.imageUrl} alt={request.from.fullName} />
										<AvatarFallback>{request.from.fullName[0]}</AvatarFallback>
									</Avatar>

									<div className="flex-1 min-w-0">
										<p className="font-medium text-sm text-white truncate">
											{request.from.fullName}
										</p>
										<p className="text-xs text-zinc-400">
											{new Date(request.createdAt).toLocaleDateString()}
										</p>
									</div>

									<div className="flex gap-1">
										<Button
											variant="ghost"
											size="icon"
											className="size-8 hover:bg-green-500/20 hover:text-green-500"
											onClick={() => handleAccept(request._id)}
											title="Accept"
										>
											<Check className="size-4" />
										</Button>
										<Button
											variant="ghost"
											size="icon"
											className="size-8 hover:bg-red-500/20 hover:text-red-500"
											onClick={() => handleReject(request._id)}
											title="Reject"
										>
											<X className="size-4" />
										</Button>
									</div>
								</div>
							))}
						</div>
					)}
				</ScrollArea>
			</DialogContent>
		</Dialog>
	);
};

export default FriendRequestsNotification;
