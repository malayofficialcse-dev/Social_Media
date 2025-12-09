import express from "express";
import { 
  getNotifications, 
  markAsRead, 
  markAllAsRead, 
  deleteNotification,
  clearAllNotifications,
  getUnreadCount
} from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.use(protect);

router.get("/", getNotifications);
router.get("/unread-count", getUnreadCount);
router.put("/mark-all-read", markAllAsRead);
router.put("/:id/read", markAsRead);
router.delete("/clear-all", clearAllNotifications);
router.delete("/:id", deleteNotification);

export default router;
