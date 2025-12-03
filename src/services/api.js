import axios from 'axios';

const API_BASE_URL = process.env.REACT_APP_AMPERE_API_URL || 'https://ampere.prod.thunder.chargee.io/api/v2';

// Create axios instance with default config
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor to include auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('authToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add response interceptor to handle auth errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      // Token expired or invalid, clear it and redirect to login
      localStorage.removeItem('authToken');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const authAPI = {
  login: async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    return response.data;
  },
  getMe: async () => {
    const response = await api.get('/auth/me');
    return response.data;
  },
};

export const groupsAPI = {
  getGroups: async () => {
    const response = await api.get('/groups');
    return response.data;
  },
  getGroupEnergyLatest: async (groupUuid) => {
    const response = await api.get(`/groups/${groupUuid}/energy/latest`);
    return response.data;
  },
};

export const addressesAPI = {
  getAddresses: async (groupUuid, params = {}) => {
    const response = await api.get(`/groups/${groupUuid}/addresses`, { params });
    return response.data;
  },
};

export const devicesAPI = {
  getDevices: async (groupUuid, addressUuid) => {
    const response = await api.get(`/groups/${groupUuid}/addresses/${addressUuid}/devices`);
    return response.data;
  },
  getVehicles: async (addressUuid) => {
    const response = await api.get(`/addresses/${addressUuid}/vehicles`);
    return response.data;
  },
  getChargers: async (addressUuid) => {
    const response = await api.get(`/addresses/${addressUuid}/chargers`);
    return response.data;
  },
  getSolarInverters: async (addressUuid) => {
    const response = await api.get(`/addresses/${addressUuid}/solar-inverters`);
    return response.data;
  },
  getSmartMeters: async (addressUuid) => {
    const response = await api.get(`/addresses/${addressUuid}/smart-meters`);
    return response.data;
  },
  getHvacs: async (addressUuid) => {
    const response = await api.get(`/addresses/${addressUuid}/hvacs`);
    return response.data;
  },
  getBatteries: async (addressUuid) => {
    const response = await api.get(`/addresses/${addressUuid}/batteries`);
    return response.data;
  },
  getGridConnections: async (addressUuid) => {
    const response = await api.get(`/addresses/${addressUuid}/grid-connections`);
    return response.data;
  },
  getSmartMeterDeliveryForecast: async (addressUuid, smartMeterUuid, date) => {
    const response = await api.get(`/addresses/${addressUuid}/smart-meters/${smartMeterUuid}/delivery-forecast`, {
      params: { date }
    });
    return response.data;
  },
  getSmartMeterReturnForecast: async (addressUuid, smartMeterUuid, date) => {
    const response = await api.get(`/addresses/${addressUuid}/smart-meters/${smartMeterUuid}/return-forecast`, {
      params: { date }
    });
    return response.data;
  },
  getSolarInverterProductionForecast: async (addressUuid, solarInverterUuid, date) => {
    const response = await api.get(`/addresses/${addressUuid}/solar-inverters/${solarInverterUuid}/production-forecast`, {
      params: { date }
    });
    return response.data;
  },
  getSolarInverterProduction: async (addressUuid, solarInverterUuid, fromDate, toDate, sortBy = 'ASC', limit = 100) => {
    const response = await api.get(`/addresses/${addressUuid}/solar-inverters/${solarInverterUuid}/energy/production`, {
      params: { fromDate, toDate, sortBy, limit }
    });
    return response.data;
  },
  getSolarInverterSchedules: async (addressUuid, solarInverterUuid) => {
    const response = await api.get(`/addresses/${addressUuid}/solar_inverters/${solarInverterUuid}/schedules`);
    return response.data;
  },
  getSolarInverterSchedule: async (addressUuid, solarInverterUuid, scheduleUuid) => {
    const response = await api.get(`/addresses/${addressUuid}/solar_inverters/${solarInverterUuid}/schedules/${scheduleUuid}`);
    return response.data;
  },
  createSolarInverterSchedule: async (addressUuid, solarInverterUuid, scheduleData) => {
    const response = await api.post(`/addresses/${addressUuid}/solar_inverters/${solarInverterUuid}/schedules`, scheduleData);
    return response.data;
  },
  updateSolarInverterSchedule: async (addressUuid, solarInverterUuid, scheduleUuid, scheduleData) => {
    const response = await api.put(`/addresses/${addressUuid}/solar_inverters/${solarInverterUuid}/schedules/${scheduleUuid}`, scheduleData);
    return response.data;
  },
  deleteSolarInverterSchedule: async (addressUuid, solarInverterUuid, scheduleUuid) => {
    const response = await api.delete(`/addresses/${addressUuid}/solar_inverters/${solarInverterUuid}/schedules/${scheduleUuid}`);
    return response.data;
  },
};

export const sparkyAPI = {
  getSparkyDetails: async (serialNumber) => {
    const response = await api.get(`/sparkies/${serialNumber}`);
    return response.data;
  },
  getSparkyAccess: async (serialNumber) => {
    const response = await api.get(`/sparkies/${serialNumber}/access`);
    return response.data;
  },
  getElectricityLatest: async (serialNumber) => {
    const response = await api.get(`/sparkies/${serialNumber}/electricity/latest`);
    return response.data;
  },
  getElectricityLatestP1: async (serialNumber) => {
    const response = await api.get(`/sparkies/${serialNumber}/electricity/latest-p1`);
    return response.data;
  },
  getElectricityFirst: async (serialNumber) => {
    const response = await api.get(`/sparkies/${serialNumber}/electricity/first`);
    return response.data;
  },
  getElectricity15min: async (serialNumber, date) => {
    const response = await api.get(`/sparkies/${serialNumber}/electricity/15min`, {
      params: { date }
    });
    return response.data;
  },
  getGas15min: async (serialNumber, date) => {
    const response = await api.get(`/sparkies/${serialNumber}/gas/15min`, {
      params: { date }
    });
    return response.data;
  },
  getTotal15min: async (serialNumber, date) => {
    const response = await api.get(`/sparkies/${serialNumber}/total/15min`, {
      params: { date }
    });
    return response.data;
  },
  getBoxCode: async () => {
    const response = await api.get('/sparkies/box-code');
    return response.data;
  },
};

export default api;
