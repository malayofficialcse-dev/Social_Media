import { body } from "express-validator";

export const createCommentValidator = [
  body("content")
    .notEmpty().withMessage("Content cannot be empty")
    .isLength({ min: 3 }).withMessage("Comment must be at least 3 characters")
];
