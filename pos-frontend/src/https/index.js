import { axiosWrapper, axiosGuest } from "./axiosWrapper";

// API Endpoints

// Auth Endpoints
export const login = (data) => axiosWrapper.post("/api/user/login", data);
export const register = (data) => axiosWrapper.post("/api/user/register", data);
export const getUserData = () => axiosWrapper.get("/api/user");
export const logout = () => axiosWrapper.post("/api/user/logout");

// Table Endpoints
export const addTable = (data) => axiosWrapper.post("/api/table/", data);
export const getTables = () => axiosWrapper.get("/api/table");
export const updateTable = ({ tableId, ...tableData }) =>
  axiosWrapper.put(`/api/table/${tableId}`, tableData);
export const deleteTable = (tableId) => axiosWrapper.delete(`/api/table/${tableId}`);

// Payment Endpoints
export const createOrderRazorpay = (data) =>
  axiosWrapper.post("/api/payment/create-order", data);
export const verifyPaymentRazorpay = (data) =>
  axiosWrapper.post("/api/payment//verify-payment", data);

// Order Endpoints
export const addOrder = (data) => axiosWrapper.post("/api/order/", data);
export const addOrderGuest = (data) => axiosGuest.post("/api/order/", data); // For walk-in customers
export const getOrders = () => axiosWrapper.get("/api/order");
export const getOrderById = (orderId) => axiosWrapper.get(`/api/order/${orderId}`);
export const updateOrderStatus = ({ orderId, orderStatus }) =>
  axiosWrapper.put(`/api/order/${orderId}`, { orderStatus });
export const fixOrdersStatus = () => axiosWrapper.post("/api/order/fix-status");

// Menu Item Endpoints
export const getMenuItems = () => axiosWrapper.get("/api/menu-items");
export const getMenuItemsByCategory = (category) => axiosWrapper.get(`/api/menu-items/category/${category}`);
export const createMenuItem = (data) => axiosWrapper.post("/api/menu-items", data);
export const updateMenuItem = ({ id, ...data }) => axiosWrapper.put(`/api/menu-items/${id}`, data);
export const deleteMenuItem = (id) => axiosWrapper.delete(`/api/menu-items/${id}`);
export const deployMenuItems = (data) => axiosWrapper.post("/api/menu-items/deploy/add", data);
export const replaceMenuItems = (data) => axiosWrapper.post("/api/menu-items/deploy/replace", data);
