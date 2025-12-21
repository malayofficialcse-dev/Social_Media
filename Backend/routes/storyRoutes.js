import express from "express";
import { protect } from "../middleware/authMiddleware.js";
import { createStory, getStories, viewStory, deleteStory, likeStory, unlikeStory, voteStoryPoll, answerStoryQA } from "../controllers/storyController.js";
import { upload } from "../config/cloudinary.js";

const router = express.Router();

router.route("/")
  .post(protect, upload.fields([{ name: 'media', maxCount: 1 }, { name: 'song', maxCount: 1 }]), createStory)
  .get(protect, getStories);

router.route("/:id/view").put(protect, viewStory);
router.route("/:id/like").put(protect, likeStory);
router.route("/:id/unlike").put(protect, unlikeStory);
router.route("/:id").delete(protect, deleteStory);
router.post("/:id/vote", protect, voteStoryPoll);
router.post("/:id/answer-qa", protect, answerStoryQA);

export default router;
