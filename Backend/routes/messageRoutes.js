import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { sendMessage, allMessages, getChatList, markAsRead, markAsDelivered, reactToMessage, deleteMessage } from "../controllers/messageController.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.route("/").post(protect, upload.fields([{ name: 'image', maxCount: 1 }, { name: 'audio', maxCount: 1 }]), sendMessage);
router.route("/chats").get(protect, getChatList);
router.route("/:messageId/react").put(protect, reactToMessage);
router.route("/:messageId/delete").put(protect, deleteMessage);
router.route("/:userId/mark-read").put(protect, markAsRead);
router.route("/:userId/mark-delivered").put(protect, markAsDelivered);
router.route("/:userId").get(protect, allMessages);

export default router;
