import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useFriendStore, UserWithRelationship } from "@/stores/useFriendStore";
import { Search, UserPlus, UserCheck, Clock, UserX } from "lucide-react";
import { useState } from "react";
import toast from "react-hot-toast";

interface AddFriendDialogProps {
	open: boolean;
	onOpenChange: (open: boolean) => void;
}

const AddFriendDialog = ({ open, onOpenChange }: AddFriendDialogProps) => {
	const { searchResults, searchUsers, clearSearchResults, sendFriendRequest, isLoading } = useFriendStore();
	const [searchQuery, setSearchQuery] = useState("");

	const handleSearch = async (query: string) => {
		setSearchQuery(query);
		if (query.trim()) {
			await searchUsers(query);
		} else {
			clearSearchResults();
		}
	};

	const handleSendRequest = async (userId: string) => {
		try {
			await sendFriendRequest(userId);
			toast.success("Friend request sent!");
		} catch (error) {
			toast.error("Failed to send friend request");
		}
	};

	const getRelationshipButton = (user: UserWithRelationship) => {
		switch (user.relationshipStatus) {
			case "friend":
				return (
					<Button variant="ghost" size="sm" disabled className="text-emerald-500">
						<UserCheck className="size-4 mr-1" />
						Friends
					</Button>
				);
			case "pending":
				return (
					<Button variant="ghost" size="sm" disabled className="text-yellow-500">
						<Clock className="size-4 mr-1" />
						Pending
					</Button>
				);
			case "received":
				return (
					<Button variant="ghost" size="sm" disabled className="text-blue-500">
						<Clock className="size-4 mr-1" />
						Received
					</Button>
				);
			case "blocked":
				return (
					<Button variant="ghost" size="sm" disabled className="text-red-500">
						<UserX className="size-4 mr-1" />
						Blocked
					</Button>
				);
			default:
				return (
					<Button
						variant="default"
						size="sm"
						onClick={() => handleSendRequest(user._id)}
						disabled={isLoading}
					>
						<UserPlus className="size-4 mr-1" />
						Add Friend
					</Button>
				);
		}
	};

	return (
		<Dialog open={open} onOpenChange={onOpenChange}>
			<DialogContent className="sm:max-w-[500px] bg-zinc-900 border-zinc-800">
				<DialogHeader>
					<DialogTitle>Add Friends</DialogTitle>
					<DialogDescription>Search for users and send them friend requests</DialogDescription>
				</DialogHeader>

				<div className="space-y-4">
					{/* Search Input */}
					<div className="relative">
						<Search className="absolute left-3 top-1/2 transform -translate-y-1/2 size-4 text-zinc-400" />
						<Input
							placeholder="Search by name or email..."
							value={searchQuery}
							onChange={(e) => handleSearch(e.target.value)}
							className="pl-10 bg-zinc-800 border-zinc-700"
						/>
					</div>

					{/* Search Results */}
					<ScrollArea className="h-[400px] rounded-md border border-zinc-800">
						<div className="p-4 space-y-3">
							{searchResults.length === 0 && searchQuery && !isLoading && (
								<div className="text-center text-zinc-400 py-8">
									<p>No users found</p>
								</div>
							)}

							{searchResults.length === 0 && !searchQuery && (
								<div className="text-center text-zinc-400 py-8">
									<Search className="size-12 mx-auto mb-4 opacity-50" />
									<p>Start typing to search for users</p>
								</div>
							)}

							{searchResults.map((user) => (
								<div
									key={user._id}
									className="flex items-center gap-3 p-3 rounded-lg bg-zinc-800/50 hover:bg-zinc-800 transition-colors"
								>
									<Avatar className="size-12 border border-zinc-700">
										<AvatarImage src={user.imageUrl} alt={user.fullName} />
										<AvatarFallback>{user.fullName[0]}</AvatarFallback>
									</Avatar>

									<div className="flex-1 min-w-0">
										<p className="font-medium text-white truncate">{user.fullName}</p>
									</div>

									{getRelationshipButton(user)}
								</div>
							))}
						</div>
					</ScrollArea>
				</div>
			</DialogContent>
		</Dialog>
	);
};

export default AddFriendDialog;
