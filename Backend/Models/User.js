import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    username: { type: String, required: true, unique: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true } // plain stored initially before controller hashes it
  },
  { timestamps: true }
);

export default mongoose.model("User", userSchema);
