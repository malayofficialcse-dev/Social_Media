import express from "express";
import { protect, admin } from "../middleware/authMiddleware.js";
import { getDashboardStats, getAllUsers, deleteUser } from "../controllers/adminController.js";

const router = express.Router();

router.use(protect);
router.use(admin);

router.get("/stats", getDashboardStats);
router.get("/users", getAllUsers);
router.delete("/users/:id", deleteUser);

export default router;
