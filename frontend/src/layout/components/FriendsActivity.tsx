import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/useChatStore";
import { useFriendStore } from "@/stores/useFriendStore";
import { useUser } from "@clerk/clerk-react";
import { HeadphonesIcon, Music, Users, UserPlus, Heart, X } from "lucide-react";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import AddFriendDialog from "@/components/AddFriendDialog";
import FriendRequestsNotification from "@/components/FriendRequestsNotification";

const FriendsActivity = () => {
	const { onlineUsers, userActivities } = useChatStore();
	const { friends, closeFriends, fetchFriends, fetchCloseFriends, addCloseFriend, removeCloseFriend, removeFriend, isLoading } = useFriendStore();
	const { user } = useUser();
	const [addFriendDialogOpen, setAddFriendDialogOpen] = useState(false);

	useEffect(() => {
		if (user) {
			fetchFriends().catch(err => {
				console.error("Failed to fetch friends:", err);
			});
			fetchCloseFriends().catch(err => {
				console.error("Failed to fetch close friends:", err);
			});
		}
	}, [fetchFriends, fetchCloseFriends, user]);

	// Map closeFriends array to a Set for faster lookup
	const closeFriendIds = new Set(closeFriends.map((f) => f._id));

	// Sort friends: Close friends first, then alphabetically
	const sortedFriends = [...friends].sort((a, b) => {
		const aIsCloseFriend = closeFriendIds.has(a._id);
		const bIsCloseFriend = closeFriendIds.has(b._id);

		// Close friends go first
		if (aIsCloseFriend && !bIsCloseFriend) return -1;
		if (!aIsCloseFriend && bIsCloseFriend) return 1;

		// If both are close friends or both are regular friends, sort alphabetically
		return a.fullName.localeCompare(b.fullName);
	});

	const handleToggleCloseFriend = async (friendId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		try {
			if (closeFriendIds.has(friendId)) {
				await removeCloseFriend(friendId);
			} else {
				await addCloseFriend(friendId);
			}
		} catch (error) {
			console.error("Failed to toggle close friend:", error);
		}
	};

	const handleRemoveFriend = async (friendId: string, e: React.MouseEvent) => {
		e.stopPropagation();
		if (confirm("Are you sure you want to remove this friend?")) {
			try {
				await removeFriend(friendId);
			} catch (error) {
				console.error("Failed to remove friend:", error);
			}
		}
	};

	return (
		<div className='h-full bg-zinc-900 rounded-lg flex flex-col'>
			<div className='p-4 flex justify-between items-center border-b border-zinc-800'>
				<div className='flex items-center gap-2'>
					<Users className='size-5 shrink-0' />
					<h2 className='font-semibold'>Friends Activity</h2>
				</div>
				<div className='flex items-center gap-1'>
					<FriendRequestsNotification />
					<Button
						variant='ghost'
						size='icon'
						className='size-8'
						onClick={() => setAddFriendDialogOpen(true)}
					>
						<UserPlus className='size-4' />
					</Button>
				</div>
			</div>

			{!user && <LoginPrompt />}

			<ScrollArea className='flex-1'>
				<div className='p-4 space-y-4'>
					{friends.length === 0 && user && (
						<div className='text-center text-zinc-400 text-sm py-8'>
							<p>No friends yet!</p>
							<p className='text-xs mt-1'>Click the + button to add friends</p>
						</div>
					)}

					{sortedFriends.map((friend) => {
						const activity = userActivities.get(friend.clerkId);
						const isOnline = onlineUsers.has(friend.clerkId);
						
					// Check if I added this friend to MY close friends (for heart icon)
					const iAddedThemToCloseFriends = closeFriendIds.has(friend._id);
					
					// Check if THEY added ME to THEIR close friends (for seeing their song)
					// closeFriends is populated with { clerkId } objects from backend
					const theyAddedMeToCloseFriends = Array.isArray(friend.closeFriends) && 
						friend.closeFriends.some((cf: any) => 
							typeof cf === 'string' ? cf === user?.id : cf.clerkId === user?.id
						);						const isPlaying = activity && activity !== "Idle";

						// Privacy rule: Only show song if friend added me to their close friends
						const showSongDetails = theyAddedMeToCloseFriends && isPlaying;

						return (
							<div
								key={friend._id}
								className='cursor-pointer hover:bg-zinc-800/50 p-3 rounded-md transition-colors group'
							>
								<div className='flex items-start gap-3'>
									<div className='relative'>
										<Avatar className='size-10 border border-zinc-800'>
											<AvatarImage src={friend.imageUrl} alt={friend.fullName} />
											<AvatarFallback>{friend.fullName[0]}</AvatarFallback>
										</Avatar>
										<div
											className={`absolute bottom-0 right-0 h-3 w-3 rounded-full border-2 border-zinc-900 
												${isOnline ? "bg-green-500" : "bg-zinc-500"}
												`}
											aria-hidden='true'
										/>
									</div>

									<div className='flex-1 min-w-0'>
										<div className='flex items-center gap-2'>
											<span className='font-medium text-sm text-white'>{friend.fullName}</span>
											{showSongDetails && <Music className='size-3.5 text-emerald-400 shrink-0' />}
										</div>

										{showSongDetails ? (
											<div className='mt-1'>
												<div className='mt-1 text-sm text-white font-medium truncate'>
													{activity.replace("Playing ", "").split(" by ")[0]}
												</div>
												<div className='text-xs text-zinc-400 truncate'>
													{activity.split(" by ")[1]}
												</div>
											</div>
										) : (
											<div className='mt-1 text-xs text-zinc-400'>
												{isOnline ? "Online" : "Offline"}
											</div>
										)}
									</div>

									{/* Action Buttons */}
									<div className='flex items-center gap-1'>
										{/* Unfriend Button */}
										<Button
											variant='ghost'
											size='icon'
											className='size-8 opacity-0 group-hover:opacity-100 transition-opacity'
											onClick={(e) => handleRemoveFriend(friend._id, e)}
											title="Unfriend (remove completely)"
										>
											<X className='size-4 text-zinc-400 hover:text-red-400' />
										</Button>

										{/* Heart Icon - Toggle Close Friend */}
										<Button
											variant='ghost'
											size='icon'
											className={`size-8 transition-opacity ${
												iAddedThemToCloseFriends 
													? 'opacity-100' // Always visible for close friends
													: 'opacity-0 group-hover:opacity-100' // Show on hover for regular friends
											}`}
											onClick={(e) => handleToggleCloseFriend(friend._id, e)}
											title={
												iAddedThemToCloseFriends
													? "Remove from close friends (click to turn off)"
													: "Add to close friends (they can see your songs)"
											}
										>
											<Heart
												className={`size-4 ${
													iAddedThemToCloseFriends ? "fill-red-500 text-red-500" : "text-zinc-400"
												}`}
											/>
										</Button>
									</div>
								</div>
							</div>
						);
					})}
				</div>
			</ScrollArea>

			<AddFriendDialog open={addFriendDialogOpen} onOpenChange={setAddFriendDialogOpen} />
		</div>
	);
};
export default FriendsActivity;

const LoginPrompt = () => (
	<div className='h-full flex flex-col items-center justify-center p-6 text-center space-y-4'>
		<div className='relative'>
			<div
				className='absolute -inset-1 bg-gradient-to-r from-emerald-500 to-sky-500 rounded-full blur-lg
       opacity-75 animate-pulse'
				aria-hidden='true'
			/>
			<div className='relative bg-zinc-900 rounded-full p-4'>
				<HeadphonesIcon className='size-8 text-emerald-400' />
			</div>
		</div>

		<div className='space-y-2 max-w-[250px]'>
			<h3 className='text-lg font-semibold text-white'>See What Friends Are Playing</h3>
			<p className='text-sm text-zinc-400'>Login to discover what music your friends are enjoying right now</p>
		</div>
	</div>
);
