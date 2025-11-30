import express from "express";
import {
  createComment,
  getComments,
  getComment,
  updateComment,
  deleteComment
} from "../controllers/commentController.js";

import { createCommentValidator } from "../validators/commentValidators.js";
import { validate } from "../middleware/validate.js";
import { protect } from "../middleware/authMiddleware.js";
const router = express.Router();

// Create Comment with validation
router.post("/", protect, createCommentValidator, validate, createComment);

router.get("/", getComments);
router.get("/:id",protect, getComment);
router.put("/:id",protect, updateComment);
router.delete("/:id",protect, deleteComment);

export default router;
