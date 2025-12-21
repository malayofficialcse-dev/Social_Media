import mongoose from "mongoose";

const storySchema = mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    media: {
      type: String, // Cloudinary URL
      required: true,
    },
    textContent: {
      type: String,
      default: "",
    },
    audio: {
      type: String, // Cloudinary URL for song
      default: "",
    },
    audioStart: {
      type: Number, // Start time in seconds
      default: 0,
    },
    audioDuration: {
      type: Number, // Play duration
      default: 0, 
    },
    type: {
      type: String,
      enum: ['image', 'video'],
      default: 'image',
    },
    viewers: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User"
      },
      viewedAt: {
        type: Date,
        default: Date.now
      }
    }],
    duration: {
      type: Number,
      default: 5000, // 5 seconds for images
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    isHighlight: {
      type: Boolean,
      default: false,
    },
    likes: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: "User"
    }],
    widget: {
      type: { type: String, enum: ["poll", "countdown", "qa"] },
      poll: {
        question: String,
        options: [{
          text: String,
          votes: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }]
        }]
      },
      countdown: {
        targetDate: Date,
        label: String
      },
      qa: {
        question: String,
        answers: [{
          user: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
          text: String,
          createdAt: { type: Date, default: Date.now }
        }]
      }
    }
  },
  {
    timestamps: true,
  }
);

const Story = mongoose.model("Story", storySchema);

export default Story;
