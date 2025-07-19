# 🚀 Full-Stack Deployment Guide - CogniSafe Password Vault

## 🎯 Quick Deploy Options

### Option 1: Railway (Recommended - Easiest)
**Deploy both frontend and backend together**

1. **Go to [railway.app](https://railway.app)**
2. **Sign up/Login with GitHub**
3. **Click "New Project" → "Deploy from GitHub repo"**
4. **Select your repository**
5. **Add services:**
   - **Backend Service**: `spring-boot-backend` directory
   - **Frontend Service**: `frontend` directory
   - **Database**: Add MySQL service

### Option 2: Render (Great Alternative)
**Deploy both services separately**

1. **Backend**: Web Service
2. **Frontend**: Static Site
3. **Database**: PostgreSQL (free tier)

### Option 3: Heroku (Classic)
**Deploy both with proper configuration**

## 🛠️ Railway Deployment (Step-by-Step)

### Step 1: Prepare Your Repository
Your repository is already configured with:
- ✅ `railway.json` (root)
- ✅ `nixpacks.toml` (root)
- ✅ `frontend/railway.json`
- ✅ `frontend/nixpacks.toml`
- ✅ Environment variables in frontend

### Step 2: Deploy on Railway

1. **Visit [railway.app](https://railway.app)**
2. **Connect your GitHub account**
3. **Click "New Project"**
4. **Select "Deploy from GitHub repo"**
5. **Choose your repository**

### Step 3: Configure Services

#### Backend Service:
- **Name**: `cognisafe-backend`
- **Root Directory**: `spring-boot-backend`
- **Environment Variables**:
  ```
  DATABASE_URL=your_mysql_connection_string
  DATABASE_USERNAME=your_db_username
  DATABASE_PASSWORD=your_db_password
  MAIL_USERNAME=your_email@gmail.com
  MAIL_PASSWORD=your_app_password
  ```

#### Frontend Service:
- **Name**: `cognisafe-frontend`
- **Root Directory**: `frontend`
- **Environment Variables**:
  ```
  REACT_APP_API_URL=https://your-backend-url.railway.app/api
  ```

#### Database Service:
- **Add MySQL service**
- **Use the connection string in backend environment variables**

### Step 4: Deploy
Click "Deploy" and wait for both services to be ready!

## 🌐 Render Deployment (Alternative)

### Backend Setup:
1. **Go to [render.com](https://render.com)**
2. **New Web Service**
3. **Connect GitHub repo**
4. **Configure:**
   - **Name**: `cognisafe-backend`
   - **Root Directory**: `spring-boot-backend`
   - **Build Command**: `./mvnw clean package -DskipTests`
   - **Start Command**: `java -jar target/passwordvault-0.0.1-SNAPSHOT.jar`
   - **Environment**: `Java`

### Frontend Setup:
1. **New Static Site**
2. **Connect GitHub repo**
3. **Configure:**
   - **Name**: `cognisafe-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Publish Directory**: `build`

## 🔧 Environment Variables

### Backend Variables:
```bash
DATABASE_URL=jdbc:mysql://your-db-host:3306/cognisafe
DATABASE_USERNAME=your_username
DATABASE_PASSWORD=your_password
MAIL_USERNAME=your_email@gmail.com
MAIL_PASSWORD=your_app_password
SERVER_PORT=8080
```

### Frontend Variables:
```bash
REACT_APP_API_URL=https://your-backend-url.com/api
```

## 📊 Post-Deployment

### Health Checks:
- **Backend**: `https://your-backend-url.com/actuator/health`
- **Frontend**: `https://your-frontend-url.com`

### API Endpoints:
- **Signup**: `POST /api/auth/signup`
- **Login**: `POST /api/auth/login`
- **Passwords**: `GET /api/passwords`

## 🔍 Troubleshooting

### Common Issues:

1. **Build Fails**
   ```bash
   # Check logs in Railway/Render dashboard
   # Verify all dependencies are in package.json/pom.xml
   ```

2. **Database Connection**
   ```bash
   # Verify DATABASE_URL is correct
   # Check if database service is running
   ```

3. **Frontend Can't Connect to Backend**
   ```bash
   # Verify REACT_APP_API_URL is set correctly
   # Check CORS configuration in backend
   ```

4. **Port Issues**
   ```bash
   # Railway/Render auto-assigns ports
   # Use environment variables for dynamic ports
   ```

## 🎉 Success!

Once deployed, you'll have:
- ✅ **Backend API**: Running on Railway/Render
- ✅ **Frontend App**: Running on Railway/Render
- ✅ **Database**: MySQL/PostgreSQL
- ✅ **Full-stack application**: Ready to use!

## 📞 Support

If you encounter issues:
1. Check the deployment logs
2. Verify environment variables
3. Test API endpoints
4. Check database connectivity

---

**Happy Deploying! 🚀** 