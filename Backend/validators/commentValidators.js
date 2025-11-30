import { body } from "express-validator";

export const createCommentValidator = [
  body("post_id")
    .notEmpty().withMessage("post_id is required")
    .isMongoId().withMessage("Invalid post_id format"),

  body("content")
    .notEmpty().withMessage("Content cannot be empty")
    .isLength({ min: 3 }).withMessage("Comment must be at least 3 characters")
];
