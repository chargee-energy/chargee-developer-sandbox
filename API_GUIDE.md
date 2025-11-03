# API Integration Guide

This guide explains how to integrate with the Ampere API using the patterns demonstrated in this project.

## 🔐 Authentication

### Login Flow

```javascript
import { authAPI } from './services/api';

// Login user
const loginUser = async (email, password) => {
  try {
    const response = await authAPI.login(email, password);
    const { accessToken, uuid, email: userEmail, username, role } = response;
    
    // Store token for future requests
    localStorage.setItem('authToken', accessToken);
    
    return { success: true, user: { uuid, email: userEmail, username, role } };
  } catch (error) {
    return { success: false, error: error.response?.data?.message };
  }
};
```

### Token Management

```javascript
// Automatic token attachment via Axios interceptor
const api = axios.create({
  baseURL: process.env.REACT_APP_AMPERE_API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor adds Bearer token
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('authToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor handles token expiration
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('authToken');
      // Redirect to login
    }
    return Promise.reject(error);
  }
);
```

## 📊 Data Fetching Patterns

### Groups and Addresses

```javascript
// Fetch user groups
const fetchGroups = async () => {
  try {
    const response = await groupsAPI.getGroups();
    return response.data?.groups || [];
  } catch (error) {
    console.error('Error fetching groups:', error);
    return [];
  }
};

// Fetch addresses for a group
const fetchAddresses = async (groupUuid) => {
  try {
    const response = await addressesAPI.getAddresses(groupUuid);
    return response.data?.addresses || [];
  } catch (error) {
    console.error('Error fetching addresses:', error);
    return [];
  }
};
```

### Device Management

```javascript
// Fetch all device types for an address
const fetchAllDevices = async (addressUuid) => {
  try {
    const [vehicles, chargers, solarInverters, smartMeters, hvacs, batteries, gridConnections] = 
      await Promise.all([
        devicesAPI.getVehicles(addressUuid),
        devicesAPI.getChargers(addressUuid),
        devicesAPI.getSolarInverters(addressUuid),
        devicesAPI.getSmartMeters(addressUuid),
        devicesAPI.getHvacs(addressUuid),
        devicesAPI.getBatteries(addressUuid),
        devicesAPI.getGridConnections(addressUuid),
      ]);

    return {
      vehicles: vehicles?.data || [],
      chargers: chargers?.data || [],
      solarInverters: solarInverters?.data || [],
      smartMeters: smartMeters?.data || [],
      hvacs: hvacs?.data || [],
      batteries: batteries?.data || [],
      gridConnections: gridConnections?.data || [],
    };
  } catch (error) {
    console.error('Error fetching devices:', error);
    return {};
  }
};
```

## ⚡ Real-time Energy Monitoring

### Sparky Data Fetching

```javascript
// Fetch real-time electricity data
const fetchRealTimeData = async (serialNumber) => {
  try {
    const data = await sparkyAPI.getElectricityLatestP1(serialNumber);
    
    // Convert from kW to Watts
    const delivered = (data.power_delivered || 0) * 1000;
    const returned = (data.power_returned || 0) * 1000;
    const netPower = returned - delivered;
    
    return {
      delivered,
      returned,
      netPower,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    console.error('Error fetching real-time data:', error);
    return null;
  }
};

// Fetch historical data
const fetchHistoricalData = async (serialNumber, date) => {
  try {
    const [electricity, gas, total] = await Promise.all([
      sparkyAPI.getElectricity15min(serialNumber, date),
      sparkyAPI.getGas15min(serialNumber, date),
      sparkyAPI.getTotal15min(serialNumber, date),
    ]);

    return {
      electricity: electricity?.data || [],
      gas: gas?.data || [],
      total: total?.data || [],
    };
  } catch (error) {
    console.error('Error fetching historical data:', error);
    return { electricity: [], gas: [], total: [] };
  }
};
```

### Real-time Updates

```javascript
// Set up real-time monitoring
const useRealTimeMonitoring = (serialNumber, interval = 1000) => {
  const [data, setData] = useState([]);
  const [isActive, setIsActive] = useState(false);
  const intervalRef = useRef(null);

  const fetchData = useCallback(async () => {
    if (!serialNumber) return;
    
    const newData = await fetchRealTimeData(serialNumber);
    if (newData) {
      setData(prev => {
        const updated = [...prev, newData];
        return updated.length > 60 ? updated.slice(-60) : updated; // Keep last 60 points
      });
    }
  }, [serialNumber]);

  useEffect(() => {
    if (isActive) {
      fetchData(); // Initial fetch
      intervalRef.current = setInterval(fetchData, interval);
    } else {
      clearInterval(intervalRef.current);
    }

    return () => clearInterval(intervalRef.current);
  }, [isActive, fetchData, interval]);

  return { data, isActive, setIsActive };
};
```

