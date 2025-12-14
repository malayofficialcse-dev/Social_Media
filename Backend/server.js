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
import adminRoutes from "./routes/adminRoutes.js";
import { errorHandler } from "./middleware/errorHandler.js";

dotenv.config();

const app = express();
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

// Make io accessible to our router
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Socket.io Logic
let onlineUsers = [];

io.on("connection", (socket) => {
  console.log("Connected to socket.io");

  socket.on("setup", (userData) => {
    socket.join(userData._id);
    console.log("User joined room:", userData._id);
    if (!onlineUsers.some((u) => u.userId === userData._id)) {
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
    var chat = newMessageRecieved.chat; // Assuming chat structure, or just receiver
    // If we use direct messaging, we can emit to receiver's ID
    
    // For simple 1-on-1:
    const receiverId = newMessageRecieved.receiver;
    const senderId = newMessageRecieved.sender._id;

    if (!receiverId) return console.log("Receiver not defined");

    // Emit to receiver
    socket.in(receiverId).emit("message received", newMessageRecieved);
    
    // Also emit notification if receiver is not in the chat (handled by frontend logic mostly, but we can emit a specific notification event)
    socket.in(receiverId).emit("notification received", {
      type: 'message',
      sender: newMessageRecieved.sender,
      content: newMessageRecieved.content,
      chatId: senderId // Navigate to this chat
    });
  });

  socket.on("disconnect", () => {
    console.log("USER DISCONNECTED");
    onlineUsers = onlineUsers.filter((u) => u.socketId !== socket.id);
    io.emit("getOnlineUsers", onlineUsers);
  });
});

// API routes
app.use("/api/users", userRoutes);
app.use("/api/posts", postRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/messages", messageRoutes);
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
