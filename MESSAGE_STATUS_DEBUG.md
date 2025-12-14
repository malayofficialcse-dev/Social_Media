# Message Status Debugging Guide

## How Message Status Works

### Status Flow

1. **Sent (Single Grey Tick)**: Message is sent to server
2. **Delivered (Double Grey Tick)**: Recipient is online and has received the message
3. **Read (Double Green Tick)**: Recipient has opened the chat and viewed the message

### Testing Steps

#### Setup

1. Open two browsers (or one normal + one incognito)
2. Login as User A in Browser 1
3. Login as User B in Browser 2
4. Open Developer Console (F12) in both browsers

#### Test 1: Sent Status

1. User A sends message to User B
2. User B is NOT logged in or is on a different page (not /chat)
3. **Expected**: User A sees **single grey tick** ✓
4. **Console logs to check**:
   - Browser 1 (User A): Should show message sent with `status: 'sent'`

#### Test 2: Delivered Status

1. User B navigates to `/chat` page (message list)
2. **Expected**: User A's tick changes to **double grey tick** ✓✓
3. **Console logs to check**:
   - Browser 2 (User B): `Marking messages as delivered for chat: <userId> <username>`
   - Backend: `Emitting message delivered to: <User A ID> from receiver: <User B ID>`
   - Browser 1 (User A): `Message delivered event received: { receiverId: '<User B ID>', senderId: '<User A ID>', currentUserId: '<User A ID>' }`

#### Test 3: Read Status

1. User B clicks on User A's chat to open the conversation
2. **Expected**: User A's tick changes to **double green tick** ✓✓ (green)
3. **Console logs to check**:
   - Browser 2 (User B): `Marking messages as read for chat: <User A ID> <User A username>`
   - Backend: `Emitting message read to: <User A ID> from reader: <User B ID>`
   - Browser 1 (User A): `Message read event received: { readerId: '<User B ID>', senderId: '<User A ID>', currentUserId: '<User A ID>' }`

### Common Issues

#### Issue: Ticks not updating

**Check**:

1. Are socket events being emitted? Check backend console
2. Are socket events being received? Check frontend console
3. Is the user properly joined to their socket room? Check backend console for "User joined room: <userId>"
4. Is the selectedChat.\_id matching the readerId/receiverId in the event?

#### Issue: All messages show single tick

**Check**:

1. Are messages being created with `status: 'sent'`? Check backend console: "Fetched messages count: X Sample status: sent"
2. Is the Message schema updated with the status field?
3. Try sending a NEW message (old messages might not have the status field)

#### Issue: Status updates but not in real-time

**Check**:

1. Socket connection status
2. Are both users properly connected to socket.io?
3. Check network tab for socket.io connection

### Database Check

If issues persist, check the database directly:

```javascript
// In MongoDB shell or Compass
db.messages.find().sort({ createdAt: -1 }).limit(5);
```

Each message should have a `status` field with value: 'sent', 'delivered', or 'read'

### Manual Testing Commands

```javascript
// In browser console (User B - receiver)
// Manually mark as delivered
await fetch("http://localhost:5001/api/messages/<User A ID>/mark-delivered", {
  method: "PUT",
  headers: {
    Authorization: "Bearer " + localStorage.getItem("token"),
  },
});

// Manually mark as read
await fetch("http://localhost:5001/api/messages/<User A ID>/mark-read", {
  method: "PUT",
  headers: {
    Authorization: "Bearer " + localStorage.getItem("token"),
  },
});
```

### Expected Console Output Example

**When User B opens chat list:**

```
Frontend (User B): Marking messages as delivered for chat: 507f1f77bcf86cd799439011 UserA
Backend: Emitting message delivered to: 507f1f77bcf86cd799439011 from receiver: 507f191e810c19729de860ea
Frontend (User A): Message delivered event received: { receiverId: '507f191e810c19729de860ea', senderId: '507f1f77bcf86cd799439011', currentUserId: '507f1f77bcf86cd799439011' }
```

**When User B opens specific chat:**

```
Frontend (User B): Marking messages as read for chat: 507f1f77bcf86cd799439011 UserA
Backend: Emitting message read to: 507f1f77bcf86cd799439011 from reader: 507f191e810c19729de860ea
Frontend (User A): Message read event received: { readerId: '507f191e810c19729de860ea', senderId: '507f1f77bcf86cd799439011', currentUserId: '507f1f77bcf86cd799439011' }
```
