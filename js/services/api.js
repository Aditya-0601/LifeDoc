/**
 * API Service Configuration
 * 
 * Sets up the Axios instance with base URL and interceptors. 
 * Specifically injects the JWT token from localStorage into outgoing requests.
 */
(function () {
  const host = window.location.hostname;
  const isLocalHost = host === 'localhost' || host === '127.0.0.1';
  const baseURL = isLocalHost
    ? 'http://localhost:5000/api'
    : 'https://lifedoc-backend.onrender.com/api';

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
