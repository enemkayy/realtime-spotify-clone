import mongoose from "mongoose";

const songSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    artist: {
      type: String,
      required: true,
    },
    description: {
      type: String,
      maxlength: 500,
    },
    tags: [
      {
        type: String,
        lowercase: true,
      },
    ],
    mood: [
      {
        type: String,
        enum: [
          "happy",
          "sad",
          "energetic",
          "calm",
          "romantic",
          "melancholic",
          "angry",
          "nostalgic",
        ],
      },
    ],
    genre: {
      type: String,
      enum: [
        "Pop",
        "Rock",
        "Jazz",
        "Hip-Hop",
        "Electronic",
        "R&B",
        "Country",
        "Classical",
        "V-Pop",
        "K-Pop",
        "Other",
      ],
    },
    tempo: {
      type: String,
      enum: ["slow", "medium", "fast"],
    },
    language: String,
    imageUrl: {
      type: String,
      required: true,
    },
    audioUrl: {
      type: String,
      required: true,
    },
    duration: {
      type: Number,
      required: true,
    },
    albumId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Album",
      required: false,
    },
  },
  { timestamps: true }
);

export const Song = mongoose.model("Song", songSchema);
