import axios from 'axios';

import { v4 as uuidv4 } from 'uuid';

const api = axios.create({
  baseURL: 'http://localhost:5000/api', // Replace with real backend URL
  headers: {
    'Content-Type': 'application/json'
  }
});

api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Attach an Idempotency Key to all mutating requests to prevent double spending
  if (config.method === 'post' || config.method === 'put' || config.method === 'patch') {
    config.headers['x-idempotency-key'] = uuidv4();
  }

  return config;
}, error => Promise.reject(error));

export default api;
