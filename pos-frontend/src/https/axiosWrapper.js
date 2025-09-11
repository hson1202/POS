import axios from "axios";

const defaultHeader = {
  "Content-Type": "application/json",
  Accept: "application/json",
};

// Tự động detect backend URL
const getBackendURL = () => {
  // Nếu có VITE_BACKEND_URL thì dùng (production)
  if (import.meta.env.VITE_BACKEND_URL) {
    // Đảm bảo URL có https://
    const url = import.meta.env.VITE_BACKEND_URL;
    return url.startsWith('http') ? url : `https://${url}`;
  }
  
  // Development mode
  if (import.meta.env.DEV) {
    return "http://localhost:3000";
  }
  
  // Fallback: dùng localhost:3000
  return "http://localhost:3000";
};

const backendURL = getBackendURL();

// Debug log
console.log('🔗 Axios Configuration:', {
  backendURL,
  envVITE_BACKEND_URL: import.meta.env.VITE_BACKEND_URL,
  envDEV: import.meta.env.DEV,
  envPROD: import.meta.env.PROD
});

export const axiosWrapper = axios.create({
  baseURL: backendURL,
  withCredentials: true,
  headers: { ...defaultHeader },
  timeout: 10000, // 10 second timeout
});

// Add request interceptor for debugging
axiosWrapper.interceptors.request.use(
  (config) => {
    console.log('🚀 API Request:', {
      method: config.method?.toUpperCase(),
      url: config.url,
      baseURL: config.baseURL,
      fullURL: `${config.baseURL}${config.url}`,
      withCredentials: config.withCredentials,
      headers: config.headers
    });
    return config;
  },
  (error) => {
    console.error('❌ Request Error:', error);
    return Promise.reject(error);
  }
);

// Add response interceptor for debugging
axiosWrapper.interceptors.response.use(
  (response) => {
    console.log('✅ API Response:', {
      status: response.status,
      statusText: response.statusText,
      url: response.config.url,
      data: response.data
    });
    return response;
  },
  (error) => {
    console.error('❌ API Error:', {
      message: error.message,
      status: error.response?.status,
      statusText: error.response?.statusText,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
      data: error.response?.data
    });
    return Promise.reject(error);
  }
);

// Axios instance cho khách vãng lai (không gửi credentials)
export const axiosGuest = axios.create({
  baseURL: backendURL,
  withCredentials: false,
  headers: { ...defaultHeader },
});
