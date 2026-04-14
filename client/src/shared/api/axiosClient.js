import axios from 'axios';

export const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
});

axiosClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('token'); // 👈 ВСЕГДА актуальный

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  } else {
    delete config.headers.Authorization;
  }

  return config;
});