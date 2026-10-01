import axios from 'axios';

const getApiBaseUrl = () => {
  const configuredUrl =
    process.env.REACT_APP_API_URL || 'http://localhost:5000';

  try {
    const apiUrl = new URL(configuredUrl);
    const browserHostname = window.location.hostname;
    const configuredForLoopback = ['localhost', '127.0.0.1'].includes(
      apiUrl.hostname,
    );
    const browserIsRemote = !['localhost', '127.0.0.1'].includes(
      browserHostname,
    );

    // When the frontend is opened from a phone/tablet on the local network,
    // localhost refers to that device. Use the frontend host for the API too.
    if (configuredForLoopback && browserIsRemote) {
      apiUrl.hostname = browserHostname;
    }

    return `${apiUrl.toString().replace(/\/$/, '')}/api`;
  } catch (error) {
    return `${configuredUrl.replace(/\/$/, '')}/api`;
  }
};

const api = axios.create({
  baseURL: getApiBaseUrl(),
  // baseURL: process.env.REACT_APP_API_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor to attach the token
api.interceptors.request.use(
  (config) => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        if (user.token) {
          // console.log('Attaching user token:', user.token.substring(0, 10) + '...');
          config.headers.Authorization = `Bearer ${user.token}`;
        }
      } catch (error) {
        console.error('Error parsing user from localStorage', error);
      }
    }

    // Fallback: check for standalone token if not found in user object
    if (!config.headers.Authorization) {
      const token = localStorage.getItem('token');
      if (token) {
        // console.log('Attaching fallback token:', token.substring(0, 10) + '...');
        config.headers.Authorization = `Bearer ${token}`;
      }
    }

    return config;
  },
  (error) => {
    return Promise.reject(error);
  },
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && [401, 403].includes(error.response.status)) {
      const isAuthEndpoint = error.config && error.config.url && error.config.url.includes('/auth/');
      
      // Clear local storage and redirect to login if token is invalid or access is forbidden (e.g., inactive user)
      // but only if it's not an authentication request itself (like login or requesting an OTP)
      if (!isAuthEndpoint) {
        localStorage.removeItem('user');
        localStorage.removeItem('token');
        if (window.location.pathname !== '/login') {
          window.location.href = '/login';
        }
      }
    }
    return Promise.reject(error);
  },
);

export default api;
