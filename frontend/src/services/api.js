import axios from 'axios';

import { API_URL } from './config';

const api = axios.create({
    baseURL: API_URL,
    timeout: 185000, // 185s timeout for long scans
});

export const runScan = async (url, credentials = {}) => {
    const { data } = await api.post('/scan', { url, ...credentials });
    return data;
};

export default api;
