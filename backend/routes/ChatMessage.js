import express from "express";
import { protect } from "../middlewares/auth.js";
import { sendMessage } from "../controllers/ChatMessaging.js";

const router = express.Router();

router.post("/sendMessage/:id", protect, sendMessage);

export default router;
