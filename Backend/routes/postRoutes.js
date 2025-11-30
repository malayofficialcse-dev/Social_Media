import express from "express";
import {
  createPost,
  getPosts,
  getPost,
  updatePost,
  deletePost
} from "../controllers/postController.js";

import { createPostValidator } from "../validators/postValidators.js";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

// Create Post with validation
router.post("/", protect,createPostValidator, validate, createPost);

// CRUD operations
router.get("/", getPosts);
router.get("/:id",protect, getPost);
router.put("/:id", protect,updatePost);
router.delete("/:id",protect, deletePost);

export default router;
