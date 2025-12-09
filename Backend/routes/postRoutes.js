import express from "express";
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost,
  likePost,
  unlikePost,
  repostPost,
  getUserPosts
} from "../controllers/postController.js";
import { protect } from "../middleware/authMiddleware.js";
import { postValidator } from "../validators/postValidators.js";
import { validate } from "../middleware/validate.js";

import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.route("/")
  .post(protect, upload.single('image'), postValidator, validate, createPost)
  .get(getPosts);

router.get("/user/:userId", protect, getUserPosts);

router.route("/:id")
  .get(getPost)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.put("/:id/like", protect, likePost);
router.put("/:id/unlike", protect, unlikePost);
router.post("/:id/repost", protect, repostPost);

export default router;
