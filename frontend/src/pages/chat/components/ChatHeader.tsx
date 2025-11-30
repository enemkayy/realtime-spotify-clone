import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useChatStore } from "@/stores/useChatStore";
import { Sparkles } from "lucide-react";

const ChatHeader = () => {
    const { selectedUser, onlineUsers } = useChatStore();

    if (!selectedUser) return null;

    const isAIAssistant = selectedUser._id === "ai-music-assistant";

    return (
        <div className='p-4 border-b border-zinc-800'>
            <div className='flex items-center gap-3'>

                {isAIAssistant ? (
                    <div className="relative">
                        <div className="size-10 rounded-full overflow-hidden border-2 border-purple-400/50">
                            <img 
                                src="/ai-avatar.jpg" 
                                alt="AI Music Assistant"
                                className="w-full h-full object-cover"
                            />
                        </div>
                        <Sparkles className="absolute -top-1 -right-1 size-3 text-yellow-400 fill-yellow-400 animate-pulse" />
                    </div>
                ) : (
                    <Avatar>
                        <AvatarImage src={selectedUser.imageUrl} />
                        <AvatarFallback>{selectedUser.fullName[0]}</AvatarFallback>
                    </Avatar>
                )}

                <div className="flex-1">
                    <div className="flex items-center gap-2">
                        <h2 className='font-medium'>{selectedUser.fullName}</h2>
                        {isAIAssistant && (
                            <span className="text-xs bg-purple-500/20 text-purple-400 px-2 py-0.5 rounded-full">AI</span>
                        )}
                    </div>
                    <p className='text-sm text-zinc-400'>
                        {isAIAssistant 
                            ? "Powered by Gemini • Always Online"
                            : onlineUsers.has(selectedUser.clerkId)
                                ? "Online"
                                : "Offline"
                        }
                    </p>
                </div>

            </div>
        </div>
    );
};

export default ChatHeader;
