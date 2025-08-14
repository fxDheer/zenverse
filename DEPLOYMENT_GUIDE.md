# 🚀 ZenVerse Deployment Guide

## **Quick Deploy to Render (FREE & EASY)**

### **Step 1: Deploy Backend to Render**

1. **Go to [render.com](https://render.com) and sign up/login**
2. **Click "New +" → "Web Service"**
3. **Connect your GitHub repository**
4. **Configure the service:**
   - **Name:** `zenverse-backend`
   - **Environment:** `Node`
   - **Build Command:** `npm install`
   - **Start Command:** `npm start`
   - **Plan:** `Free`

5. **Add Environment Variables:**
   ```
   NODE_ENV=production
   MONGODB_URI=mongodb+srv://your_username:your_password@your_cluster.mongodb.net/zenverse
   JWT_SECRET=your_super_secret_key_here
   CORS_ORIGIN=https://your-frontend-domain.onrender.com
   ```

6. **Click "Create Web Service"**

### **Step 2: Deploy Frontend to Render**

1. **Click "New +" → "Static Site"**
2. **Connect your GitHub repository**
3. **Configure:**
   - **Name:** `zenverse-frontend`
   - **Build Command:** `npm run build`
   - **Publish Directory:** `build`
   - **Plan:** `Free`

4. **Add Environment Variable:**
   ```
   REACT_APP_API_URL=https://your-backend-domain.onrender.com
   ```

5. **Click "Create Static Site"**

### **Step 3: Set up MongoDB Atlas (FREE)**

1. **Go to [mongodb.com/atlas](https://mongodb.com/atlas)**
2. **Create free account and cluster**
3. **Get connection string and update backend environment variable**

---

## **Alternative: Deploy to Railway (FREE)**

### **Backend Deployment:**
1. **Go to [railway.app](https://railway.app)**
2. **Connect GitHub repo**
3. **Add environment variables**
4. **Deploy automatically**

### **Frontend Deployment:**
1. **Use Vercel or Netlify for frontend**
2. **Connect GitHub repo**
3. **Auto-deploy on push**

---

## **Environment Variables Setup**

### **Backend (.env):**
```bash
NODE_ENV=production
MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/zenverse
JWT_SECRET=your_super_secret_key
CORS_ORIGIN=https://your-frontend-domain.com
```

### **Frontend (.env):**
```bash
REACT_APP_API_URL=https://your-backend-domain.com
REACT_APP_SOCKET_URL=https://your-backend-domain.com
```

---

## **Post-Deployment Steps**

1. **Test all features:**
   - User registration/login
   - Profile creation
   - Match discovery
   - Chat functionality
   - File uploads

2. **Monitor logs for errors**

3. **Set up custom domain (optional)**

4. **Enable HTTPS (automatic on Render)**

---

## **Cost Breakdown (Monthly)**

- **Render Backend:** FREE (750 hours/month)
- **Render Frontend:** FREE (unlimited)
- **MongoDB Atlas:** FREE (512MB storage)
- **Total:** $0/month

---

## **Need Help?**

- Check Render logs for errors
- Verify environment variables
- Test API endpoints with Postman
- Check CORS configuration
