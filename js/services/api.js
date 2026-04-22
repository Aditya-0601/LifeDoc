/**
 * API Service Configuration
 * 
 * Sets up the Axios instance with base URL and interceptors. 
 * Specifically injects the JWT token from localStorage into outgoing requests.
 */
(function () {
  const host = window.location.hostname;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  const configuredBaseUrl = window.LIFEDOC_API_BASE_URL || localStorage.getItem('lifedoc.apiBaseUrl');
  const defaultProductionBaseUrl = 'https://lifedoc-backend.onrender.com/api';

  const normalizeApiBaseUrl = (value) => {
    if (!value) return value;
    const trimmed = value.trim().replace(/\/+$/, '');
    return trimmed.endsWith('/api') ? trimmed : `${trimmed}/api`;
  };

  const baseURL = normalizeApiBaseUrl(configuredBaseUrl) || (
    isLocalHost
      ? 'http://localhost:5000/api'
      : defaultProductionBaseUrl
  );
  const backendOrigin = baseURL.replace(/\/api$/, '');

  const api = window.axios.create({
    baseURL,
    headers: {
      'Content-Type': 'application/json'
    }
  });

  // Request interceptor to add token
  api.interceptors.request.use(
    (config) => {
      const token = localStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
      const adminPasscode = sessionStorage.getItem('adminPasscode');
      if (adminPasscode) {
        config.headers['X-Admin-Passcode'] = adminPasscode;
      }
      return config;
    },
    (error) => Promise.reject(error)
  );

  window.api = api;
  window.LifeDocConfig = {
    apiBaseUrl: baseURL,
    backendOrigin
  };
  window.resolveLifeDocUrl = (value) => {
    if (!value) return backendOrigin;
    if (/^https?:\/\//i.test(value)) return value;
    return `${backendOrigin}${value.startsWith('/') ? '' : '/'}${value}`;
  };
})();
