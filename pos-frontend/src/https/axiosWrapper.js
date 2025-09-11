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

export const axiosWrapper = axios.create({
  baseURL: backendURL,
  withCredentials: true,
  headers: { ...defaultHeader },
});

// Axios instance cho khách vãng lai (không gửi credentials)
export const axiosGuest = axios.create({
  baseURL: backendURL,
  withCredentials: false,
  headers: { ...defaultHeader },
});
