// frontend/src/context/UserContext.tsx
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import { api } from "../lib/backend";

// You can refine this type based on your backend user schema.
export type DevCellUser = {
  id?: number | string;
  username: string;
  display_name?: string | null;
  [key: string]: any;
};

type UserContextValue = {
  user: DevCellUser | null;
  token: string | null;
  loading: boolean;
  /** Derived flag for legacy code & UI: true when we have a token */
  isAuthenticated: boolean;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => void;
  setUserAndToken: (user: DevCellUser, token: string) => void;
};

const UserContext = createContext<UserContextValue | undefined>(undefined);

const TOKEN_KEY = "devcell_auth_token";
const USER_KEY = "devcell_auth_user";

export const UserProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<DevCellUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // --- Helpers to apply/clear session ---

  const applySession = useCallback((u: DevCellUser | null, t: string) => {
    setUser(u);
    setToken(t);

    try {
      localStorage.setItem(TOKEN_KEY, t);
      localStorage.setItem(USER_KEY, JSON.stringify(u));
    } catch (err) {
      console.warn("[DevCell] Failed to persist auth session", err);
    }
  }, []);

  const clearSession = useCallback(() => {
    setUser(null);
    setToken(null);
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (err) {
      console.warn("[DevCell] Failed to clear auth session", err);
    }
  }, []);

  // --- Fetch user from /auth/me with a given token ---

  const fetchUserWithToken = useCallback(
    async (t: string): Promise<DevCellUser | null> => {
      try {
        const res = await api("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${t}`,
          },
        });

        if (!res.ok) {
          return null;
        }

        const me = await res.json();
        if (!me) return null;

        // Ensure we at least have a username field
        if (!me.username && me.user_name) {
          me.username = me.user_name;
        }
        return me as DevCellUser;
      } catch (err) {
        console.error("[DevCell] /auth/me failed", err);
        return null;
      }
    },
    [],
  );

  // --- Login ---

  const login = useCallback(
    async (username: string, password: string): Promise<boolean> => {
      try {
        const res = await api("/api/auth/login", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ username, password }),
        });

        if (!res.ok) {
          // Let the caller show a generic "invalid credentials" message.
          return false;
        }

        // Typical FastAPI JWT response: { access_token, token_type, ...maybe user... }
        const data = await res.json();

        const tokenFromLogin: string | undefined = data?.access_token;
        let userFromLogin: DevCellUser | null = (data?.user ||
          null) as DevCellUser | null;

        if (!tokenFromLogin) {
          console.error(
            "[DevCell] Login succeeded but no access_token in response",
            data,
          );
          return false;
        }

        // If backend didn't include user in login response, fetch it via /auth/me
        if (!userFromLogin) {
          userFromLogin = await fetchUserWithToken(tokenFromLogin);
        }

        // If we STILL don't have a user, create a minimal local user object
        if (!userFromLogin) {
          userFromLogin = {
            username,
            display_name: username,
          };
          console.warn(
            "[DevCell] Using minimal local user object after login (no user from backend)",
          );
        }

        applySession(userFromLogin, tokenFromLogin);
        return true;
      } catch (err) {
        console.error("[DevCell] Login failed", err);
        return false;
      }
    },
    [applySession, fetchUserWithToken],
  );

  // --- Refresh session from backend ("still logged in?") ---

  const refreshSession = useCallback(async () => {
    let storedToken: string | null = null;
    let storedUser: DevCellUser | null = null;

    try {
      storedToken = localStorage.getItem(TOKEN_KEY);
      const rawUser = localStorage.getItem(USER_KEY);
      if (rawUser) {
        storedUser = JSON.parse(rawUser) as DevCellUser | null;
      }
    } catch {
      storedToken = null;
      storedUser = null;
    }

    if (!storedToken) {
      setLoading(false);
      return;
    }

    // First try to get a fresh user from the backend
    try {
      const userFromMe = await fetchUserWithToken(storedToken);
      if (userFromMe) {
        applySession(userFromMe, storedToken);
        setLoading(false);
        return;
      }
    } catch (err) {
      console.error("[DevCell] Failed to refresh session via backend", err);
    }

    // If backend-based refresh failed, but we have a stored user, use that.
    if (storedUser) {
      console.warn(
        "[DevCell] Falling back to stored user for session refresh (no /auth/me)",
      );
      applySession(storedUser, storedToken);
      setLoading(false);
      return;
    }

    // No user, no usable token -> clear session
    clearSession();
    setLoading(false);
  }, [applySession, clearSession, fetchUserWithToken]);

  // --- Logout ---

  const logout = useCallback(() => {
    // Optionally you could call /api/auth/logout here if backend provides it.
    clearSession();
  }, [clearSession]);

  // --- Allow other code (like RegisterPage) to set user+token directly ---

  const setUserAndToken = useCallback(
    (u: DevCellUser, t: string) => {
      applySession(u, t);
    },
    [applySession],
  );

  // --- Initial session check on app mount ---

  useEffect(() => {
    refreshSession();
  }, [refreshSession]);

  // Derived auth flag for any component that still expects isAuthenticated
  const isAuthenticated = Boolean(token);

  const value: UserContextValue = {
    user,
    token,
    loading,
    isAuthenticated,
    login,
    logout,
    setUserAndToken,
  };

  return (
    <UserContext.Provider value={value}>
      {loading ? (
        <div
          style={{
            minHeight: "100vh",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: "var(--dc-font-size-sm)",
            color: "var(--dc-text-muted)",
          }}
        >
          Checking your DevCell session...
        </div>
      ) : (
        children
      )}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextValue => {
  const ctx = useContext(UserContext);
  if (!ctx) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return ctx;
};
