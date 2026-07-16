import express from "express"; // Server restart trigger
import cors from "cors";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import { createServer } from "http";
import { Server } from "socket.io";

import userRoutes from "./routes/userRoutes.js";
import postRoutes from "./routes/postRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";
import messageRoutes from "./routes/messageRoutes.js";
import storyRoutes from "./routes/storyRoutes.js";
import groupRoutes from "./routes/groupRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
app.set('trust proxy', 1); // Trust first proxy (essential for deployment)
const httpServer = createServer(app);

const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allow all origins for socket
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  },
});

app.use(cors({
  origin: true, // Allow all origins dynamically
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH"],
  allowedHeaders: ["Content-Type", "Authorization"],
}));
app.use(express.json());

import User from "./Models/User.js";

// Make io accessible to our router
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io Logic
let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", async (userData) => {
    socket.join(userData._id);
    console.log("User joined room:", userData._id);
    
    // Add this specific socket to online users
    if (!onlineUsers.some((u) => u.socketId === socket.id)) {
      onlineUsers.push({ userId: userData._id, socketId: socket.id });
    }
    
    io.emit("getOnlineUsers", onlineUsers);
  });

  socket.on("join chat", (room) => {
    socket.join(room);
    console.log("User joined chat: " + room);
  });

  socket.on("typing", (room) => socket.in(room).emit("typing"));
  socket.on("stop typing", (room) => socket.in(room).emit("stop typing"));

  socket.on("new message", (newMessageRecieved) => {
    if (newMessageRecieved.group) {
        socket.in(newMessageRecieved.group._id || newMessageRecieved.group).emit("message received", newMessageRecieved);
    } else {
        const receiverId = newMessageRecieved.receiver ? (newMessageRecieved.receiver._id || newMessageRecieved.receiver) : null;
        if (!receiverId) return;
        socket.in(receiverId).emit("message received", newMessageRecieved);
        socket.in(receiverId).emit("notification received", {
          type: 'message',
          sender: newMessageRecieved.sender,
          content: newMessageRecieved.content,
          chatId: newMessageRecieved.sender._id
        });
    }
  });

  socket.on("disconnect", async () => {
    console.log("USER DISCONNECTED");
    const disconnectedUser = onlineUsers.find(u => u.socketId === socket.id);
    if (disconnectedUser) {
        try {
            await User.findByIdAndUpdate(disconnectedUser.userId, { 
                lastSeen: new Date() 
            });
        } catch (err) {
            console.error("Error updating last seen:", err);
        }
        onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
        io.emit("getOnlineUsers", onlineUsers);
    }
  });

  // WebRTC Signaling
  socket.on("call-user", ({ userToCall, signalData, from, name }) => {
    console.log(`Call from ${name} to ${userToCall}`);
    io.to(userToCall).emit("incoming-call", { signal: signalData, from, name });
  });

  socket.on("answer-call", ({ to, signal }) => {
    console.log(`Answering call to ${to}`);
    io.to(to).emit("call-accepted", signal);
  });

  socket.on("ice-candidate", ({ to, candidate }) => {
    io.to(to).emit("ice-candidate", candidate);
  });

  socket.on("reject-call", ({ to }) => {
    io.to(to).emit("call-rejected");
  });

  socket.on("end-call", ({ to }) => {
    io.to(to).emit("call-ended");
  });
});

// API routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/groups", groupRoutes);
app.use("/api/stories", storyRoutes);

// Story Cleanup Cron Job (Runs every hour)
import Story from "./Models/Story.js";
setInterval(async () => {
  try {
    const result = await Story.deleteMany({
      expiresAt: { $lt: new Date() },
      isHighlight: false
    });
    if (result.deletedCount > 0) {
      console.log(`Cron: Deleted ${result.deletedCount} expired stories`);
    }
  } catch (error) {
    console.error("Cron Error:", error);
  }
}, 60 * 60 * 1000); // 1 Hour
app.use("/api/admin", adminRoutes);

// Global Error Handler
app.use(errorHandler);

app.get("/health", (req, res) => {
  res.json({ 
    status: "OK", 
    message: "Server is running",
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

app.get("/", (req, res) => {
  res.send("Blog API Running with Validation & Error Handling");
});

if (process.env.NODE_ENV !== 'test') {
  connectDB();
  const PORT = process.env.PORT || 5000;
  httpServer.listen(PORT, () => console.log(`Server running on ${PORT}`));
}

export { io };
export default app;
