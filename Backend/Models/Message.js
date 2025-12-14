import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  sender: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  receiver: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  content: {
    type: String,
    trim: true,
  },
  image: {
    type: String,
  },
  audio: {
    type: String,
  },
  reactions: [{
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    emoji: {
      type: String,
      required: true,
    }
  }],
  deletedForEveryone: {
    type: Boolean,
    default: false,
  },
  deletedBy: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  isForwarded: {
    type: Boolean,
    default: false,
  },
  status: {
    type: String,
    enum: ["sent", "delivered", "read"],
    default: "sent",
  },
}, { timestamps: true });

const Message = mongoose.model("Message", messageSchema);
export default Message;
