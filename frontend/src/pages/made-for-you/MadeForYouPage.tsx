import Topbar from "@/components/Topbar";
import { useMusicStore } from "@/stores/useMusicStore";
import { useEffect } from "react";
import { ScrollArea } from "@/components/ui/scroll-area";
import PlayButton from "../home/components/PlayButton";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

const MadeForYouPage = () => {
	const { fetchMadeForYouSongs, madeForYouSongs, isLoading } = useMusicStore();
	const navigate = useNavigate();

	useEffect(() => {
		// Force re-fetch to get latest data
		fetchMadeForYouSongs();
	}, [fetchMadeForYouSongs]);

	console.log("Made For You Songs:", madeForYouSongs.length, madeForYouSongs);

	return (
		<main className='rounded-md overflow-hidden h-full bg-gradient-to-b from-zinc-800 to-zinc-900'>
			<Topbar />
			<ScrollArea className='h-[calc(100vh-180px)]'>
				<div className='p-4 sm:p-6'>
					<Button
						variant='ghost'
						className='mb-4 text-zinc-400 hover:text-white'
						onClick={() => navigate(-1)}
					>
						<ArrowLeft className='mr-2 h-4 w-4' />
						Back
					</Button>

					<div className='mb-6'>
						<h1 className='text-3xl sm:text-4xl font-bold mb-2'>Made For You</h1>
						<p className='text-zinc-400'>
							{madeForYouSongs.length} {madeForYouSongs.length === 1 ? 'song' : 'songs'}
						</p>
					</div>

					{isLoading ? (
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
							{[...Array(10)].map((_, i) => (
								<div key={i} className='bg-zinc-800/40 p-4 rounded-md animate-pulse'>
									<div className='aspect-square rounded-md bg-zinc-700 mb-4' />
									<div className='h-4 bg-zinc-700 rounded mb-2' />
									<div className='h-3 bg-zinc-700 rounded w-2/3' />
								</div>
							))}
						</div>
					) : (
						<div className='grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-4'>
							{madeForYouSongs.map((song) => (
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
					)}

					{!isLoading && madeForYouSongs.length === 0 && (
						<div className='text-center py-12'>
							<p className='text-zinc-400 text-lg'>No songs available yet</p>
						</div>
					)}
				</div>
			</ScrollArea>
		</main>
	);
};

export default MadeForYouPage;
