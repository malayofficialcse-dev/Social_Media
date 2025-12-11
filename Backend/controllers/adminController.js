import User from "../Models/User.js";
import Post from "../Models/Post.js";
import Comment from "../Models/Comment.js";

// Get Dashboard Stats
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalPosts = await Post.countDocuments();
    const totalComments = await Comment.countDocuments();

    res.json({
      totalUsers,
      totalPosts,
      totalComments
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Users
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Delete User
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // Delete user's posts
    await Post.deleteMany({ author_id: user._id });
    
    // Delete user's comments
    await Comment.deleteMany({ author_id: user._id });

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.json({ message: "User and associated data deleted" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get All Posts
export const getAllPosts = async (req, res) => {
  try {
    const posts = await Post.find()
      .populate("author_id", "username email profileImage")
      .sort({ createdAt: -1 });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get Analytics
export const getAnalytics = async (req, res) => {
  try {
    const getLast7Days = () => {
      const dates = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        dates.push(d.toISOString().split('T')[0]);
      }
      return dates;
    };

    const dates = getLast7Days();

    const getDailyCounts = async (Model) => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      
      const data = await Model.aggregate([
        {
          $match: {
            createdAt: { $gte: sevenDaysAgo }
          }
        },
        {
          $group: {
            _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
            count: { $sum: 1 }
          }
        }
      ]);
      return data;
    };

    const [users, posts, comments] = await Promise.all([
      getDailyCounts(User),
      getDailyCounts(Post),
      getDailyCounts(Comment)
    ]);

    const analytics = dates.map(date => {
      const userCount = users.find(u => u._id === date)?.count || 0;
      const postCount = posts.find(p => p._id === date)?.count || 0;
      const commentCount = comments.find(c => c._id === date)?.count || 0;
      return {
        name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }), // Mon, Tue
        date,
        users: userCount,
        posts: postCount,
        comments: commentCount
      };
    });

    res.json(analytics);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
