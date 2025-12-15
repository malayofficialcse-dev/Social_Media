import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createGroup, getUserGroups, updateGroup, addMembers, removeMember, makeAdmin, getGroupById } from "../controllers/groupController.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.route("/").post(protect, upload.single("image"), createGroup);
router.route("/").get(protect, getUserGroups);
router.route("/:id").get(protect, getGroupById);
router.route("/:id").put(protect, upload.single("image"), updateGroup);
router.route("/:id/add").put(protect, addMembers);
router.route("/:id/remove").put(protect, removeMember);
router.route("/:id/make-admin").put(protect, makeAdmin);

export default router;
