// Centralized API URL Management
// Local Backend - All frontend calls use local development server

// Check if we're in development or production
const isDevelopment = import.meta.env.DEV || import.meta.env.MODE === 'development';

// Backend URL - adjust port if your backend runs on a different port
// Common ports: 3001 (if backend runs on 3001), 5000 (recommended for backend)
// If using Vite proxy, you can use empty string for relative URLs
const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || '5000';
const USE_PROXY = import.meta.env.VITE_USE_PROXY !== 'false'; // Use proxy by default in dev

// Use relative URLs when proxy is enabled, otherwise use full URL
// For now, use full URL to avoid proxy issues - can switch to relative URLs later
const LOCAL_URL = `http://localhost:${BACKEND_PORT}`; // Full URL

// Use local backend only
export const API_BASE_URL = LOCAL_URL;

// Log current configuration
console.log(`🔌 API Base URL: ${API_BASE_URL} (LOCAL)`);

// Helper function for making API calls
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  const token = localStorage.getItem('authToken');
  
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...(options.headers || {}),
  };
  
  return fetch(url, {
    ...options,
    headers,
  });
};

export default API_BASE_URL;
