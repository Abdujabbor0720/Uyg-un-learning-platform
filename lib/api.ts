import axios from "axios";

// Force use of Vercel API routes
const api = axios.create({
  baseURL: "/api",
  withCredentials: true,
});

api.interceptors.request.use((config) => {
  if (config.data instanceof FormData) {
    config.headers["Content-Type"] = "multipart/form-data";
  } else {
    config.headers["Content-Type"] = "application/json";
  }

  // Add auth token to requests
  const token = localStorage.getItem("auth_token");
  if (token) {
    config.headers["Authorization"] = `Bearer ${token}`;
  }

  return config;
});

// Response interceptor - xatoliklarni jimgina qayta ishlash
api.interceptors.response.use(
  (response) => response,
  (error) => {
    // Xatolikni console'ga chiqarmasdan reject qilamiz
    // Faqat development mode'da console'ga yozamiz
    if (
      process.env.NODE_ENV === "development" &&
      error?.response?.status !== 401
    ) {
      // 401 xatoliklarni umumam ko'rsatmaymiz - bu normal holat (login qilmagan user)
      console.warn("API Error:", error?.response?.status, error?.config?.url);
    }
    return Promise.reject(error);
  }
);

export default api;
