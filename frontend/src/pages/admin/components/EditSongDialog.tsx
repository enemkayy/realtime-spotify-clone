import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { axiosInstance } from "@/lib/axios";
import { useMusicStore } from "@/stores/useMusicStore";
import { Upload, X } from "lucide-react";
import { useRef, useState, useEffect } from "react";
import toast from "react-hot-toast";
import { Song } from "@/types";

interface EditSongDialogProps {
	song: Song | null;
	isOpen: boolean;
	onClose: () => void;
}

const MOODS = ["happy", "sad", "energetic", "calm", "romantic", "melancholic", "angry", "nostalgic"];
const GENRES = ["Pop", "Rock", "Jazz", "Hip-Hop", "Electronic", "R&B", "Country", "Classical", "K-Pop", "Other"];
const TEMPOS = [
	{ value: "slow", label: "Slow" },
	{ value: "medium", label: "Medium" },
	{ value: "fast", label: "Fast" },
];

const EditSongDialog = ({ song, isOpen, onClose }: EditSongDialogProps) => {
	const { albums, fetchSongs, fetchAlbums } = useMusicStore();
	const [isLoading, setIsLoading] = useState(false);

	const [editedSong, setEditedSong] = useState({
		title: "",
		artist: "",
		album: "",
		duration: "0",
		description: "",
		genre: "",
		tempo: "",
		language: "",
	});

	const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
	const [tags, setTags] = useState<string[]>([]);
	const [tagInput, setTagInput] = useState("");

	const [files, setFiles] = useState<{ audio: File | null; image: File | null }>({
		audio: null,
		image: null,
	});

	const audioInputRef = useRef<HTMLInputElement>(null);
	const imageInputRef = useRef<HTMLInputElement>(null);

	// Populate form when song changes
	useEffect(() => {
		if (song) {
			setEditedSong({
				title: song.title || "",
				artist: song.artist || "",
				album: song.albumId || "none",
				duration: song.duration?.toString() || "0",
				description: song.description || "",
				genre: song.genre || "",
				tempo: song.tempo || "",
				language: song.language || "",
			});
			setSelectedMoods(song.mood || []);
			setTags(song.tags || []);
		}
	}, [song]);

	const handleAddTag = () => {
		if (tagInput.trim() && !tags.includes(tagInput.trim().toLowerCase())) {
			setTags([...tags, tagInput.trim().toLowerCase()]);
			setTagInput("");
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		setTags(tags.filter((tag) => tag !== tagToRemove));
	};

	const toggleMood = (mood: string) => {
		setSelectedMoods((prev) =>
			prev.includes(mood) ? prev.filter((m) => m !== mood) : [...prev, mood]
		);
	};

	const handleSubmit = async () => {
		if (!song) return;
		
		setIsLoading(true);

		try {
			const formData = new FormData();

			formData.append("title", editedSong.title);
			formData.append("artist", editedSong.artist);
			formData.append("duration", editedSong.duration);

			if (editedSong.album && editedSong.album !== "none") {
				formData.append("albumId", editedSong.album);
			}

			if (editedSong.description) {
				formData.append("description", editedSong.description);
			}

			if (tags.length > 0) {
				formData.append("tags", JSON.stringify(tags));
			}

			if (selectedMoods.length > 0) {
				formData.append("mood", JSON.stringify(selectedMoods));
			}

			if (editedSong.genre && editedSong.genre !== "none") {
				formData.append("genre", editedSong.genre);
			}

			if (editedSong.tempo && editedSong.tempo !== "none") {
				formData.append("tempo", editedSong.tempo);
			}

			if (editedSong.language) {
				formData.append("language", editedSong.language);
			}

			if (files.audio) {
				formData.append("audioFile", files.audio);
			}

			if (files.image) {
				formData.append("imageFile", files.image);
			}

			await axiosInstance.put(`/songs/${song._id}`, formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			toast.success("Song updated successfully");
			await fetchSongs();
			await fetchAlbums(); // Refresh albums to show updated songs
			onClose();
		} catch (error: any) {
			console.error("Error updating song:", error);
			toast.error("Failed to update song: " + (error.response?.data?.message || error.message));
		} finally {
			setIsLoading(false);
		}
	};

	if (!song) return null;

	return (
		<Dialog open={isOpen} onOpenChange={onClose}>
			<DialogContent className='bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto'>
				<DialogHeader>
					<DialogTitle>Edit Song</DialogTitle>
					<DialogDescription>Update song details and metadata</DialogDescription>
				</DialogHeader>

				<div className='space-y-4 py-4'>
					<input
						type='file'
						accept='audio/*'
						ref={audioInputRef}
						hidden
						onChange={(e) => setFiles((prev) => ({ ...prev, audio: e.target.files![0] }))}
					/>

					<input
						type='file'
						ref={imageInputRef}
						className='hidden'
						accept='image/*'
						onChange={(e) => setFiles((prev) => ({ ...prev, image: e.target.files![0] }))}
					/>

					{/* Current Image Preview */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Cover Image</label>
						<div
							className='flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer'
							onClick={() => imageInputRef.current?.click()}
						>
							<div className='text-center'>
								{files.image ? (
									<div className='space-y-2'>
										<div className='text-sm text-emerald-500'>New image selected:</div>
										<div className='text-xs text-zinc-400'>{files.image.name.slice(0, 30)}</div>
									</div>
								) : (
									<>
										<img
											src={song.imageUrl}
											alt={song.title}
											className='w-32 h-32 object-cover rounded-lg mx-auto mb-2'
										/>
										<div className='text-sm text-zinc-400 mb-2'>Click to change image</div>
										<Button variant='outline' size='sm' className='text-xs'>
											Choose New Image
										</Button>
									</>
								)}
							</div>
						</div>
					</div>

					{/* Audio File */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Audio File (Optional - leave empty to keep current)</label>
						<div className='flex items-center gap-2'>
							<Button variant='outline' onClick={() => audioInputRef.current?.click()} className='w-full'>
								{files.audio ? files.audio.name.slice(0, 30) : "Choose New Audio File"}
							</Button>
						</div>
					</div>

					{/* Title */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Title</label>
						<Input
							value={editedSong.title}
							onChange={(e) => setEditedSong({ ...editedSong, title: e.target.value })}
							className='bg-zinc-800 border-zinc-700'
						/>
					</div>

					{/* Artist */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Artist</label>
						<Input
							value={editedSong.artist}
							onChange={(e) => setEditedSong({ ...editedSong, artist: e.target.value })}
							className='bg-zinc-800 border-zinc-700'
						/>
					</div>

					{/* Duration */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Duration (seconds)</label>
						<Input
							type='number'
							min='0'
							value={editedSong.duration}
							onChange={(e) => setEditedSong({ ...editedSong, duration: e.target.value || "0" })}
							className='bg-zinc-800 border-zinc-700'
						/>
					</div>

					{/* Album */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Album (Optional)</label>
						<Select
							value={editedSong.album}
							onValueChange={(value) => setEditedSong({ ...editedSong, album: value })}
						>
							<SelectTrigger className='bg-zinc-800 border-zinc-700'>
								<SelectValue placeholder='Select album' />
							</SelectTrigger>
							<SelectContent className='bg-zinc-800 border-zinc-700'>
								<SelectItem value='none'>No Album (Single)</SelectItem>
								{albums.map((album) => (
									<SelectItem key={album._id} value={album._id}>
										{album.title}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Description */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Description (Optional)</label>
						<Textarea
							value={editedSong.description}
							onChange={(e) => setEditedSong({ ...editedSong, description: e.target.value })}
							placeholder='Describe the song, its vibe, story, or meaning...'
							className='bg-zinc-800 border-zinc-700 min-h-[80px]'
							maxLength={500}
						/>
						<div className='text-xs text-zinc-500 text-right'>
							{editedSong.description.length}/500
						</div>
					</div>

					{/* Tags */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Tags (Optional)</label>
						<div className='flex gap-2'>
							<Input
								value={tagInput}
								onChange={(e) => setTagInput(e.target.value)}
								onKeyPress={(e) => e.key === "Enter" && (e.preventDefault(), handleAddTag())}
								placeholder='Add tags (e.g., lofi, upbeat, acoustic)...'
								className='bg-zinc-800 border-zinc-700'
							/>
							<Button type='button' onClick={handleAddTag} variant='outline' size='sm'>
								Add
							</Button>
						</div>
						{tags.length > 0 && (
							<div className='flex flex-wrap gap-2 mt-2'>
								{tags.map((tag) => (
									<Badge key={tag} variant='secondary' className='gap-1'>
										{tag}
										<X className='h-3 w-3 cursor-pointer' onClick={() => handleRemoveTag(tag)} />
									</Badge>
								))}
							</div>
						)}
					</div>

					{/* Mood */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Mood (Optional - Select multiple)</label>
						<div className='grid grid-cols-2 gap-2'>
							{MOODS.map((mood) => (
								<div key={mood} className='flex items-center space-x-2'>
									<Checkbox
										id={`edit-${mood}`}
										checked={selectedMoods.includes(mood)}
										onCheckedChange={() => toggleMood(mood)}
									/>
									<label
										htmlFor={`edit-${mood}`}
										className='text-sm capitalize cursor-pointer select-none'
									>
										{mood}
									</label>
								</div>
							))}
						</div>
					</div>

					{/* Genre */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Genre (Optional)</label>
						<Select
							value={editedSong.genre}
							onValueChange={(value) => setEditedSong({ ...editedSong, genre: value })}
						>
							<SelectTrigger className='bg-zinc-800 border-zinc-700'>
								<SelectValue placeholder='Select genre' />
							</SelectTrigger>
							<SelectContent className='bg-zinc-800 border-zinc-700'>
								<SelectItem value='none'>No Genre</SelectItem>
								{GENRES.map((genre) => (
									<SelectItem key={genre} value={genre}>
										{genre}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Tempo */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Tempo (Optional)</label>
						<Select
							value={editedSong.tempo}
							onValueChange={(value) => setEditedSong({ ...editedSong, tempo: value })}
						>
							<SelectTrigger className='bg-zinc-800 border-zinc-700'>
								<SelectValue placeholder='Select tempo' />
							</SelectTrigger>
							<SelectContent className='bg-zinc-800 border-zinc-700'>
								<SelectItem value='none'>No Tempo</SelectItem>
								{TEMPOS.map((tempo) => (
									<SelectItem key={tempo.value} value={tempo.value}>
										{tempo.label}
									</SelectItem>
								))}
							</SelectContent>
						</Select>
					</div>

					{/* Language */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Language (Optional)</label>
						<Input
							value={editedSong.language}
							onChange={(e) => setEditedSong({ ...editedSong, language: e.target.value })}
							placeholder='e.g., English, Korean, Vietnamese...'
							className='bg-zinc-800 border-zinc-700'
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={onClose} disabled={isLoading}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={isLoading}>
						{isLoading ? "Updating..." : "Update Song"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};

export default EditSongDialog;
