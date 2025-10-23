# Deployment Guide

This guide covers deploying the Chargee Developer Sandbox to various cloud platforms.

## 🚀 Heroku Deployment

### Prerequisites
- Heroku CLI installed
- Git repository
- Heroku account

### Steps

1. **Create Heroku App**
   ```bash
   heroku create your-app-name
   ```

2. **Set Environment Variables**
   ```bash
   heroku config:set REACT_APP_AMPERE_API_URL=https://ampere.prod.thunder.chargee.io/api/v2
   ```

3. **Add Buildpack**
   ```bash
   heroku buildpacks:set https://github.com/mars/create-react-app-buildpack.git
   ```

4. **Deploy**
   ```bash
   git push heroku main
   ```

5. **Open App**
   ```bash
   heroku open
   ```

### Heroku Configuration Files

Create `app.json` for one-click deployment:

```json
{
  "name": "Chargee Developer Sandbox",
  "description": "React frontend for Ampere API integration",
  "repository": "https://github.com/chargee/chargee-developer-sandbox",
  "logo": "https://www.chargee.energy/images/chargee-icon.svg",
  "keywords": ["react", "energy", "api", "chargee"],
  "env": {
    "REACT_APP_AMPERE_API_URL": {
      "description": "Ampere API base URL",
      "value": "https://ampere.prod.thunder.chargee.io/api/v2"
    }
  },
  "buildpacks": [
    {
      "url": "https://github.com/mars/create-react-app-buildpack.git"
    }
  ]
}
```

## 🐳 Coolify Deployment

### Prerequisites
- Coolify instance running
- Docker installed on Coolify server

### Steps

1. **Import Repository**
   - Go to Coolify dashboard
   - Click "New Project"
   - Select "Git Repository"
   - Enter repository URL: `https://github.com/chargee/chargee-developer-sandbox`

2. **Configure Environment**
   - Set `REACT_APP_AMPERE_API_URL=https://ampere.prod.thunder.chargee.io/api/v2`
   - Configure any custom domain settings

3. **Deploy**
   - Click "Deploy"
   - Coolify will automatically build and deploy using Docker

### Coolify Configuration

The included `docker-compose.yml` works out of the box with Coolify.

## ☁️ AWS Deployment

### Option 1: AWS Amplify

1. **Connect Repository**
   - Go to AWS Amplify Console
   - Click "New App" → "Host web app"
   - Connect your GitHub repository

2. **Configure Build Settings**
   ```yaml
   version: 1
   frontend:
     phases:
       preBuild:
         commands:
           - npm ci
       build:
         commands:
           - npm run build
     artifacts:
       baseDirectory: build
       files:
         - '**/*'
     cache:
       paths:
         - node_modules/**/*
   ```

3. **Set Environment Variables**
   - `REACT_APP_AMPERE_API_URL`: `https://ampere.prod.thunder.chargee.io/api/v2`

### Option 2: AWS ECS/Fargate

1. **Build and Push Image**
   ```bash
   # Create ECR repository
   aws ecr create-repository --repository-name chargee-sandbox
   
   # Build and tag image
   docker build -t chargee-sandbox .
   docker tag chargee-sandbox:latest YOUR_ACCOUNT.dkr.ecr.REGION.amazonaws.com/chargee-sandbox:latest
   
   # Push to ECR
   docker push YOUR_ACCOUNT.dkr.ecr.REGION.amazonaws.com/chargee-sandbox:latest
   ```

2. **Create Task Definition**
   ```json
   {
     "family": "chargee-sandbox",
     "networkMode": "awsvpc",
     "requiresCompatibilities": ["FARGATE"],
     "cpu": "256",
     "memory": "512",
     "executionRoleArn": "arn:aws:iam::ACCOUNT:role/ecsTaskExecutionRole",
     "containerDefinitions": [
       {
         "name": "chargee-sandbox",
         "image": "YOUR_ACCOUNT.dkr.ecr.REGION.amazonaws.com/chargee-sandbox:latest",
         "portMappings": [
           {
             "containerPort": 80,
             "protocol": "tcp"
           }
         ],
         "environment": [
           {
             "name": "REACT_APP_AMPERE_API_URL",
             "value": "https://ampere.prod.thunder.chargee.io/api/v2"
           }
         ],
         "logConfiguration": {
           "logDriver": "awslogs",
           "options": {
             "awslogs-group": "/ecs/chargee-sandbox",
             "awslogs-region": "us-east-1",
             "awslogs-stream-prefix": "ecs"
           }
         }
       }
     ]
   }
   ```

3. **Create ECS Service**
   - Use the task definition above
   - Configure load balancer if needed
   - Set desired count to 1

### Option 3: AWS EC2

1. **Launch EC2 Instance**
   - Use Amazon Linux 2 AMI
   - Configure security group (port 80, 443)

2. **Install Docker**
   ```bash
   sudo yum update -y
   sudo yum install -y docker
   sudo systemctl start docker
   sudo systemctl enable docker
   sudo usermod -a -G docker ec2-user
   ```

3. **Deploy Application**
   ```bash
   # Clone repository
   git clone https://github.com/chargee/chargee-developer-sandbox.git
   cd chargee-developer-sandbox
   
   # Set environment variables
   export REACT_APP_AMPERE_API_URL=https://ampere.prod.thunder.chargee.io/api/v2
   
   # Run with Docker Compose
   docker-compose up -d
   ```

## 🔧 Environment Variables

All deployments require the following environment variable:

| Variable | Description | Default |
|----------|-------------|---------|
| `REACT_APP_AMPERE_API_URL` | Ampere API base URL | `https://ampere.prod.thunder.chargee.io/api/v2` |

## 📊 Monitoring

### Health Checks

The application includes health check endpoints:

- **Docker**: `http://localhost/health`
- **Nginx**: Returns "healthy" status

### Logging

- **Docker**: Logs are available via `docker logs <container-name>`
- **Heroku**: Use `heroku logs --tail`
- **AWS**: CloudWatch logs (if configured)

## 🔒 Security Considerations

1. **HTTPS**: Always use HTTPS in production
2. **Environment Variables**: Never commit sensitive data
3. **CORS**: Configure CORS properly for your domain
4. **Rate Limiting**: Implement rate limiting for API calls

## 🚨 Troubleshooting

### Common Issues

1. **Build Failures**
   - Check Node.js version compatibility
   - Verify all dependencies are installed
   - Check for TypeScript errors

2. **Runtime Errors**
   - Verify environment variables are set
   - Check API endpoint accessibility
   - Review browser console for errors

3. **Docker Issues**
   - Ensure Docker is running
   - Check port conflicts
   - Verify image builds successfully

### Support

For deployment issues:
- Check the [GitHub Issues](https://github.com/chargee/chargee-developer-sandbox/issues)
- Contact support@chargee.energy
