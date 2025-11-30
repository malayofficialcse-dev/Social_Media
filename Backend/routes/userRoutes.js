import express from "express";
import { registerUser, loginUser, getProfile } from "../controllers/userController.js";
import { protect } from "../middleware/authMiddleware.js";
import { registerValidator, loginValidator } from "../validators/userValidators.js";
import { validate } from "../middleware/validate.js";

const router = express.Router();

router.post("/register", registerValidator, validate, registerUser);
router.post("/login", loginValidator, validate, loginUser);
router.get("/profile", protect, getProfile);

export default router;
