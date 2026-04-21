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
  const baseURL = configuredBaseUrl || (
    isLocalHost
      ? 'http://localhost:5000/api'
      : `${window.location.origin}/api`
  );

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
})();
