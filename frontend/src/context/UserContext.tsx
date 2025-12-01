import React, { createContext, useContext, useEffect, useState } from "react";

export type User = {
  id: number;
  username: string;
  role: "user" | "admin";
  is_active: boolean;
  created_at: string;

  // Profile fields
  display_name?: string | null;
  job_title?: string | null;
  team_name?: string | null;
  rank?: string | null;
  skills?: string | null;
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
        // backend may return the user object directly or wrapped as { user }
        const returnedUser = (data && (data.user ?? data)) as unknown as User;
        setUser(returnedUser);
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
      // Support multiple response shapes: { user, access_token } or { access_token, ...userProps }
      const returnedUser = (data && (data.user ?? data)) as unknown as User;
      // Access token keys vary by backend; prefer common keys
      const accessToken = (data && (data.access_token ?? data.accessToken ?? data.token)) as string | undefined | null;

      setUser(returnedUser);
      if (accessToken) {
        setToken(accessToken);
        window.localStorage.setItem(LOCAL_TOKEN_KEY, accessToken);
      }
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
