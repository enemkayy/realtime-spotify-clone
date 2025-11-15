import UsersListSkeleton from "@/components/skeletons/UsersListSkeleton";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useChatStore } from "@/stores/useChatStore";
import { Bot } from "lucide-react";

const UsersList = () => {
	const { users, selectedUser, isLoading, setSelectedUser, onlineUsers, isAIChat, setAIChat } = useChatStore();

	const handleSelectAI = () => {
		setAIChat(true);
		setSelectedUser(null);
	};

	const handleSelectUser = (user: any) => {
		setAIChat(false);
		setSelectedUser(user);
	};

	return (
		<div className='border-r border-zinc-800'>
			<div className='flex flex-col h-full'>
				<ScrollArea className='h-[calc(100vh-280px)]'>
					<div className='space-y-2 p-4'>
						{/* AI Assistant - Always at top */}
						<div
							onClick={handleSelectAI}
							className={`flex items-center justify-center lg:justify-start gap-3 p-3 
								rounded-lg cursor-pointer transition-colors
								${isAIChat ? "bg-zinc-800" : "hover:bg-zinc-800/50"}`}
						>
							<div className='relative'>
								<div className='size-8 md:size-12 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center'>
									<Bot className='size-4 md:size-6 text-white' />
								</div>
								{/* Always online */}
								<div className='absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-zinc-900 bg-green-500' />
							</div>

							<div className='flex-1 min-w-0 lg:block hidden'>
								<span className='font-medium truncate'>AI Music Assistant</span>
								<p className='text-xs text-emerald-400'>Get recommendations</p>
							</div>
						</div>

						{/* Divider */}
						<div className='border-t border-zinc-700 my-2' />

						{/* Real users */}
						{isLoading ? (
							<UsersListSkeleton />
						) : (
							users.map((user) => (
								<div
									key={user._id}
									onClick={() => handleSelectUser(user)}
									className={`flex items-center justify-center lg:justify-start gap-3 p-3 
										rounded-lg cursor-pointer transition-colors
                    ${selectedUser?.clerkId === user.clerkId ? "bg-zinc-800" : "hover:bg-zinc-800/50"}`}
								>
									<div className='relative'>
										<Avatar className='size-8 md:size-12'>
											<AvatarImage src={user.imageUrl} />
											<AvatarFallback>{user.fullName[0]}</AvatarFallback>
										</Avatar>
										{/* online indicator */}
										<div
											className={`absolute bottom-0 right-0 h-3 w-3 rounded-full ring-2 ring-zinc-900
                        ${onlineUsers.has(user.clerkId) ? "bg-green-500" : "bg-zinc-500"}`}
										/>
									</div>

									<div className='flex-1 min-w-0 lg:block hidden'>
										<span className='font-medium truncate'>{user.fullName}</span>
									</div>
								</div>
							))
						)}
					</div>
				</ScrollArea>
			</div>
		</div>
	);
};

export default UsersList;
