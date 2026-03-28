import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';

const api = axios.create({
  baseURL: 'http://localhost:5000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {

  // 🔥 STEP 1: Skip Authorization for OTP verification
  if (config.url.includes('/auth/verify-otp')) {
    console.log('⚡ Skipping Authorization header for OTP verification');
    return config;
  }

  // 🔥 STEP 2: Attach token normally for other requests
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // 🔥 STEP 3: Add Idempotency Key
  if (['post', 'put', 'patch'].includes(config.method)) {
    config.headers['x-idempotency-key'] = uuidv4();
  }

  return config;

}, error => Promise.reject(error));

export default api;