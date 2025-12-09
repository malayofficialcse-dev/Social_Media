import { body } from "express-validator";

export const postValidator = [
  body("title").optional(),
  body("content").optional()
];
