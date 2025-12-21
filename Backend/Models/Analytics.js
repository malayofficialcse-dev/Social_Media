import mongoose from "mongoose";

const analyticsSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  type: {
    type: String,
    enum: ["profile_visit", "post_like", "post_comment", "post_repost", "poll_vote", "qa_answer"],
    required: true
  },
  targetUserId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  postId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Post"
  },
  location: {
    city: String,
    country: String,
    countryCode: String,
    lat: Number,
    lng: Number
  }
}, { timestamps: true });

export default mongoose.model("Analytics", analyticsSchema);
