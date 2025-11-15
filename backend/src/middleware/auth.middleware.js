import { clerkClient } from "@clerk/express";

export const protectRoute = async (req, res, next) => {
	// Debug logs
	console.log("🔍 protectRoute check:");
	console.log("- req.auth:", req.auth);
	console.log("- userId:", req.auth?.userId);
	console.log("- headers:", req.headers.authorization);
	
	if (!req.auth?.userId) {
		console.error("❌ No userId found in request");
		return res.status(401).json({ message: "Unauthorized - you must be logged in" });
	}
	
	console.log("✅ Auth successful, userId:", req.auth.userId);
	next();
};

export const requireAdmin = async (req, res, next) => {
	try {
		console.log("👑 requireAdmin check:");
		console.log("- ADMIN_EMAIL from .env:", process.env.ADMIN_EMAIL);
		
		const currentUser = await clerkClient.users.getUser(req.auth.userId);
		console.log("- Current user email:", currentUser.primaryEmailAddress?.emailAddress);
		console.log("- User ID:", req.auth.userId);
		
		const isAdmin = process.env.ADMIN_EMAIL === currentUser.primaryEmailAddress?.emailAddress;
		console.log("- isAdmin:", isAdmin);

		if (!isAdmin) {
			console.error("❌ Not admin - access denied");
			return res.status(403).json({ message: "Unauthorized - you must be an admin" });
		}

		console.log("✅ Admin access granted");
		next();
	} catch (error) {
		console.error("❌ requireAdmin error:", error);
		next(error);
	}
};
