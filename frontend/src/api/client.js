import axios from "axios";

// Through Nginx the API is reachable at /api on the same origin.
// Override with VITE_API_BASE_URL for local non-docker dev if needed.
const baseURL = import.meta.env.VITE_API_BASE_URL || "/api";

const api = axios.create({ baseURL });

let accessToken = null;
export function setAccessToken(token) {
  accessToken = token;
}
export function getRefreshToken() {
  return localStorage.getItem("refresh");
}
export function storeTokens({ access, refresh }) {
  accessToken = access || null;
  if (refresh) localStorage.setItem("refresh", refresh);
}
export function clearTokens() {
  accessToken = null;
  localStorage.removeItem("refresh");
}

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

// On 401, try a one-time refresh, then replay the request.
let refreshing = null;
api.interceptors.response.use(
  (resp) => resp,
  async (error) => {
    const original = error.config;
    if (error.response?.status === 401 && !original._retry && getRefreshToken()) {
      original._retry = true;
      try {
        if (!refreshing) {
          refreshing = axios
            .post(`${baseURL}/auth/refresh`, { refresh: getRefreshToken() })
            .finally(() => {
              refreshing = null;
            });
        }
        const { data } = await refreshing;
        accessToken = data.access;
        original.headers.Authorization = `Bearer ${data.access}`;
        return api(original);
      } catch (e) {
        clearTokens();
      }
    }
    return Promise.reject(error);
  }
);

export default api;
