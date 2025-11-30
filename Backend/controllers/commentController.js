import Comment from "../Models/Comment.js";

// Create Comment
export const createComment = async (req, res) => {
  try {
    req.body.author_id = req.user._id;
    const comment = await Comment.create(req.body);
    res.status(201).json(comment);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get comments for a Post
export const getComments = async (req, res) => {
  try {
    const comments = await Comment.find({ post_id: req.query.post_id })
      .populate("author_id", "username")
      .populate("post_id", "title");
    res.json(comments);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single Comment
export const getComment = async (req, res) => {
  try {
    const comment = await Comment.findById(req.params.id)
      .populate("author_id", "username")
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
    const updated = await Comment.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete Comment
export const deleteComment = async (req, res) => {
  try {
    await Comment.findByIdAndDelete(req.params.id);
    res.json({ message: "Comment deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
