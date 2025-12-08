// filename: frontend/src/context/UserContext.tsx
import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

import { BACKEND_BASE } from "../lib/backend";

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
  setUser: React.Dispatch<React.SetStateAction<User | null>>;
  setUserAndToken: (user: User, token: string) => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

const LOCAL_TOKEN_KEY = "devcell_token";

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [initialized, setInitialized] = useState(false);

  const setUserAndToken = (nextUser: User, nextToken: string) => {
    setUser(nextUser);
    setToken(nextToken);
    window.localStorage.setItem(LOCAL_TOKEN_KEY, nextToken);
  };

  useEffect(() => {
    const storedToken = window.localStorage.getItem(LOCAL_TOKEN_KEY);
    if (!storedToken) {
      setInitialized(true);
      return;
    }

    setToken(storedToken);

    fetch(`${BACKEND_BASE}/api/auth/me`, {
      headers: {
        Authorization: `Bearer ${storedToken}`,
      },
    })
      .then(async (res) => {
        if (!res.ok) {
          throw new Error("Failed to fetch current user");
        }
        const data = await res.json();
        const returnedUser = (data && (data.user ?? data)) as User;
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
      const returnedUser = (data && (data.user ?? data)) as User;
      const accessToken = (data &&
        (data.access_token ?? data.accessToken ?? data.token)) as
        | string
        | undefined
        | null;

      if (accessToken) {
        setUserAndToken(returnedUser, accessToken);
      } else {
        // Fallback: set user but no token (shouldn't normally happen)
        setUser(returnedUser);
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
    setUser,
    setUserAndToken,
  };

  if (!initialized) {
    // Optional: simple loading state
    return <div>Loading user...</div>;
  }

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

export const useUser = (): UserContextValue => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
};
