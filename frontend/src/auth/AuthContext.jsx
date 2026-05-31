import { createContext, useContext, useEffect, useState, useCallback } from "react";
import api, { setAccessToken, storeTokens, clearTokens, getRefreshToken } from "../api/client.js";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadMe = useCallback(async () => {
    try {
      const { data } = await api.get("/me");
      setUser(data);
    } catch {
      setUser(null);
    }
  }, []);

  // On boot, if we have a refresh token, get a fresh access token then load /me.
  useEffect(() => {
    (async () => {
      const refresh = getRefreshToken();
      if (refresh) {
        try {
          const { data } = await api.post("/auth/refresh", { refresh });
          setAccessToken(data.access);
          await loadMe();
        } catch {
          clearTokens();
        }
      }
      setLoading(false);
    })();
  }, [loadMe]);

  const completeLogin = useCallback(
    async ({ access, refresh }) => {
      storeTokens({ access, refresh });
      await loadMe();
    },
    [loadMe]
  );

  const logout = useCallback(async () => {
    const refresh = getRefreshToken();
    try {
      if (refresh) await api.post("/auth/logout", { refresh });
    } catch {
      /* ignore */
    }
    clearTokens();
    setUser(null);
  }, []);

  const refreshUser = loadMe;

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, completeLogin, logout, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
