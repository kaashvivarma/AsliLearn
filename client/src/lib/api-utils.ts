// Centralized API URL Management
// Local Backend - All frontend calls use local development server

const LOCAL_URL = 'http://localhost:3001'; // Change this if your local backend runs on different port

// Check environment
const isDevelopment = import.meta.env.DEV || window.location.hostname === 'localhost';

// Use local backend only
export const API_BASE_URL = LOCAL_URL;

// Log current configuration (helps with debugging)
if (isDevelopment) {
  console.log(`🔌 Backend Mode: LOCAL`);
  console.log(`📡 API Base URL: ${API_BASE_URL}`);
}

// Helper function for making API calls with automatic URL handling
export const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  // Handle both relative and absolute URLs
  const url = endpoint.startsWith('http') 
    ? endpoint 
    : `${API_BASE_URL}${endpoint.startsWith('/') ? endpoint : '/' + endpoint}`;
  
  // Get JWT token from localStorage
  const token = localStorage.getItem('authToken');
  
  // Merge headers
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



