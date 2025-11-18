import { Song } from "../models/song.model.js";
import cloudinary from "../lib/cloudinary.js";

// Helper function to extract Cloudinary public_id from URL
const getCloudinaryPublicId = (url) => {
	try {
		// URL format: https://res.cloudinary.com/{cloud_name}/{resource_type}/upload/v{version}/{public_id}.{format}
		const parts = url.split('/');
		const uploadIndex = parts.indexOf('upload');
		if (uploadIndex === -1) return null;
		
		// Get everything after 'upload/v{version}/'
		const pathAfterUpload = parts.slice(uploadIndex + 2).join('/');
		// Remove file extension
		return pathAfterUpload.split('.')[0];
	} catch (error) {
		console.error("Error extracting public_id:", error);
		return null;
	}
};

// Helper function for cloudinary uploads
const uploadToCloudinary = async (file) => {
	try {
		const result = await cloudinary.uploader.upload(file.tempFilePath, {
			resource_type: "auto",
		});
		return result.secure_url;
	} catch (error) {
		console.log("Error in uploadToCloudinary", error);
		throw new Error("Error uploading to cloudinary");
	}
};

export const getAllSongs = async (req, res, next) => {
  try {
    // -1 = Descending => newest -> oldest
    // 1 = Ascending => oldest -> newest
    const songs = await Song.find().sort({ createdAt: -1 });
    res.json(songs);
  } catch (error) {
    next(error);
  }
};

export const getFeaturedSongs = async (req, res, next) => {
  try {
    // fetch 6 random songs using mongodb's aggregation pipeline
    const songs = await Song.aggregate([
      {
        $sample: { size: 6 },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: 1,
          imageUrl: 1,
          audioUrl: 1,
        },
      },
    ]);

    res.json(songs);
  } catch (error) {
    next(error);
  }
};

export const getMadeForYouSongs = async (req, res, next) => {
  try {
    const songs = await Song.aggregate([
      {
        $sample: { size: 4 },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: 1,
          imageUrl: 1,
          audioUrl: 1,
        },
      },
    ]);

    res.json(songs);
  } catch (error) {
    next(error);
  }
};

export const getTrendingSongs = async (req, res, next) => {
  try {
    const songs = await Song.aggregate([
      {
        $sample: { size: 4 },
      },
      {
        $project: {
          _id: 1,
          title: 1,
          artist: 1,
          imageUrl: 1,
          audioUrl: 1,
        },
      },
    ]);

    res.json(songs);
  } catch (error) {
    next(error);
  }
};

// Edit Song Details
export const updateSong = async (req, res, next) => {
	try {
		const { id } = req.params;
		const { 
			title, 
			artist, 
			albumId, 
			duration,
			description, 
			tags, 
			mood, 
			genre, 
			tempo, 
			language 
		} = req.body;

		const song = await Song.findById(id);
		if (!song) return res.status(404).json({ message: "Song not found" });

		// Update basic fields
		if (title) song.title = title;
		if (artist) song.artist = artist;
		if (duration) song.duration = parseInt(duration);
		if (albumId !== undefined) song.albumId = albumId === "none" ? null : albumId;

		// Update metadata fields
		if (description !== undefined) song.description = description || undefined;
		if (tags) song.tags = JSON.parse(tags);
		if (mood) song.mood = JSON.parse(mood);
		if (genre && genre !== "none") song.genre = genre;
		if (tempo && tempo !== "none") song.tempo = tempo;
		if (language !== undefined) song.language = language || undefined;

		// Handle image file upload
		if (req.files && req.files.imageFile) {
			const imageFile = req.files.imageFile;
			
			// Delete old image from Cloudinary
			const oldImagePublicId = getCloudinaryPublicId(song.imageUrl);
			if (oldImagePublicId) {
				try {
					await cloudinary.uploader.destroy(oldImagePublicId);
				} catch (error) {
					console.log("Error deleting old image:", error);
				}
			}
			
			// Upload new image
			song.imageUrl = await uploadToCloudinary(imageFile);
		}

		// Handle audio file upload
		if (req.files && req.files.audioFile) {
			const audioFile = req.files.audioFile;
			
			// Delete old audio from Cloudinary
			const oldAudioPublicId = getCloudinaryPublicId(song.audioUrl);
			if (oldAudioPublicId) {
				try {
					await cloudinary.uploader.destroy(oldAudioPublicId, { resource_type: 'video' });
				} catch (error) {
					console.log("Error deleting old audio:", error);
				}
			}
			
			// Upload new audio
			const uploadResult = await cloudinary.uploader.upload(audioFile.tempFilePath, {
				resource_type: 'video',
			});
			song.audioUrl = uploadResult.secure_url;
			if (uploadResult.duration) {
				song.duration = Math.round(uploadResult.duration);
			}
		}

		await song.save();
		res.json(song);
	} catch (error) {
		console.log("Error in updateSong:", error);
		next(error);
	}
};
