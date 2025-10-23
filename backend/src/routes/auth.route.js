import { Router } from "express";
import { authCallback } from "../controller/auth.controller.js";
import { protectRoute } from "../middleware/auth.middleware.js";

const router = Router();

router.post("/callback", authCallback);

export default router;
