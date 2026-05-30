#!/bin/bash

echo "🚀 Starting CogniSafe Password Vault Deployment..."

# Check if Java is installed
if ! command -v java &> /dev/null; then
    echo "❌ Java is not installed. Please install Java 17 or higher."
    exit 1
fi

# Check if Maven is installed
if ! command -v mvn &> /dev/null; then
    echo "❌ Maven is not installed. Please install Maven."
    exit 1
fi

# Check if MySQL is running
echo "🔍 Checking MySQL connection..."
if ! mysql -u root -p'Ad@121964' -e "SELECT 1;" &> /dev/null; then
    echo "⚠️  MySQL is not running or credentials are incorrect."
    echo "Starting MySQL with Docker..."
    docker run -d --name cognisafe-mysql \
        -e MYSQL_ROOT_PASSWORD=Ad@121964 \
        -e MYSQL_DATABASE=cognisafe \
        -p 3306:3306 \
        mysql:8.0
    
    echo "⏳ Waiting for MySQL to start..."
    sleep 30
fi

# Clean and build the project
echo "🔨 Building the application..."
mvn clean package -DskipTests

if [ $? -ne 0 ]; then
    echo "❌ Build failed!"
    exit 1
fi

echo "✅ Build successful!"

# Check if Docker is available for containerized deployment
if command -v docker &> /dev/null && command -v docker-compose &> /dev/null; then
    echo "🐳 Docker detected. Deploying with Docker Compose..."
    
    # Stop existing containers
    docker-compose down 2>/dev/null
    
    # Build and start containers
    docker-compose up --build -d
    
    echo "✅ Application deployed with Docker!"
    echo "🌐 Access your application at: http://localhost:8080"
    echo "📊 View logs with: docker-compose logs -f app"
    
else
    echo "📦 Deploying as standalone application..."
    
    # Run the application
    echo "🚀 Starting application..."
    java -jar target/passwordvault-0.0.1-SNAPSHOT.jar --spring.profiles.active=prod
    
    echo "✅ Application started!"
    echo "🌐 Access your application at: http://localhost:8080"
fi

echo "🎉 Deployment completed!" 