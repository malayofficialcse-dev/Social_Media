# Social Media Application - Complete Setup Guide

## 🚀 Deployment Checklist

### Backend (Render) - https://social-media-vdsn.onrender.com

#### Environment Variables on Render:

Make sure these are set in your Render dashboard:

```
MONGO_URI=your_mongodb_connection_string
JWT_SECRET=your_jwt_secret_key
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
NODE_ENV=production
PORT=5000
```

#### Build Command:

```
npm install
```

#### Start Command:

```
node server.js
```

### Frontend (Render) - https://social-media-1-1u50.onrender.com

#### Environment Variables on Render:

```
VITE_API_URL=https://social-media-vdsn.onrender.com/api
```

#### Build Command:

```
npm install && npm run build
```

#### Start Command:

```
npm run preview
```

Or use a static site:

- Publish Directory: `dist`

---

## 🔧 Common Issues & Solutions

### 1. Backend Not Responding (400 Error)

**Possible Causes:**

- MongoDB connection failed
- Environment variables not set
- Server crashed on startup

**Solution:**

- Check Render logs for backend service
- Verify all environment variables are set
- Ensure MongoDB Atlas allows connections from anywhere (0.0.0.0/0)

### 2. CORS Errors

**Already Fixed:** Backend now allows:

- https://social-media-1-1u50.onrender.com
- http://localhost:5173
- http://localhost:5174

### 3. Socket.io Connection Issues

**Solution:** Make sure backend is running and accessible

---

## 📝 Testing Locally

### Backend:

```bash
cd Backend
npm install
nodemon server.js
```

Should show:

- Server running on 5000
- MongoDB Connected Successfully
- Connected to socket.io

### Frontend:

```bash
cd Frontend
npm install
npm run dev
```

Should open on http://localhost:5173

---

## 🌐 Production URLs

- **Frontend:** https://social-media-1-1u50.onrender.com
- **Backend API:** https://social-media-vdsn.onrender.com/api
- **Socket.io:** https://social-media-vdsn.onrender.com

---

## 🐛 Debugging Steps

1. **Check Backend Health:**

   - Visit: https://social-media-vdsn.onrender.com
   - Should show: "Blog API Running with Validation & Error Handling"

2. **Check Backend Logs on Render:**

   - Go to Render Dashboard → Backend Service → Logs
   - Look for errors or startup issues

3. **Test API Endpoint:**

   ```bash
   curl https://social-media-vdsn.onrender.com/api/users/login
   ```

   Should return a validation error (not 502 or 500)

4. **Verify MongoDB Connection:**
   - Check MongoDB Atlas → Network Access
   - Should allow 0.0.0.0/0 or Render's IP ranges

---

## 📦 Package.json Scripts

### Backend:

```json
{
  "scripts": {
    "start": "node server.js",
    "dev": "nodemon server.js"
  },
  "type": "module"
}
```

### Frontend:

```json
{
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "preview": "vite preview"
  }
}
```

---

## ✅ Final Checklist

- [ ] Backend deployed and running on Render
- [ ] Frontend deployed and running on Render
- [ ] All environment variables set correctly
- [ ] MongoDB connection working
- [ ] CORS configured for both origins
- [ ] Socket.io working
- [ ] Can register/login successfully

---

## 🆘 If Still Not Working

1. **Check Render Backend Logs** - Most issues show here
2. **Verify MongoDB Connection String** - Common cause of 400 errors
3. **Test with Postman** - Isolate if it's frontend or backend issue
4. **Check Network Tab** - See exact error response from backend

---

## 📞 Support

If you're still facing issues, check:

1. Render service logs (most important!)
2. Browser console for detailed errors
3. Network tab for request/response details
