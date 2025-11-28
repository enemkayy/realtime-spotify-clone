import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
	{
		fullName: {
			type: String,
			required: true,
		},
		imageUrl: {
			type: String,
			required: true,
		},
		clerkId: {
			type: String,
			required: true,
			unique: true,
		},
		friends: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		closeFriends: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		friendRequests: [
			{
				from: {
					type: mongoose.Schema.Types.ObjectId,
					ref: "User",
					required: true,
				},
				status: {
					type: String,
					enum: ["pending", "accepted", "rejected"],
					default: "pending",
				},
				createdAt: {
					type: Date,
					default: Date.now,
				},
			},
		],
		sentRequests: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
		blockedUsers: [
			{
				type: mongoose.Schema.Types.ObjectId,
				ref: "User",
			},
		],
	},
	{ timestamps: true } //  createdAt, updatedAt
);

export const User = mongoose.model("User", userSchema);
