import axios from "axios";

const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || "http://localhost:8000",
  withCredentials: true, // send cookies with every request if needed
  headers: {
    "Content-Type": "application/json",
  },
});

// Optional: Interceptors for token refresh, error handling
axiosInstance.interceptors.response.use(
  response => response,
  error => {
    // handle 401, 500 errors globally
    return Promise.reject(error);
  }
);

export default axiosInstance;