## 🎯 Error Handling Patterns

### API Error Handling

```javascript
const handleApiCall = async (apiFunction, ...args) => {
  try {
    const result = await apiFunction(...args);
    return { success: true, data: result };
  } catch (error) {
    console.error('API Error:', error);
    
    if (error.response) {
      // Server responded with error status
      return {
        success: false,
        error: error.response.data?.message || 'Server error',
        status: error.response.status,
      };
    } else if (error.request) {
      // Request was made but no response received
      return {
        success: false,
        error: 'Network error - please check your connection',
      };
    } else {
      // Something else happened
      return {
        success: false,
        error: 'An unexpected error occurred',
      };
    }
  }
};
```

### React Error Boundaries

```javascript
class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Error caught by boundary:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="error-boundary">
          <h2>Something went wrong</h2>
          <p>Please refresh the page or contact support if the problem persists.</p>
        </div>
      );
    }

    return this.props.children;
  }
}
```

## 🔄 State Management

### Context Pattern

```javascript
// AuthContext example
const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const login = async (email, password) => {
    try {
      const response = await authAPI.login(email, password);
      const { accessToken, ...userData } = response;
      
      localStorage.setItem('authToken', accessToken);
      setIsAuthenticated(true);
      setUser(userData);
      
      return { success: true };
    } catch (error) {
      return { success: false, error: error.response?.data?.message };
    }
  };

  const logout = () => {
    localStorage.removeItem('authToken');
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{
      isAuthenticated,
      user,
      login,
      logout,
      loading,
    }}>
      {children}
    </AuthContext.Provider>
  );
};
```

## 📈 Data Visualization

### Chart Integration

```javascript
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

const EnergyChart = ({ data }) => {
  const formatPowerValue = (value) => {
    const numValue = typeof value === 'number' ? value : parseFloat(value) || 0;
    return `${numValue} W`;
  };

  return (
    <ResponsiveContainer width="100%" height={300}>
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" />
        <XAxis dataKey="time" />
        <YAxis label={{ value: 'Power (W)', angle: -90, position: 'insideLeft' }} />
        <Tooltip 
          formatter={(value) => [formatPowerValue(value), 'Power']}
          labelFormatter={(label) => `Time: ${label}`}
        />
        <Line 
          type="monotone" 
          dataKey="netPower" 
          stroke="#00BFA5" 
          strokeWidth={2}
          dot={false}
        />
      </LineChart>
    </ResponsiveContainer>
  );
};
```

## 🛠️ Custom Hooks

### Data Fetching Hook

```javascript
const useApiData = (apiFunction, dependencies = []) => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        const result = await apiFunction();
        setData(result);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, dependencies);

  return { data, loading, error };
};
```

## 🔧 Configuration

### Environment-based Configuration

```javascript
// config.js
export const config = {
  apiUrl: process.env.REACT_APP_AMPERE_API_URL || 'https://ampere.prod.thunder.chargee.io/api/v2',
  debug: process.env.REACT_APP_DEBUG === 'true',
  appTitle: process.env.REACT_APP_APP_TITLE || 'Chargee Developer Playground',
  primaryColor: process.env.REACT_APP_PRIMARY_COLOR || '#00BFA5',
  secondaryColor: process.env.REACT_APP_SECONDARY_COLOR || '#1976D2',
};
```

## 📚 API Endpoints Reference

| Endpoint | Method | Description | Parameters |
|----------|--------|-------------|------------|
| `/auth/login` | POST | User authentication | `{ email, password }` |
| `/auth/me` | GET | Get current user | Headers: `Authorization: Bearer <token>` |
| `/groups` | GET | List user groups | Headers: `Authorization: Bearer <token>` |
| `/groups/{id}/addresses` | GET | List group addresses | Headers: `Authorization: Bearer <token>` |
| `/addresses/{id}/vehicles` | GET | List address vehicles | Headers: `Authorization: Bearer <token>` |
| `/addresses/{id}/chargers` | GET | List address chargers | Headers: `Authorization: Bearer <token>` |
| `/sparkies/{serial}/electricity/latest-p1` | GET | Real-time electricity data | Headers: `Authorization: Bearer <token>` |
| `/sparkies/{serial}/electricity/15min` | GET | Historical electricity data | Query: `date=YYYY-MM-DD` |
| `/sparkies/{serial}/gas/15min` | GET | Historical gas data | Query: `date=YYYY-MM-DD` |

## 🚀 Best Practices

1. **Error Handling**: Always wrap API calls in try-catch blocks
2. **Loading States**: Show loading indicators during API calls
3. **Caching**: Implement appropriate caching strategies
4. **Rate Limiting**: Respect API rate limits
5. **Security**: Never expose sensitive data in client-side code
6. **Testing**: Write tests for API integration functions
7. **Documentation**: Document custom API functions and hooks
