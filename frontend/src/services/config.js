export const API_BASE = import.meta.env.VITE_API_URL || '';
export const API_URL = API_BASE.endsWith('/api') ? API_BASE : `${API_BASE}/api`;
