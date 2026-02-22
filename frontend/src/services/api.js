import axios from 'axios';

const api = axios.create({
    baseURL: import.meta.env.VITE_API_URL || 'http://localhost:5000/api',
});

export const runScan = async (url) => {
    const { data } = await api.post('/scan', { url });
    return data;
};

export default api;
