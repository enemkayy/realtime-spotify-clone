import { Router } from "express";
import { chatWithAI, findSimilarSongs, getChatHistory, clearChatHistory } from "../controller/ai.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

// Tất cả AI routes đều cần authentication
router.post("/chat", protectRoute, chatWithAI);
router.get("/similar/:songId", protectRoute, findSimilarSongs);
router.get("/history", protectRoute, getChatHistory);
router.delete("/history", protectRoute, clearChatHistory);

export default router;
