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
  getUserPosts,
  votePoll,
  answerQA
} from "../controllers/postController.js";
import { protect } from "../middleware/authMiddleware.js";
import { postValidator } from "../validators/postValidators.js";
import { validate } from "../middleware/validate.js";

import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.route("/")
  .post(protect, upload.array('images', 10), postValidator, validate, createPost)
  .get(getPosts);

router.get("/user/:userId", protect, getUserPosts);

router.route("/:id")
  .get(getPost)
  .put(protect, updatePost)
  .delete(protect, deletePost);

router.put("/:id/like", protect, likePost);
router.put("/:id/unlike", protect, unlikePost);
router.post("/:id/repost", protect, repostPost);
router.post("/:id/vote", protect, votePoll);
router.post("/:id/answer-qa", protect, answerQA);

export default router;
