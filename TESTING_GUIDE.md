# Message Status - Complete Testing Guide

## Current Situation

From your screenshot, I can see:

- ✅ Frontend is running on `localhost:5173`
- ❌ Frontend is connecting to PRODUCTION server `social-media-vdsn.onrender.com`
- ❌ Production server doesn't have the updated code (404 errors)
- ❌ Ticks are not showing because messages don't have `status` field

## Solution: Test Locally First

### Prerequisites

- Backend running locally
- Frontend running locally
- Both connected to each other (not production)

### Step-by-Step Setup

#### 1. Check Backend Port

Your backend runs on port **5000** (not 5001).

Open a terminal and check if backend is running:

```bash
# Should show "Server running on 5000"
# Check the terminal where nodemon is running
```

If not running:

```bash
cd d:\Major_Projects\Innobytes\Backend
npm start
```

#### 2. Configure Frontend to Use Local Backend

**Option A: Create .env.local file (Recommended)**

Create a file `Frontend/.env.local` with:

```
VITE_API_URL=http://localhost:5000/api
```

**Option B: Temporarily hardcode in api.js**

Edit `Frontend/src/services/api.js`:

```javascript
// Change line 5 from:
const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5001/api";

// To:
const API_URL = "http://localhost:5000/api";
```

#### 3. Restart Frontend

Stop the frontend (Ctrl+C) and restart:

```bash
cd d:\Major_Projects\Innobytes\Frontend
npm run dev
```

#### 4. Clear Browser Cache

- Press `Ctrl+Shift+R` for hard refresh
- Or clear all cached data

#### 5. Test the Feature

1. Open http://localhost:5173
2. Login as User A
3. Open another browser/incognito and login as User B
4. Send message from User A to User B
5. **Check console in User A's browser** - you should see:
   ```
   Sent message data: {...} Status: sent
   Message status: <id> sent
   ```
6. **Look at the message bubble** - you should see a white checkmark ✓

#### 6. Test Delivered Status

1. User B opens http://localhost:5173/chat (message list)
2. **User A should see** the tick change to double ✓✓

#### 7. Test Read Status

1. User B clicks on User A's chat
2. **User A should see** the tick change to double green ✓✓

## Debugging

### If you see 404 errors:

- You're still connected to production server
- Check `VITE_API_URL` in console: `console.log(import.meta.env.VITE_API_URL)`
- Make sure you restarted frontend after creating .env.local

### If ticks don't show:

- Check console for "Message status: <id> ..."
- If status is `undefined`, backend isn't returning it
- If status is there but no ticks, check browser console for React errors

### If status is undefined:

- Backend might not be running the latest code
- Restart backend: `Ctrl+C` then `npm start` in Backend folder
- Check `Backend/Models/Message.js` has `status` field
- Send a NEW message (old messages won't have status)

## Console Logs to Watch For

### When sending a message:

```
Sent message data: {_id: '...', content: 'hi', status: 'sent', ...} Status: sent
```

### When viewing messages:

```
Fetched messages: 5 First message status: sent
Message status: 67... sent
Message status: 67... sent
...
```

### When message is delivered:

```
(In User A's console when User B opens chat list)
Message delivered event received: {receiverId: '...', ...}
```

### When message is read:

```
(In User A's console when User B opens specific chat)
Message read event received: {readerId: '...', ...}
```

## After Local Testing Works

Once everything works locally, deploy to production:

```bash
git add .
git commit -m "Fix message status feature - complete implementation"
git push origin main
```

Then wait for Render to deploy (~10-15 minutes) and test on production.

## Quick Checklist

- [ ] Backend running on port 5000
- [ ] Frontend configured to use http://localhost:5000/api
- [ ] Frontend restarted after config change
- [ ] Browser cache cleared
- [ ] Logged in as two different users
- [ ] Sent a NEW message (not old ones)
- [ ] Checked console for status logs
- [ ] Ticks are visible on sent messages
