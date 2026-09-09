import axios from 'axios';

export const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem('assistant_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});
