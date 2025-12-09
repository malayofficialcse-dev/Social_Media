import mongoose from "mongoose";

const postSchema = new mongoose.Schema({
  title: { type: String },
  content: { type: String },
  image: { type: String, default: "" },
  author_id: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },
  likes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  reposts: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
  isRepost: { type: Boolean, default: false },
  originalPost: { type: mongoose.Schema.Types.ObjectId, ref: "Post" }
}, { timestamps: true });

export default mongoose.model("Post", postSchema);
