import axios from "axios";

/* Configuratie centrala pentru API.
   Cerinta template: SPA consuma REST API.
   Folosim VITE_API_URL ca sa mearga local si la deploy. */

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || "http://localhost:3000",
});

api.interceptors.request.use((config) => {
  // Cerinta: autentificare. Backend foloseste JWT.
  const token = localStorage.getItem("token");
  if (token) {
    config.headers.Authorization = "Bearer " + token;
  }
  return config;
});

export default api;
