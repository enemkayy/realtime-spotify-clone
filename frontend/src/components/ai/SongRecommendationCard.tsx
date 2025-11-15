import { Song } from "@/types";
import { usePlayerStore } from "@/stores/usePlayerStore";
import { Play, Pause } from "lucide-react";
import { Button } from "@/components/ui/button";

interface SongRecommendationCardProps {
	song: Song;
}

const SongRecommendationCard = ({ song }: SongRecommendationCardProps) => {
	const { currentSong, isPlaying, setCurrentSong, togglePlay } = usePlayerStore();
	const isCurrentSong = currentSong?._id === song._id;

	const handlePlay = () => {
		if (isCurrentSong) {
			togglePlay();
		} else {
			setCurrentSong(song);
		}
	};

	return (
		<div className='flex items-center gap-3 p-2 bg-zinc-900/50 rounded-lg hover:bg-zinc-900 transition group'>
			<div className='relative'>
				<img src={song.imageUrl} alt={song.title} className='size-12 rounded object-cover' />
				<Button
					size='icon'
					variant='ghost'
					onClick={handlePlay}
					className='absolute inset-0 m-auto size-8 bg-emerald-500 hover:bg-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity'
				>
					{isCurrentSong && isPlaying ? (
						<Pause className='size-3 text-black fill-black' />
					) : (
						<Play className='size-3 text-black fill-black' />
					)}
				</Button>
			</div>

			<div className='flex-1 min-w-0'>
				<p className='font-medium text-sm truncate'>{song.title}</p>
				<p className='text-xs text-zinc-400 truncate'>{song.artist}</p>
			</div>
		</div>
	);
};

export default SongRecommendationCard;
