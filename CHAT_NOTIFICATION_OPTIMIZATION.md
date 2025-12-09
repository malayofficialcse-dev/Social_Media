# Chat Notification Optimization - Implementation Guide

## Objective

Prevent notifications and sounds when users are actively in the chat section.

## Current Behavior

- ❌ Users get toast notifications even when chatting
- ❌ Sound plays even when actively viewing messages
- ❌ Notifications created in database regardless of chat status

## Desired Behavior

- ✅ NO toast notification if user is in chat with sender
- ✅ NO sound if user is in chat with sender
- ✅ NO database notification if user is in chat with sender
- ✅ Toast + Sound + DB notification ONLY if user is NOT in chat

## Implementation Steps

### Frontend (Chat.jsx)

Add socket events to track when user enters/leaves a specific chat:

```javascript
// When selecting a chat
useEffect(() => {
  if (selectedChat && socket) {
    // Tell server we're in this chat
    socket.emit("enter chat", {
      userId: user._id,
      chatWithUserId: selectedChat._id,
    });

    return () => {
      // Tell server we left this chat
      socket.emit("leave chat", { userId: user._id });
    };
  }
}, [selectedChat, socket, user]);
```

### Backend (server.js)

Track active chats and conditionally send notifications:

```javascript
// Add after onlineUsers
const activeChatUsers = new Map(); // userId -> chatWithUserId

// Add new socket events
socket.on("enter chat", ({ userId, chatWithUserId }) => {
  activeChatUsers.set(userId, chatWithUserId);
});

socket.on("leave chat", ({ userId }) => {
  activeChatUsers.delete(userId);
});

// Update "new message" event
socket.on("new message", async (newMessageReceived) => {
  const receiverId = newMessageReceived.receiver;

  // Always send the message
  socket.in(receiverId).emit("message received", newMessageReceived);

  // Check if receiver is in chat with sender
  const receiverActiveChatWith = activeChatUsers.get(receiverId);
  const isInChatWithSender =
    receiverActiveChatWith === newMessageReceived.sender._id;

  // Only send notification if NOT in active chat
  if (!isInChatWithSender) {
    // Create DB notification
    const Notification = (await import("./Models/Notification.js")).default;
    await Notification.create({
      recipient: receiverId,
      sender: newMessageReceived.sender._id,
      type: "message",
      message: newMessageReceived.content?.substring(0, 50) || "Sent an image",
    });

    // Emit notification event (triggers toast + sound)
    socket.in(receiverId).emit("notification received", {
      sender: newMessageReceived.sender,
      message: newMessageReceived.content || "Sent an image",
    });
  }
});

// Clean up on disconnect
socket.on("disconnect", () => {
  // ... existing code ...
  activeChatUsers.delete(userId);
});
```

## Benefits

1. **Better UX** - No annoying notifications while actively chatting
2. **Less Noise** - Sounds only when actually needed
3. **Cleaner DB** - Fewer unnecessary notification records
4. **Smart** - System knows user context

## Testing

1. Open chat with User A
2. Have User A send message
3. ✅ Message appears instantly
4. ❌ NO toast notification
5. ❌ NO sound
6. ❌ NO notification in notification section

7. Navigate away from chat
8. Have User A send another message
9. ✅ Toast notification appears
10. ✅ Sound plays
11. ✅ Notification in notification section

## Files to Modify

1. `Frontend/src/pages/Chat.jsx` - Add enter/leave chat events
2. `Backend/server.js` - Track active chats, conditional notifications
3. `Backend/controllers/messageController.js` - Remove notification creation (already done ✅)

## Status

- ✅ Message controller updated (no notifications created there)
- ⏳ Socket.io tracking needs implementation
- ⏳ Frontend chat events need implementation

This will make the chat experience much smoother and less intrusive!
