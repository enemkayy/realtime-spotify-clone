import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { axiosInstance } from "@/lib/axios";
import { useMusicStore } from "@/stores/useMusicStore";
import { Plus, Upload, X } from "lucide-react";
import { useRef, useState } from "react";
import toast from "react-hot-toast";

interface NewSong {
	title: string;
	artist: string;
	album: string;
	duration: string;
	description: string;
	genre: string;
	tempo: string;
	language: string;
}

const MOODS = ["happy", "sad", "energetic", "calm", "romantic", "melancholic", "angry", "nostalgic"];
const GENRES = ["Pop", "Rock", "Jazz", "Hip-Hop", "Electronic", "R&B", "Country", "Classical","V-Pop", "K-Pop", "Other"];
const TEMPOS = [
	{ value: "slow", label: "Slow" },
	{ value: "medium", label: "Medium" },
	{ value: "fast", label: "Fast" },
];

const AddSongDialog = () => {
	const { albums } = useMusicStore();
	const [songDialogOpen, setSongDialogOpen] = useState(false);
	const [isLoading, setIsLoading] = useState(false);

	const [newSong, setNewSong] = useState<NewSong>({
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
		setIsLoading(true);

		try {
			if (!files.audio || !files.image) {
				return toast.error("Please upload both audio and image files");
			}

			const formData = new FormData();

			formData.append("title", newSong.title);
			formData.append("artist", newSong.artist);
			formData.append("duration", newSong.duration);
			
			if (newSong.album && newSong.album !== "none") {
				formData.append("albumId", newSong.album);
			}
			
			if (newSong.description) {
				formData.append("description", newSong.description);
			}
			
			if (tags.length > 0) {
				formData.append("tags", JSON.stringify(tags));
			}
			
			if (selectedMoods.length > 0) {
				formData.append("mood", JSON.stringify(selectedMoods));
			}
			
			if (newSong.genre) {
				formData.append("genre", newSong.genre);
			}
			
			if (newSong.tempo) {
				formData.append("tempo", newSong.tempo);
			}
			
			if (newSong.language) {
				formData.append("language", newSong.language);
			}

			formData.append("audioFile", files.audio);
			formData.append("imageFile", files.image);

			await axiosInstance.post("/admin/songs", formData, {
				headers: {
					"Content-Type": "multipart/form-data",
				},
			});

			setNewSong({
				title: "",
				artist: "",
				album: "",
				duration: "0",
				description: "",
				genre: "",
				tempo: "",
				language: "",
			});
			
			setSelectedMoods([]);
			setTags([]);

			setFiles({
				audio: null,
				image: null,
			});
			toast.success("Song added successfully");
			setSongDialogOpen(false);
		} catch (error: any) {
			toast.error("Failed to add song: " + error.message);
		} finally {
			setIsLoading(false);
		}
	};

	return (
		<Dialog open={songDialogOpen} onOpenChange={setSongDialogOpen}>
			<DialogTrigger asChild>
				<Button className='bg-emerald-500 hover:bg-emerald-600 text-black'>
					<Plus className='mr-2 h-4 w-4' />
					Add Song
				</Button>
			</DialogTrigger>

			<DialogContent className='bg-zinc-900 border-zinc-700 max-h-[80vh] overflow-auto'>
				<DialogHeader>
					<DialogTitle>Add New Song</DialogTitle>
					<DialogDescription>Add a new song to your music library</DialogDescription>
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

					{/* image upload area */}
					<div
						className='flex items-center justify-center p-6 border-2 border-dashed border-zinc-700 rounded-lg cursor-pointer'
						onClick={() => imageInputRef.current?.click()}
					>
						<div className='text-center'>
							{files.image ? (
								<div className='space-y-2'>
									<div className='text-sm text-emerald-500'>Image selected:</div>
									<div className='text-xs text-zinc-400'>{files.image.name.slice(0, 20)}</div>
								</div>
							) : (
								<>
									<div className='p-3 bg-zinc-800 rounded-full inline-block mb-2'>
										<Upload className='h-6 w-6 text-zinc-400' />
									</div>
									<div className='text-sm text-zinc-400 mb-2'>Upload artwork</div>
									<Button variant='outline' size='sm' className='text-xs'>
										Choose File
									</Button>
								</>
							)}
						</div>
					</div>

					{/* Audio upload */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Audio File</label>
						<div className='flex items-center gap-2'>
							<Button variant='outline' onClick={() => audioInputRef.current?.click()} className='w-full'>
								{files.audio ? files.audio.name.slice(0, 20) : "Choose Audio File"}
							</Button>
						</div>
					</div>

					{/* other fields */}
					<div className='space-y-2'>
						<label className='text-sm font-medium'>Title</label>
						<Input
							value={newSong.title}
							onChange={(e) => setNewSong({ ...newSong, title: e.target.value })}
							className='bg-zinc-800 border-zinc-700'
						/>
					</div>

					<div className='space-y-2'>
						<label className='text-sm font-medium'>Artist</label>
						<Input
							value={newSong.artist}
							onChange={(e) => setNewSong({ ...newSong, artist: e.target.value })}
							className='bg-zinc-800 border-zinc-700'
						/>
					</div>

					<div className='space-y-2'>
						<label className='text-sm font-medium'>Duration (seconds)</label>
						<Input
							type='number'
							min='0'
							value={newSong.duration}
							onChange={(e) => setNewSong({ ...newSong, duration: e.target.value || "0" })}
							className='bg-zinc-800 border-zinc-700'
						/>
					</div>

					<div className='space-y-2'>
						<label className='text-sm font-medium'>Album (Optional)</label>
						<Select
							value={newSong.album}
							onValueChange={(value) => setNewSong({ ...newSong, album: value })}
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
							value={newSong.description}
							onChange={(e) => setNewSong({ ...newSong, description: e.target.value })}
							placeholder='Describe the song, its vibe, story, or meaning...'
							className='bg-zinc-800 border-zinc-700 min-h-[80px]'
							maxLength={500}
						/>
						<div className='text-xs text-zinc-500 text-right'>
							{newSong.description.length}/500
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
										<X
											className='h-3 w-3 cursor-pointer'
											onClick={() => handleRemoveTag(tag)}
										/>
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
										id={mood}
										checked={selectedMoods.includes(mood)}
										onCheckedChange={() => toggleMood(mood)}
									/>
									<label
										htmlFor={mood}
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
						<Select value={newSong.genre} onValueChange={(value) => setNewSong({ ...newSong, genre: value })}>
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
						<Select value={newSong.tempo} onValueChange={(value) => setNewSong({ ...newSong, tempo: value })}>
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
							value={newSong.language}
							onChange={(e) => setNewSong({ ...newSong, language: e.target.value })}
							placeholder='e.g., English, Korean, Vietnamese...'
							className='bg-zinc-800 border-zinc-700'
						/>
					</div>
				</div>

				<DialogFooter>
					<Button variant='outline' onClick={() => setSongDialogOpen(false)} disabled={isLoading}>
						Cancel
					</Button>
					<Button onClick={handleSubmit} disabled={isLoading}>
						{isLoading ? "Uploading..." : "Add Song"}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
};
export default AddSongDialog;
