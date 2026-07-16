import Comment from "../Models/Comment.js";
import Post from "../Models/Post.js";
import Notification from "../Models/Notification.js";
import { logAnalytics } from "../utils/analyticsHelper.js";

// Create Comment
export const createComment = async (req, res) => {
  try {
    req.body.author_id = req.user._id;
    if (req.params.postId) {
      req.body.post_id = req.params.postId;
    }
    
    const comment = await Comment.create(req.body);
    
    const populatedComment = await Comment.findById(comment._id)
      .populate("author_id", "username profileImage")
      .populate("post_id", "title");

    // Create notification
    const post = await Post.findById(req.body.post_id);
    if (post && post.author_id.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author_id,
        sender: req.user._id,
        type: "comment",
        post: post._id
      });
    }

    // Log Analytics
    if (post) {
      await logAnalytics('post_comment', req.user._id, post.author_id, post._id, req.ip);
    }

    res.status(201).json(populatedComment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get comments for a Post
export const getComments = async (req, res) => {
  try {
    const postId = req.params.postId || req.query.post_id;
    const comments = await Comment.find({ post_id: postId })
      .populate("author_id", "username profileImage")
      .populate("post_id", "title")
      .sort({ createdAt: -1 });
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single Comment
export const getComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate("author_id", "username profileImage")
      .populate("post_id", "title");
    if (!comment) return res.status(404).json({ message: "Comment not found" });
    res.json(comment);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Comment
export const updateComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.author_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updated = await Comment.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("author_id", "username profileImage");
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete Comment
export const deleteComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id);
    
    if (!comment) {
      return res.status(404).json({ message: "Comment not found" });
    }

    if (comment.author_id.toString() !== req.user._id.toString() && req.user.role !== "admin") {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
