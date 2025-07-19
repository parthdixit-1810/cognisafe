# CogniSafe Password Vault - Deployment Guide

## 🚀 Quick Start

### Option 1: Automated Deployment (Recommended)
```bash
cd spring-boot-backend
./deploy.sh
```

### Option 2: Docker Compose Deployment
```bash
cd spring-boot-backend
docker-compose up --build -d
```

### Option 3: Manual Deployment
```bash
cd spring-boot-backend
mvn clean package
java -jar target/passwordvault-0.0.1-SNAPSHOT.jar
```

## 📋 Prerequisites

- **Java 17+** - [Download here](https://adoptium.net/)
- **Maven 3.6+** - [Download here](https://maven.apache.org/download.cgi)
- **MySQL 8.0+** - [Download here](https://dev.mysql.com/downloads/mysql/)
- **Docker & Docker Compose** (optional) - [Download here](https://www.docker.com/products/docker-desktop/)

## 🔧 Configuration

### Database Setup
1. Install MySQL 8.0
2. Create database:
```sql
CREATE DATABASE cognisafe;
```
3. Update `application.properties` with your MySQL credentials

### Environment Variables (Production)
```bash
export DATABASE_URL=jdbc:mysql://your-mysql-host:3306/cognisafe
export DATABASE_USERNAME=your_username
export DATABASE_PASSWORD=your_password
export MAIL_USERNAME=your_email@gmail.com
export MAIL_PASSWORD=your_app_password
```

## 🌐 Deployment Options

### 1. Local Development
```bash
mvn spring-boot:run
```
Access: http://localhost:8080

### 2. Docker Deployment
```bash
# Build and run with Docker Compose
docker-compose up --build -d

# Or build manually
docker build -t cognisafe-app .
docker run -p 8080:8080 cognisafe-app
```

### 3. Cloud Deployment

#### Heroku
```bash
# Install Heroku CLI
heroku create your-app-name
heroku config:set DATABASE_URL=your_mysql_url
git push heroku main
```

#### AWS EC2
```bash
# SSH to your EC2 instance
sudo yum update -y
sudo yum install java-17-amazon-corretto -y
sudo yum install maven -y

# Deploy your JAR
java -jar passwordvault-0.0.1-SNAPSHOT.jar
```

#### Google Cloud Run
```bash
# Build and deploy
gcloud builds submit --tag gcr.io/PROJECT_ID/cognisafe
gcloud run deploy --image gcr.io/PROJECT_ID/cognisafe --platform managed
```

## 🔍 Troubleshooting

### Common Issues

1. **Port 8080 already in use**
   ```bash
   # Find process using port 8080
   lsof -i :8080
   # Kill the process
   kill -9 <PID>
   ```

2. **MySQL connection failed**
   ```bash
   # Check MySQL status
   sudo systemctl status mysql
   # Start MySQL if not running
   sudo systemctl start mysql
   ```

3. **Build fails**
   ```bash
   # Clean and rebuild
   mvn clean package -DskipTests
   ```

### Logs
```bash
# View application logs
tail -f logs/application.log

# Docker logs
docker-compose logs -f app
```

## 📊 Health Check

Once deployed, check these endpoints:
- **Health**: http://localhost:8080/actuator/health
- **API Docs**: http://localhost:8080/swagger-ui.html (if enabled)

## 🔒 Security Notes

1. **Never commit sensitive data** to version control
2. **Use environment variables** for production credentials
3. **Enable HTTPS** in production
4. **Regular security updates** for dependencies

## 📞 Support

If you encounter issues:
1. Check the logs for error messages
2. Verify all prerequisites are installed
3. Ensure database connectivity
4. Check firewall settings

---

**Happy Deploying! 🎉** 