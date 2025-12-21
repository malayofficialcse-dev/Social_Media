import asyncHandler from "express-async-handler";
import Story from "../Models/Story.js";
import User from "../Models/User.js";
import Notification from "../Models/Notification.js";
import { logAnalytics } from "../utils/analyticsHelper.js";

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private

// @desc    Like a story
// @route   PUT /api/stories/:id/like
// @access  Private
export const likeStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    res.status(404);
    throw new Error("Story not found");
  }

  if (story.likes.includes(req.user._id)) {
    res.status(400);
    throw new Error("Story already liked");
  }

  story.likes.push(req.user._id);
  await story.save();

  // Create notification
  if (story.user.toString() !== req.user._id.toString()) {
    const notification = await Notification.create({
      recipient: story.user,
      sender: req.user._id,
      type: "story_like",
      story: story._id,
    });

    const fullNotification = await Notification.findById(notification._id)
      .populate("sender", "username profileImage");

    if (req.io) {
      req.io.to(story.user.toString()).emit("notification received", {
        type: "story_like",
        sender: {
           _id: req.user._id,
           username: req.user.username,
           profileImage: req.user.profileImage
        },
        story: story._id,
        content: `${req.user.username} liked your story`
      });
    }
  }

  res.json({ success: true, likes: story.likes });
});

// @desc    Unlike a story
// @route   PUT /api/stories/:id/unlike
// @access  Private
export const unlikeStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    res.status(404);
    throw new Error("Story not found");
  }

  story.likes = story.likes.filter(id => id.toString() !== req.user._id.toString());
  await story.save();

  res.json({ success: true, likes: story.likes });
});
export const createStory = asyncHandler(async (req, res) => {
  // Support both single file (old) and fields (new)
  let mediaPath = null;
  let songPath = null;

  if (req.files) {
    if (req.files.media) mediaPath = req.files.media[0].path;
    if (req.files.song) songPath = req.files.song[0].path;
  } else if (req.file) {
    mediaPath = req.file.path;
  }

  if (!mediaPath) {
    res.status(400);
    throw new Error("No media file uploaded");
  }

  const { type, textContent, audioStart, audioDuration, widget } = req.body; 
  
  // Enforce 30s max duration logic if needed here, but stored as info
  const finalDuration = audioDuration ? Math.min(Number(audioDuration), 30) : 5;

  const story = await Story.create({
    user: req.user._id,
    media: mediaPath,
    type: type || 'image',
    textContent: textContent || "",
    audio: songPath || "",
    audioStart: Number(audioStart) || 0,
    audioDuration: finalDuration,
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), 
    widget: widget ? (typeof widget === 'string' ? JSON.parse(widget) : widget) : undefined,
  });

  const fullStory = await Story.findById(story._id).populate("user", "username profileImage");

  res.status(201).json(fullStory);
});

// @desc    Get all active stories (from following + self)
// @route   GET /api/stories
// @access  Private
export const getStories = asyncHandler(async (req, res) => {
  // Logic: Get stories from user and users they follow
  // For simplicity MVP: Get ALL active stories from all users (or just limit to recent)
  // To scale: Filter by req.user.following
  
  const currentUser = await User.findById(req.user._id);
  const following = currentUser.following; 
  following.push(req.user._id); // Include self

  const stories = await Story.find({
    user: { $in: following },
    expiresAt: { $gt: Date.now() }
  })
  .populate("user", "username profileImage")
  .populate("viewers.user", "username profileImage")
  .sort({ createdAt: 1 });

  // Group by user
  // Output format: [ { user: {..}, stories: [..] }, ... ]
  const groupedStories = {};
  
  stories.forEach(story => {
    const userId = story.user._id.toString();
    if (!groupedStories[userId]) {
      groupedStories[userId] = {
        user: story.user,
        stories: []
      };
    }
    groupedStories[userId].stories.push(story);
  });

  // Convert to array
  const result = Object.values(groupedStories);

  // Move current user to front if they have stories
  const myStoriesIndex = result.findIndex(group => group.user._id.toString() === req.user._id.toString());
  if (myStoriesIndex > -1) {
    const myStories = result.splice(myStoriesIndex, 1)[0];
    result.unshift(myStories);
  }

  res.json(result);
});

// @desc    View a story
// @route   PUT /api/stories/:id/view
// @access  Private
export const viewStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    res.status(404);
    throw new Error("Story not found");
  }

  // Check if already viewed
  const alreadyViewed = story.viewers.some(v => v.user.toString() === req.user._id.toString());
  
  if (!alreadyViewed) {
    story.viewers.push({ user: req.user._id });
    await story.save();
  }

  res.json({ success: true });
});

// @desc    Delete story
// @route   DELETE /api/stories/:id
// @access  Private
export const deleteStory = asyncHandler(async (req, res) => {
  const story = await Story.findById(req.params.id);

  if (!story) {
    res.status(404);
    throw new Error("Story not found");
  }

  if (story.user.toString() !== req.user._id.toString()) {
     res.status(401);
     throw new Error("Not authorized");
  }

  await Story.deleteOne({ _id: story._id });
  res.json({ message: "Story removed" });
});

// VOTE IN STORY POLL
export const voteStoryPoll = asyncHandler(async (req, res) => {
  const { optionIndex } = req.body;
  const story = await Story.findById(req.params.id);
  
  if (!story || !story.widget || story.widget.type !== 'poll') {
    res.status(404);
    throw new Error("Poll not found");
  }

  const hasVoted = story.widget.poll.options.some(opt => opt.votes.includes(req.user._id));
  if (hasVoted) {
    res.status(400);
    throw new Error("Already voted");
  }

  story.widget.poll.options[optionIndex].votes.push(req.user._id);
  await story.save();

  // Log engagement
  await logAnalytics('poll_vote', req.user._id, story.user, null, req.ip);

  res.json({ success: true, story });
});

// ANSWER STORY Q&A
export const answerStoryQA = asyncHandler(async (req, res) => {
  const { text } = req.body;
  const story = await Story.findById(req.params.id);

  if (!story || !story.widget || story.widget.type !== 'qa') {
    res.status(404);
    throw new Error("Q&A box not found");
  }

  story.widget.qa.answers.push({
    user: req.user._id,
    text
  });

  await story.save();
  
  // Log engagement
  await logAnalytics('qa_answer', req.user._id, story.user, null, req.ip);
  
  const populatedStory = await Story.findById(req.params.id)
    .populate("widget.qa.answers.user", "username profileImage");

  res.json({ success: true, story: populatedStory });
});
