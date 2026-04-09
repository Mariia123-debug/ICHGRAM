import axios from 'axios';
import { getToken } from '../lib/token';

export const axiosClient = axios.create({
  baseURL: 'http://localhost:5000/api',
});

axiosClient.interceptors.request.use((config) => {
  const token = getToken();

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});