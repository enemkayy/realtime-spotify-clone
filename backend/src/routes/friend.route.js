import { Router } from "express";
import { protectRoute } from "../middleware/auth.middleware.js";
import {
	sendFriendRequest,
	acceptFriendRequest,
	rejectFriendRequest,
	removeFriend,
	getFriends,
	getPendingRequests,
	searchUsers,
	addCloseFriend,
	removeCloseFriend,
	getCloseFriends,
	blockUser,
	unblockUser,
} from "../controller/friend.controller.js";

const router = Router();

// Friend requests
router.post("/request/:userId", protectRoute, sendFriendRequest);
router.post("/accept/:requestId", protectRoute, acceptFriendRequest);
router.post("/reject/:requestId", protectRoute, rejectFriendRequest);

// Friend management
router.delete("/:friendId", protectRoute, removeFriend);
router.get("/", protectRoute, getFriends);
router.get("/requests", protectRoute, getPendingRequests);

// Search
router.get("/search", protectRoute, searchUsers);

// Close friends
router.post("/close/:friendId", protectRoute, addCloseFriend);
router.delete("/close/:friendId", protectRoute, removeCloseFriend);
router.get("/close", protectRoute, getCloseFriends);

// Block
router.post("/block/:userId", protectRoute, blockUser);
router.delete("/block/:userId", protectRoute, unblockUser);

export default router;
