import User from "../Models/User.js";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import Notification from "../Models/Notification.js";
import { sendWelcomeEmail, sendLoginNotificationEmail } from "../utils/emailService.js";
import { logAnalytics } from "../utils/analyticsHelper.js";
import Analytics from "../Models/Analytics.js";
import Post from "../Models/Post.js";
import Comment from "../Models/Comment.js";

// Generate Token
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "7d" });
};

// REGISTER USER
export const registerUser = async (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    const userExists = await User.findOne({ email });
    if (userExists)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await User.create({
      username,
      email,
      password: hashedPassword,
    });

    // Send welcome email
    sendWelcomeEmail(user.email, user.username);

    return res.status(201).json({
      message: "User registered successfully",
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        backgroundImage: user.backgroundImage,
        isPro: user.isPro,
        isVerified: user.isVerified,
        profileTheme: user.profileTheme,
      },
      token: generateToken(user._id),
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOGIN USER
export const loginUser = async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user)
      return res.status(400).json({ message: "Invalid email or password" });

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid email or password" });

    // Send login notification email
    sendLoginNotificationEmail(user.email, user.username);

    res.json({
      message: "Login successful",
      token: generateToken(user._id),
      user: {
        _id: user._id,
        username: user.username,
        email: user.email,
        bio: user.bio,
        profileImage: user.profileImage,
        backgroundImage: user.backgroundImage,
        followers: user.followers,
        following: user.following,
        role: user.role,
        isPro: user.isPro,
        isVerified: user.isVerified,
        profileTheme: user.profileTheme,
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET LOGGED-IN USER PROFILE
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("followers", "username profileImage")
      .populate("following", "username profileImage");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @route GET /user/me
export const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select("-password")
      .populate("followers", "username profileImage")
      .populate("following", "username profileImage");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE USER PROFILE
export const updateProfile = async (req, res) => {
  try {
    const { username, bio } = req.body;
    
    const updateData = {};
    if (username) updateData.username = username;
    if (bio !== undefined) updateData.bio = bio;
    
    if (req.files) {
      if (req.files.profileImage) {
        updateData.profileImage = req.files.profileImage[0].path;
      }
      if (req.files.backgroundImage) {
        updateData.backgroundImage = req.files.backgroundImage[0].path;
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updateData,
      { new: true }
    ).select("-password");

    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER BY ID
export const getUserById = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "username profileImage")
      .populate("following", "username profileImage");
    
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// FOLLOW USER
export const followUser = async (req, res) => {
  try {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow) {
      return res.status(404).json({ message: "User not found" });
    }

    if (req.params.id === req.user._id.toString()) {
      return res.status(400).json({ message: "You cannot follow yourself" });
    }

    // Check if already following
    if (currentUser.following.includes(req.params.id)) {
      return res.status(400).json({ message: "Already following this user" });
    }

    // Add to following and followers
    currentUser.following.push(req.params.id);
    userToFollow.followers.push(req.user._id);

    await currentUser.save();
    await userToFollow.save();

    // Create notification
    await Notification.create({
      recipient: req.params.id,
      sender: req.user._id,
      type: "follow"
    });

    res.json({ success: true, message: "User followed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UNFOLLOW USER
export const unfollowUser = async (req, res) => {
  try {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow) {
      return res.status(404).json({ message: "User not found" });
    }

    // Check if not following
    if (!currentUser.following.includes(req.params.id)) {
      return res.status(400).json({ message: "Not following this user" });
    }

    // Remove from following and followers
    currentUser.following = currentUser.following.filter(
      id => id.toString() !== req.params.id
    );
    userToUnfollow.followers = userToUnfollow.followers.filter(
      id => id.toString() !== req.user._id.toString()
    );

    await currentUser.save();
    await userToUnfollow.save();

    res.json({ success: true, message: "User unfollowed successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET ALL USERS (for suggestions)
export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({ _id: { $ne: req.user._id } })
      .select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// TOGGLE GHOST MODE
export const toggleGhostMode = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user.isPro) {
      return res.status(403).json({ message: "Ghost Mode requires Elite Pro Membership" });
    }

    user.isGhostMode = !user.isGhostMode;
    await user.save();

    res.json({ success: true, isGhostMode: user.isGhostMode, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SEED SAMPLE ANALYTICS
export const seedSampleAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;
    let otherUsers = await User.find({ _id: { $ne: userId } }).limit(10);
    const myPosts = await Post.find({ author_id: userId }).limit(5);
    
    // Auto-create dummy users if none exist (Fixes fresh deploy empty graph issue)
    if (otherUsers.length < 3) {
      const hashedPassword = await bcrypt.hash("123456", 10);
      const dummyUsers = Array.from({ length: 5 }).map((_, i) => ({
        username: `visitor_${Math.random().toString(36).substr(2, 5)}`,
        email: `visitor_${Date.now()}_${i}@example.com`,
        password: hashedPassword,
        isVerified: Math.random() > 0.7,
        profileImage: `https://api.dicebear.com/7.x/avataaars/svg?seed=${i}`
      }));
      const createdUsers = await User.insertMany(dummyUsers);
      otherUsers = [...otherUsers, ...createdUsers];
    }

    let types = ['profile_visit'];
    if (myPosts.length > 0) {
      types = [...types, 'post_like', 'post_comment', 'post_repost'];
    }

    const locations = [
      { city: 'New York', country: 'United States', countryCode: 'US', lat: 40.7128, lng: -74.0060 },
      { city: 'London', country: 'United Kingdom', countryCode: 'GB', lat: 51.5074, lng: -0.1278 },
      { city: 'Mumbai', country: 'India', countryCode: 'IN', lat: 19.0760, lng: 72.8777 },
      { city: 'Tokyo', country: 'Japan', countryCode: 'JP', lat: 35.6762, lng: 139.6503 },
      { city: 'Paris', country: 'France', countryCode: 'FR', lat: 48.8566, lng: 2.3522 },
      { city: 'Berlin', country: 'Germany', countryCode: 'DE', lat: 52.5200, lng: 13.4050 },
      { city: 'Sydney', country: 'Australia', countryCode: 'AU', lat: -33.8688, lng: 151.2093 },
      { city: 'Toronto', country: 'Canada', countryCode: 'CA', lat: 43.6532, lng: -79.3832 },
      { city: 'Dubai', country: 'UAE', countryCode: 'AE', lat: 25.2048, lng: 55.2708 }
    ];

    const analyticsToCreate = [];
    
    // Create 50 random events for rich data
    for (let i = 0; i < 50; i++) {
      const type = types[Math.floor(Math.random() * types.length)];
      const visitor = otherUsers[Math.floor(Math.random() * otherUsers.length)];
      const loc = locations[Math.floor(Math.random() * locations.length)];
      const post = myPosts.length > 0 ? myPosts[Math.floor(Math.random() * myPosts.length)] : null;
      
      analyticsToCreate.push({
        type,
        userId: visitor._id,
        targetUserId: userId,
        postId: (type.startsWith('post') && post) ? post._id : null,
        location: loc,
        createdAt: new Date(Date.now() - Math.floor(Math.random() * 30 * 24 * 60 * 60 * 1000))
      });

      // Update actual models for consistency
      if (type === 'post_like' && post) {
        if (!post.likes.includes(visitor._id)) post.likes.push(visitor._id);
        await post.save();
      } else if (type === 'post_repost' && post) {
        if (!post.reposts.includes(visitor._id)) post.reposts.push(visitor._id);
        await post.save();
      } else if (type === 'profile_visit') {
        // Randomly follow
        if (Math.random() > 0.7) {
           const me = await User.findById(userId);
           if (!me.followers.includes(visitor._id)) {
              me.followers.push(visitor._id);
              await me.save();
              
              const v = await User.findById(visitor._id);
              if (v && !v.following.includes(userId)) {
                 v.following.push(userId);
                 await v.save();
              }
           }
        }
      }
    }

    await Analytics.insertMany(analyticsToCreate);
    res.json({ success: true, message: "Exhaustive analytics and social sync completed" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// LOG PROFILE VISIT
export const logProfileVisit = async (req, res) => {
  try {
    const { id } = req.params;
    if (id === req.user._id.toString()) return res.json({ success: true }); // Don't log own visits

    const visitor = await User.findById(req.user._id);
    if (visitor?.isGhostMode) return res.json({ success: true, message: "Ghost mode active" });

    await logAnalytics('profile_visit', req.user._id, id, null, req.ip);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// GET USER ANALYTICS
export const getUserAnalytics = async (req, res) => {
  try {
    const userId = req.user._id;

    // Last 30 days data
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // Profile visits
    const profileVisits = await Analytics.find({
      targetUserId: userId,
      type: 'profile_visit',
      createdAt: { $gte: thirtyDaysAgo }
    }).populate('userId', 'username profileImage isVerified');

    // Engagements on user's posts
    const engagements = await Analytics.find({
      targetUserId: userId,
      type: { $ne: 'profile_visit' },
      createdAt: { $gte: thirtyDaysAgo }
    });

    // Interaction Locations (for heatmap)
    // We group by countryCode and get counts + lat/lng for visualization
    const locations = await Analytics.aggregate([
      { $match: { targetUserId: userId, location: { $ne: null } } },
      { $group: {
        _id: "$location.countryCode",
        count: { $sum: 1 },
        country: { $first: "$location.country" },
        lat: { $first: "$location.lat" },
        lng: { $first: "$location.lng" }
      }}
    ]);

    // Trending Post (based on interaction count in last 30 days)
    const topPostAnalytics = await Analytics.aggregate([
      { $match: { targetUserId: userId, postId: { $ne: null }, createdAt: { $gte: thirtyDaysAgo } } },
      { $group: { _id: "$postId", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
      { $limit: 1 }
    ]);

    let trendingPost = null;
    if (topPostAnalytics.length > 0) {
      const post = await Post.findById(topPostAnalytics[0]._id)
        .populate('author_id', 'username profileImage')
        .populate("likes", "username profileImage")
        .populate("reposts", "username profileImage")
        .populate({
          path: "originalPost",
          populate: { path: "author_id", select: "username email profileImage" }
        });
      
      if (post) {
        // Add comment info
        const commentsCount = await Comment.countDocuments({ post_id: post._id });
        const comments = await Comment.find({ post_id: post._id }).populate("author_id", "username profileImage");
        const lastComments = comments.slice(-2);
        const commentersMap = new Map();
        comments.forEach(c => {
          if (c.author_id) commentersMap.set(c.author_id._id.toString(), c.author_id);
        });
        const commenters = Array.from(commentersMap.values());
        trendingPost = { ...post.toObject(), commentsCount, lastComments, commenters };
      }
    }

    // Network Score Calculation
    const user = await User.findById(userId);
    const followersCount = user.followers.length;
    const score = Math.min(100, 30 + (followersCount * 0.5) + (engagements.length * 2) + (profileVisits.length * 0.1));

    // Neural Radar Calculations
    const last7Days = new Date();
    last7Days.setDate(last7Days.getDate() - 7);
    const recentEngagements = engagements.filter(e => e.createdAt >= last7Days).length;
    
    // 1. Reach (Global views)
    const reachScore = Math.min(100, (profileVisits.length / 20) * 100);
    // 2. Engagement (Action density)
    const engagementScore = Math.min(100, (engagements.length / 15) * 100);
    // 3. Loyalty (Follower conversion / stability)
    const loyaltyScore = profileVisits.length > 0 ? Math.min(100, (followersCount / profileVisits.length) * 100) : 50;
    // 4. Momentum (Growth speed)
    const momentumScore = Math.min(100, (recentEngagements / (engagements.length || 1)) * 200);
    // 5. Versatility (Feature usage diversity)
    const uniqueEngagementTypes = new Set(engagements.map(e => e.type)).size;
    const versatilityScore = Math.min(100, (uniqueEngagementTypes / 5) * 100);

    const neuralRadar = [
      { subject: 'Reach', A: Math.round(reachScore), fullMark: 100 },
      { subject: 'Engagement', A: Math.round(engagementScore), fullMark: 100 },
      { subject: 'Loyalty', A: Math.round(loyaltyScore), fullMark: 100 },
      { subject: 'Momentum', A: Math.round(momentumScore), fullMark: 100 },
      { subject: 'Versatility', A: Math.round(versatilityScore), fullMark: 100 },
    ];

    res.json({
      success: true,
      stats: {
        totalViews: profileVisits.length,
        totalEngagements: engagements.length,
        networkScore: Math.round(score),
        recentVisitors: profileVisits.slice(-5).map(v => v.userId).filter(u => u),
        locations,
        trendingPost,
        neuralRadar
      }
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPGRADE TO PRO
export const upgradeToPro = async (req, res) => {
  try {
    const user = await User.findByIdAndUpdate(
      req.user._id,
      { isPro: true, isVerified: true }, // Verification comes with Pro for now
      { new: true }
    ).select("-password");
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// UPDATE PROFILE THEME
export const updateProfileTheme = async (req, res) => {
  try {
    const { accentColor, applied } = req.body;
    const user = await User.findById(req.user._id);
    
    if (!user.isPro) {
      return res.status(403).json({ message: "Only Pro members can customize themes" });
    }

    user.profileTheme = {
      accentColor: accentColor || user.profileTheme.accentColor,
      applied: applied !== undefined ? applied : user.profileTheme.applied
    };

    await user.save();
    res.json({ success: true, user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// SEARCH USERS
export const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;
    if (!query) return res.json([]);

    const users = await User.find({
      username: { $regex: query, $options: "i" }
    })
    .select("username profileImage bio")
    .limit(10);

    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};