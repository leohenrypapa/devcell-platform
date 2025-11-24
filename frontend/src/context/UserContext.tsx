import React, { createContext, useContext, useEffect, useState } from "react";

export type User = {
  id: number;
  username: string;
  role: string;
  created_at: string;
};

type UserContextValue = {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

const LOCAL_TOKEN_KEY = "devcell_token";
const BACKEND_BASE = (import.meta as any).env.VITE_BACKEND_BASE_URL || "http://localhost:9000";

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const storedToken = window.localStorage.getItem(LOCAL_TOKEN_KEY);
    if (!storedToken) {
      setInitialized(true);
      return;
    }

    setToken(storedToken);
    // Try to fetch /auth/me
    fetch(`${BACKEND_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) throw new Error("Failed");
        const data = await res.json();
        setUser(data);
      })
      .catch(() => {
        setUser(null);
        setToken(null);
        window.localStorage.removeItem(LOCAL_TOKEN_KEY);
      })
      .finally(() => {
        setInitialized(true);
      });
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const res = await fetch(`${BACKEND_BASE}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (!res.ok) {
        return false;
      }
      const data = await res.json();
      setUser(data.user);
      setToken(data.access_token);
      window.localStorage.setItem(LOCAL_TOKEN_KEY, data.access_token);
      return true;
    } catch (e) {
      console.error(e);
      return false;
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    window.localStorage.removeItem(LOCAL_TOKEN_KEY);
  };

  const value: UserContextValue = {
    user,
    token,
    isAuthenticated: !!user && !!token,
    login,
    logout,
  };

  if (!initialized) {
    // Optional: simple loading state
    return <div>Loading user...</div>;
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextValue => {
  const ctx = useContext(UserContext);
  if (!ctx) throw new Error("useUser must be used within a UserProvider");
  return ctx;
};
