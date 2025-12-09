import express from "express";
import { 
  registerUser, 
  loginUser, 
  getProfile, 
  getMe, 
  updateProfile, 
  getUserById, 
  followUser, 
  unfollowUser, 
  getAllUsers,
  searchUsers
} from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { registerValidator, loginValidator } from "../validators/userValidators.js";
import { validate } from "../middleware/validate.js";

import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.post("/register", registerValidator, validate, registerUser);
router.post("/login", loginValidator, validate, loginUser);
router.get("/profile", protect, getProfile);
router.get("/me", protect, getMe);
router.put("/profile", protect, upload.fields([{ name: 'profileImage', maxCount: 1 }, { name: 'backgroundImage', maxCount: 1 }]), updateProfile);
router.get("/search", protect, searchUsers);
router.get("/suggestions", protect, getAllUsers);
router.get("/:id", protect, getUserById);
router.put("/:id/follow", protect, followUser);
router.put("/:id/unfollow", protect, unfollowUser);

export default router;
