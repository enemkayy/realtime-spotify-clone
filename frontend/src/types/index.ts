export interface Song {
	_id: string;
	title: string;
	artist: string;
	description?: string;
	tags?: string[];
	mood?: string[];
	genre?: string;
	tempo?: "slow" | "medium" | "fast";
	language?: string;
	albumId: string | null;
	imageUrl: string;
	audioUrl: string;
	duration: number;
	createdAt: string;
	updatedAt: string;
}

export interface Album {
	_id: string;
	title: string;
	artist: string;
	imageUrl: string;
	releaseYear: number;
	songs: Song[];
}

export interface Stats {
	totalSongs: number;
	totalAlbums: number;
	totalUsers: number;
	totalArtists: number;
}

export interface Message {
	_id: string;
	senderId: string;
	receiverId: string;
	content: string;
	createdAt: string;
	updatedAt: string;
}

export interface User {
	_id: string;
	clerkId: string;
	fullName: string;
	imageUrl: string;
	closeFriends?: string[] | { clerkId: string }[];
}

export interface AIMessage {
	_id?: string;
	role: "user" | "assistant";
	content: string;
	songs?: Song[];
	metadata?: {
		reason?: string;
		mood?: string;
		genre?: string;
		matchScore?: number;
	};
	createdAt: Date;
}

export interface AISimilarResponse {
	targetSong: Song;
	reason: string;
	matchCriteria: string[];
	songs: Song[];
}
