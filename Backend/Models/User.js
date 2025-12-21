import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    bio: { type: String, default: "" },
    profileImage: { type: String, default: "" },
    backgroundImage: { type: String, default: "" },
    followers: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    following: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    role: { type: String, enum: ["user", "admin"], default: "user" },
    isPro: { type: Boolean, default: false },
    isVerified: { type: Boolean, default: false },
    isGhostMode: { type: Boolean, default: false },
    profileTheme: {
      accentColor: { type: String, default: "" }, // e.g., 'gold', 'emerald', 'rose'
      applied: { type: Boolean, default: false }
    },
    lastSeen: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
