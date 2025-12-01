import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useCallback,
} from "react";

type Theme = "light" | "dark";

type ThemeContextValue = {
  theme: Theme;
  toggleTheme: () => void;
};

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

const LOCAL_THEME_KEY = "devcell_theme";

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [theme, setTheme] = useState<Theme>("light");

  // Init from localStorage or system preference
  useEffect(() => {
    try {
      const stored = window.localStorage.getItem(LOCAL_THEME_KEY) as
        | Theme
        | null;
      if (stored === "light" || stored === "dark") {
        setTheme(stored);
        return;
      }
      if (window.matchMedia?.("(prefers-color-scheme: dark)").matches) {
        setTheme("dark");
      }
    } catch {
      // ignore
    }
  }, []);

  // Persist + lightly style body/html
  useEffect(() => {
    try {
      window.localStorage.setItem(LOCAL_THEME_KEY, theme);
    } catch {
      // ignore
    }
    document.documentElement.dataset.theme = theme;
    document.body.style.backgroundColor =
      theme === "dark" ? "#020617" : "#f3f4f6";
    document.body.style.color = theme === "dark" ? "#e5e7eb" : "#111827";
  }, [theme]);

  const toggleTheme = useCallback(() => {
    setTheme((prev) => (prev === "light" ? "dark" : "light"));
  }, []);

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = (): ThemeContextValue => {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return ctx;
};
