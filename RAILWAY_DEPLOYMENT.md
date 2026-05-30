# 🚀 Railway Deployment Guide - Fix Build Issues

## ❌ Current Issue
The build is failing because Railway is trying to build the entire repository as one service. We need to deploy **separate services** for frontend and backend.

## ✅ Solution: Deploy as Multiple Services

### Step 1: Create New Railway Project
1. Go to [railway.app](https://railway.app)
2. Click "New Project"
3. Select "Deploy from GitHub repo"
4. Choose your repository

### Step 2: Add Backend Service
1. In your Railway project dashboard, click "New Service"
2. Select "GitHub Repo"
3. Choose your repository again
4. **Important**: Set **Root Directory** to `spring-boot-backend`
5. Name it: `cognisafe-backend`

### Step 3: Add Frontend Service
1. Click "New Service" again
2. Select "GitHub Repo"
3. Choose your repository again
4. **Important**: Set **Root Directory** to `frontend`
5. Name it: `cognisafe-frontend`

### Step 4: Add Database Service
1. Click "New Service"
2. Select "Database" → "MySQL"
3. Name it: `cognisafe-db`

### Step 5: Configure Environment Variables

#### Backend Service Variables:
```
DATABASE_URL=jdbc:mysql://your-mysql-service-url:3306/cognisafe
DATABASE_USERNAME=root
DATABASE_PASSWORD=your-mysql-password
MAIL_USERNAME=parth2012dixit@gmail.com
MAIL_PASSWORD=abnb xqct hchj oons
```

#### Frontend Service Variables:
```
REACT_APP_API_URL=https://your-backend-service-url.railway.app/api
```

### Step 6: Deploy
1. Each service will build and deploy automatically
2. Wait for all services to show "Deployed" status
3. Get your URLs from the Railway dashboard

## 🔧 Configuration Files Created

### Backend (`spring-boot-backend/`):
- ✅ `railway.toml` - Railway configuration
- ✅ `nixpacks.toml` - Build configuration

### Frontend (`frontend/`):
- ✅ `railway.toml` - Railway configuration  
- ✅ `nixpacks.toml` - Build configuration

## 🌐 Access Your App

After deployment:
- **Frontend**: `https://your-frontend-url.railway.app`
- **Backend API**: `https://your-backend-url.railway.app/api`
- **Database**: Managed by Railway

## 🔍 Troubleshooting

### If Backend Build Fails:
1. Check if `mvn clean package` works locally
2. Verify Java 17 is specified in `nixpacks.toml`
3. Check environment variables

### If Frontend Build Fails:
1. Check if `npm run build` works locally
2. Verify all dependencies in `package.json`
3. Check if `REACT_APP_API_URL` is set correctly

### If Services Can't Connect:
1. Verify environment variables are set
2. Check if backend URL is correct in frontend
3. Ensure CORS is configured in backend

## 📊 Health Checks

- **Backend**: `https://your-backend-url.railway.app/actuator/health`
- **Frontend**: `https://your-frontend-url.railway.app`

## 🎉 Success!

Once all services are deployed:
1. ✅ Backend API running
2. ✅ Frontend app running  
3. ✅ Database connected
4. ✅ Full-stack app accessible

---

**Follow these steps exactly and your deployment will work! 🚀** 