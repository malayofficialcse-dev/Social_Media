import Post from "../Models/Post.js";
import Notification from "../Models/Notification.js";
import Comment from "../Models/Comment.js";

// Create Post
export const createPost = async (req, res) => {
  try {
    const { title, content } = req.body;
    const images = req.files ? req.files.map(file => file.path) : [];

    req.body.author_id = req.user._id;
    const post = await Post.create({
      title,
      content,
      images,
      author_id: req.user._id
    });
    const populatedPost = await Post.findById(post._id)
      .populate("author_id", "username email profileImage");
    res.status(201).json(populatedPost);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Get all Posts
export const getPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author_id", "username email profileImage")
      .populate("originalPost")
      .populate({
        path: "originalPost",
        populate: {
          path: "author_id",
          select: "username email profileImage"
        }
      })
      .sort({ createdAt: -1 });

    const postsWithCounts = await Promise.all(posts.map(async (post) => {
      const commentsCount = await Comment.countDocuments({ post_id: post._id });
      return { ...post.toObject(), commentsCount };
    }));

    res.json(postsWithCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get single Post
export const getPost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("author_id", "username email profileImage")
      .populate("originalPost");
    if (!post) return res.status(404).json({ message: "Post not found" });
    res.json(post);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Update Post
export const updatePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    const updated = await Post.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate("author_id", "username email profileImage");
    res.json(updated);
  } catch (err) {
    res.status(400).json({ message: err.message });
  }
};

// Delete Post
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.author_id.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await Post.findByIdAndDelete(req.params.id);
    
    // Delete associated comments
    await Comment.deleteMany({ post_id: req.params.id });
    
    // Delete associated notifications
    await Notification.deleteMany({ post: req.params.id });
    
    res.json({ message: "Post deleted" });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Like Post
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if already liked
    if (post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: "Post already liked" });
    }

    post.likes.push(req.user._id);
    await post.save();

    // Create notification if not own post
    if (post.author_id.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: post.author_id,
        sender: req.user._id,
        type: "like",
        post: post._id
      });
    }

    const updatedPost = await Post.findById(post._id)
      .populate("author_id", "username email profileImage");

    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Unlike Post
export const unlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);
    
    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if not liked
    if (!post.likes.includes(req.user._id)) {
      return res.status(400).json({ message: "Post not liked yet" });
    }

    post.likes = post.likes.filter(id => id.toString() !== req.user._id.toString());
    await post.save();

    const updatedPost = await Post.findById(post._id)
      .populate("author_id", "username email profileImage");

    res.json(updatedPost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Repost
export const repostPost = async (req, res) => {
  try {
    const originalPost = await Post.findById(req.params.id);
    
    if (!originalPost) {
      return res.status(404).json({ message: "Post not found" });
    }

    // Check if already reposted
    if (originalPost.reposts.includes(req.user._id)) {
      return res.status(400).json({ message: "Already reposted" });
    }

    // Add to reposts array
    originalPost.reposts.push(req.user._id);
    await originalPost.save();

    // Create a new repost
    const repost = await Post.create({
      title: originalPost.title,
      content: originalPost.content,
      images: originalPost.images,
      author_id: req.user._id,
      isRepost: true,
      originalPost: originalPost._id
    });

    // Create notification
    if (originalPost.author_id.toString() !== req.user._id.toString()) {
      await Notification.create({
        recipient: originalPost.author_id,
        sender: req.user._id,
        type: "repost",
        post: originalPost._id
      });
    }

    const populatedRepost = await Post.findById(repost._id)
      .populate("author_id", "username email profileImage")
      .populate({
        path: "originalPost",
        populate: {
          path: "author_id",
          select: "username email profileImage"
        }
      });

    res.status(201).json(populatedRepost);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

// Get user's posts
export const getUserPosts = async (req, res) => {
  try {
    const posts = await Post.find({ author_id: req.params.userId })
      .populate("author_id", "username email profileImage")
      .populate("originalPost")
      .populate({
        path: "originalPost",
        populate: {
          path: "author_id",
          select: "username email profileImage"
        }
      })
      .sort({ createdAt: -1 });

    const postsWithCounts = await Promise.all(posts.map(async (post) => {
      const commentsCount = await Comment.countDocuments({ post_id: post._id });
      return { ...post.toObject(), commentsCount };
    }));

    res.json(postsWithCounts);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
