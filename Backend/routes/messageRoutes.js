import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendMessage, allMessages, getChatList, markAsRead } from "../controllers/messageController.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.route("/").post(protect, upload.single('image'), sendMessage);
router.route("/chats").get(protect, getChatList);
router.route("/:userId").get(protect, allMessages);
router.route("/:userId/mark-read").put(protect, markAsRead);

export default router;
