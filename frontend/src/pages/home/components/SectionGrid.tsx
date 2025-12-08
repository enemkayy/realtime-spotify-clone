import { Song } from "@/types";
import SectionGridSkeleton from "./SectionGridSkeleton";
import { Button } from "@/components/ui/button";
import PlayButton from "./PlayButton";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

type SectionGridProps = {
	title: string;
	songs: Song[];
	isLoading: boolean;
};

const INITIAL_DISPLAY_COUNT = 4; // Show 4 songs initially

const SectionGrid = ({ songs, title, isLoading }: SectionGridProps) => {
	const [showAll, setShowAll] = useState(false);
	const navigate = useNavigate();

	if (isLoading) return <SectionGridSkeleton />;

	const displayedSongs = showAll ? songs : songs.slice(0, INITIAL_DISPLAY_COUNT);
	const hasMore = songs.length > INITIAL_DISPLAY_COUNT;

	const handleShowAll = () => {
		if (title === "Made For You") {
			navigate("/made-for-you");
		} else if (title === "Trending") {
			navigate("/trending");
		}
	};

	return (
		<div className='mb-8'>
			<div className='flex items-center justify-between mb-4'>
				<h2 className='text-xl sm:text-2xl font-bold'>{title}</h2>
				<Button 
					variant='link' 
					className='text-sm text-zinc-400 hover:text-white'
					onClick={handleShowAll}
				>
					Show all
				</Button>
			</div>

			<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4'>
				{displayedSongs.map((song) => (
					<div
						key={song._id}
						className='bg-zinc-800/40 p-4 rounded-md hover:bg-zinc-700/40 transition-all group cursor-pointer'
					>
						<div className='relative mb-4'>
							<div className='aspect-square rounded-md shadow-lg overflow-hidden'>
								<img
									src={song.imageUrl}
									alt={song.title}
									className='w-full h-full object-cover transition-transform duration-300 
									group-hover:scale-105'
								/>
							</div>
							<PlayButton song={song} />
						</div>
						<h3 className='font-medium mb-2 truncate'>{song.title}</h3>
						<p className='text-sm text-zinc-400 truncate'>{song.artist}</p>
					</div>
				))}
			</div>
		</div>
	);
};
export default SectionGrid;
