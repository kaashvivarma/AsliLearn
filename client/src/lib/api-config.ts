// Centralized API URL Management
// PRODUCTION BACKEND - All frontend calls now use Railway production server

const RAILWAY_URL = 'https://asli-stud-back-production.up.railway.app';
const LOCAL_URL = 'http://localhost:3001'; // Local backend URL

// Force production backend
export const API_BASE_URL = RAILWAY_URL;

// Log current configuration
console.log(`🔌 API Base URL: ${API_BASE_URL} (PRODUCTION)`);

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
