import { useAIChatStore } from "@/stores/useAIChatStore";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Loader, Send, Sparkles, Trash2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import SongRecommendationCard from "@/components/ai/SongRecommendationCard";
import MoodSelector from "@/components/ai/MoodSelector";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { useUser } from "@clerk/clerk-react";
import { Avatar, AvatarImage } from "@/components/ui/avatar";

const formatTime = (date: Date) => {
	return new Date(date).toLocaleTimeString("en-US", {
		day: "2-digit",
		month: "2-digit",
		year: "numeric",
		hour: "2-digit",
		minute: "2-digit",
		hour12: true,
	});
};

const AIChatInterface = () => {
	const { messages, isLoading, sendMessage, loadHistory, clearChat } = useAIChatStore();
	const [input, setInput] = useState("");
	const scrollRef = useRef<HTMLDivElement>(null);
	const { playAlbum } = usePlayerStore();
	const { user } = useUser();

	useEffect(() => {
		loadHistory();
	}, [loadHistory]);

	useEffect(() => {
		if (scrollRef.current) {
			scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
		}
	}, [messages, isLoading]);

	const handleSend = async () => {
		if (!input.trim() || isLoading) return;
		await sendMessage(input);
		setInput("");
	};

	const handleKeyDown = (e: React.KeyboardEvent) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			handleSend();
		}
	};

	const handleClearChat = async () => {
		if (window.confirm("Are you sure you want to clear all chat history?")) {
			await clearChat();
		}
	};

	return (
		<>
			{/* Header */}
			<div className='flex items-center gap-3 p-4 border-b border-zinc-800'>
				<div className='size-12 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center'>
					<Bot className='size-6 text-white' />
				</div>
				<div className='flex-1'>
					<h3 className='font-semibold'>AI Music Assistant</h3>
					<p className='text-xs text-emerald-400 flex items-center gap-1'>
						<span className='size-2 bg-emerald-400 rounded-full animate-pulse' />
						Always online
					</p>
				</div>
				{messages.length > 0 && (
					<Button
						variant='ghost'
						size='icon'
						onClick={handleClearChat}
						className='hover:text-red-400 hover:bg-red-500/10'
						title='Clear chat history'
					>
						<Trash2 className='size-4' />
					</Button>
				)}
			</div>

			{/* Messages */}
			<ScrollArea className='h-[calc(100vh-340px)]'>
				<div className='p-4 space-y-4' ref={scrollRef}>
					{messages.length === 0 ? (
						<div className='flex flex-col items-center justify-center h-full py-12 space-y-6'>
							<div className='size-20 rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center'>
								<Bot className='size-10 text-white' />
							</div>
							<div className='text-center space-y-2'>
								<h3 className='text-lg font-medium'>Start chatting with AI</h3>
								<p className='text-sm text-zinc-400 max-w-sm'>
									Ask me for music recommendations based on your mood, genre, or find similar songs!
								</p>
							</div>
							<div className='w-full max-w-md'>
								<MoodSelector onSelectMood={sendMessage} disabled={isLoading} />
							</div>
							<div className='flex flex-wrap gap-2 justify-center max-w-md'>
								<Button
									variant='outline'
									size='sm'
									onClick={() => sendMessage("Give me upbeat workout songs")}
									disabled={isLoading}
									className='text-xs bg-zinc-800/50 border-zinc-700 hover:border-emerald-500'
								>
									<Sparkles className='size-3 mr-1' />
									Workout songs
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={() => sendMessage("I want calm study music")}
									disabled={isLoading}
									className='text-xs bg-zinc-800/50 border-zinc-700 hover:border-emerald-500'
								>
									<Sparkles className='size-3 mr-1' />
									Study music
								</Button>
								<Button
									variant='outline'
									size='sm'
									onClick={() => sendMessage("Recommend romantic songs")}
									disabled={isLoading}
									className='text-xs bg-zinc-800/50 border-zinc-700 hover:border-emerald-500'
								>
									<Sparkles className='size-3 mr-1' />
									Romantic
								</Button>
							</div>
						</div>
					) : (
						<>
							{messages.map((msg, idx) => (
								<div
									key={idx}
									className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
								>
									<Avatar className='size-8 shrink-0'>
										{msg.role === "assistant" ? (
											<div className='size-full rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center'>
												<Bot className='size-4 text-white' />
											</div>
										) : (
											<AvatarImage src={user?.imageUrl} />
										)}
									</Avatar>

									<div
										className={`rounded-lg p-3 max-w-[70%] ${
											msg.role === "user" ? "bg-green-500" : "bg-zinc-800"
										}`}
									>
										<p className='text-sm leading-relaxed'>{msg.content}</p>

										{msg.metadata?.mood && (
											<div className='mt-2 inline-flex items-center gap-1.5 px-2 py-0.5 bg-zinc-900/50 rounded-full'>
												<Sparkles className='size-3 text-emerald-400' />
												<span className='text-xs text-emerald-400'>Mood:</span>
												<span className='text-xs text-zinc-300 capitalize'>{msg.metadata.mood}</span>
											</div>
										)}

										{msg.metadata?.reason && (
											<p className='text-xs text-zinc-400 mt-2 italic border-l-2 border-emerald-500/30 pl-2'>
												{msg.metadata.reason}
											</p>
										)}

										{msg.songs && msg.songs.length > 0 && (
											<div className='mt-3 space-y-2'>
												<div className='flex items-center justify-between'>
													<span className='text-xs text-zinc-400 font-medium'>
														{msg.songs.length} recommendations
													</span>
													<Button
														size='sm'
														variant='ghost'
														onClick={() => playAlbum(msg.songs!)}
														className='text-xs h-6 hover:text-emerald-400'
													>
														Play All
													</Button>
												</div>
												{msg.songs.map((song) => (
													<SongRecommendationCard key={song._id} song={song} />
												))}
											</div>
										)}

										<span className='text-xs text-zinc-400 mt-1 block'>{formatTime(msg.createdAt)}</span>
									</div>
								</div>
							))}

							{isLoading && (
								<div className='flex items-start gap-3'>
									<Avatar className='size-8'>
										<div className='size-full rounded-full bg-gradient-to-br from-emerald-500 to-sky-500 flex items-center justify-center'>
											<Bot className='size-4 text-white' />
										</div>
									</Avatar>
									<div className='bg-zinc-800 rounded-lg p-3'>
										<Loader className='size-5 animate-spin text-emerald-500' />
										<p className='text-xs text-zinc-400 mt-1'>Analyzing your request...</p>
									</div>
								</div>
							)}
						</>
					)}
				</div>
			</ScrollArea>

			{/* Input */}
			<div className='p-4 border-t border-zinc-800'>
				<div className='flex gap-2'>
					<Input
						value={input}
						onChange={(e) => setInput(e.target.value)}
						onKeyDown={handleKeyDown}
						placeholder='Ask AI for music recommendations...'
						className='bg-zinc-800 border-zinc-700 focus:border-emerald-500'
						disabled={isLoading}
					/>
					<Button onClick={handleSend} disabled={!input.trim() || isLoading} size='icon'>
						<Send className='size-4' />
					</Button>
				</div>
			</div>
		</>
	);
};

export default AIChatInterface;
