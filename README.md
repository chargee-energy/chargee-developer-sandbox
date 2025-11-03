# Chargee Developer Playground

A React frontend application demonstrating how to integrate with the Ampere API. This project showcases authentication, real-time energy monitoring, and device management capabilities.

![Chargee Developer Playground](https://img.shields.io/badge/React-18.2.0-blue.svg)
![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)
![Docker](https://img.shields.io/badge/Docker-Ready-blue.svg)

## 🚀 Features

- **Authentication**: Secure login with JWT token management
- **Real-time Energy Monitoring**: Live power consumption and export visualization
- **Device Management**: View and manage EVs, chargers, solar inverters, and more
- **Sparky Integration**: Real-time energy data from Chargee Sparky devices
- **Admin Tools**: Direct API querying capabilities for administrators
- **Responsive Design**: Modern UI with Chargee branding
- **Docker Ready**: Easy deployment with Docker Compose

## 📋 Prerequisites

- Node.js 18+ and npm
- Docker and Docker Compose (for containerized deployment)
- Ampere API access credentials

## 🛠️ Quick Start

### Option 1: Local Development

1. **Clone the repository**
   ```bash
   git clone https://github.com/chargee/chargee-developer-playground.git
   cd chargee-developer-playground
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm start
   ```

4. **Open your browser**
   Navigate to `http://localhost:3000`

### Option 2: Docker Deployment

1. **Clone and run with Docker Compose**
   ```bash
   git clone https://github.com/chargee/chargee-developer-playground.git
   cd chargee-developer-playground
   docker-compose up -d
   ```

2. **Access the application**
   Navigate to `http://localhost:3000`

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
# Ampere API Configuration
REACT_APP_AMPERE_API_URL=https://ampere.prod.thunder.chargee.io/api/v2

# Optional: Custom API URL for development
# REACT_APP_AMPERE_API_URL=http://localhost:8080/api/v2
```

### API Endpoints

The application integrates with the following Ampere API endpoints:

- **Authentication**: `/auth/login`, `/auth/me`
- **Groups**: `/groups`
- **Addresses**: `/groups/{group_uuid}/addresses`
- **Devices**: Various device-specific endpoints
- **Sparky**: Real-time energy monitoring endpoints

## 🏗️ Project Structure

```
src/
├── components/          # React components
│   ├── Login.js         # Authentication component
│   ├── Dashboard.js     # Main dashboard
│   ├── SparkyDetails.js # Energy monitoring
│   └── EnergyGraph.js   # Real-time charts
├── contexts/            # React contexts
│   └── AuthContext.js   # Authentication state
├── services/            # API services
│   └── api.js          # API client configuration
└── App.js              # Main application component
```

## 📊 API Integration Examples

### Authentication
```javascript
import { authAPI } from './services/api';

// Login
const result = await authAPI.login(email, password);
const { accessToken } = result;

// Get current user
const user = await authAPI.getMe();
```

### Fetching Groups and Addresses
```javascript
import { groupsAPI, addressesAPI } from './services/api';

// Get user groups
const groups = await groupsAPI.getGroups();

// Get addresses for a group
const addresses = await addressesAPI.getAddresses(groupUuid);
```

### Real-time Energy Monitoring
```javascript
import { sparkyAPI } from './services/api';

// Get latest electricity data
const data = await sparkyAPI.getElectricityLatestP1(serialNumber);
const netPower = (data.power_returned - data.power_delivered) * 1000; // Convert to Watts
```

## 🚀 Deployment

### Heroku

1. **Create a Heroku app**
   ```bash
   heroku create your-app-name
   ```

2. **Set environment variables**
   ```bash
   heroku config:set REACT_APP_AMPERE_API_URL=https://ampere.prod.thunder.chargee.io/api/v2
   ```

3. **Deploy**
   ```bash
   git push heroku main
   ```

### Coolify

1. **Import the repository** in Coolify
2. **Set environment variables** in the Coolify dashboard
3. **Deploy** using the Docker Compose configuration

### AWS (ECS/Fargate)

1. **Build and push Docker image**
   ```bash
   docker build -t chargee-playground .
   docker tag chargee-playground:latest your-ecr-repo/chargee-playground:latest
   docker push your-ecr-repo/chargee-playground:latest
   ```

2. **Deploy using ECS** with the provided task definition

### Docker Compose

The included `docker-compose.yml` provides:

- **Nginx reverse proxy** for production-ready serving
- **Multi-stage build** for optimized image size
- **Environment variable** configuration
- **Health checks** for container monitoring

## 🔐 Security Considerations

- **No hardcoded credentials**: All API endpoints use environment variables
- **JWT token management**: Secure token storage and automatic refresh
- **CORS configuration**: Proper cross-origin request handling
- **Input validation**: Client-side validation for all forms

## 🧪 Testing

```bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage

# Run linting
npm run lint
```

## 📚 API Documentation

For detailed API documentation, visit:
- [Ampere API Swagger](https://ampere.prod.thunder.chargee.io/api/v2#/)

### Key Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/auth/login` | POST | User authentication |
| `/auth/me` | GET | Get current user info |
| `/groups` | GET | List user groups |
| `/groups/{id}/addresses` | GET | List group addresses |
| `/sparkies/{serial}/electricity/latest-p1` | GET | Real-time energy data |

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

- **Documentation**: [Ampere API Docs](https://ampere.prod.thunder.chargee.io/api/v2#/)
- **Issues**: [GitHub Issues](https://github.com/chargee/chargee-developer-playground/issues)
- **Email**: support@chargee.energy

## 🙏 Acknowledgments

- Built with [React](https://reactjs.org/)
- Charts powered by [Recharts](https://recharts.org/)
- Styled with [CSS Custom Properties](https://developer.mozilla.org/en-US/docs/Web/CSS/Using_CSS_custom_properties)
- Deployed with [Docker](https://www.docker.com/)

---

**Made with ❤️ by the Chargee Team**