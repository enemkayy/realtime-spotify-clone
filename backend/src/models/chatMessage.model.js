import mongoose from "mongoose";

const chatMessageSchema = new mongoose.Schema(
	{
		userId: {
			type: String,
			required: true,
			index: true,
		},
		role: {
			type: String,
			enum: ["user", "assistant"],
			required: true,
		},
		content: {
			type: String,
			required: true,
		},
		recommendations: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "Song",
			},
		],
		metadata: {
			reason: String,
			mood: String,
			genre: String,
		},
		cacheInvalidated: {
			type: Boolean,
			default: false,
		},
	},
	{ timestamps: true }
);

// Index để query nhanh chat history của user
chatMessageSchema.index({ userId: 1, createdAt: -1 });

export const ChatMessage = mongoose.model("ChatMessage", chatMessageSchema);
