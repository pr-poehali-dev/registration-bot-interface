import { useState, useEffect } from "react";
import AuthScreen from "@/components/chat/AuthScreen";
import AppScreen from "@/components/chat/AppScreen";
import { Screen, Theme, getStoredUser, saveStoredUser, clearSession, apiMe, getToken } from "@/lib/chat-types";

export default function Index() {
  const [screen, setScreen] = useState<Screen>("auth");
  const [user, setUser] = useState<{ id: number; nick: string; name: string } | null>(null);
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("vc_theme") as Theme) || "dark");

  // Проверяем сессию при загрузке
  useEffect(() => {
    const stored = getStoredUser();
    const token = getToken();
    if (stored && token) {
      // Быстро показываем приложение из кэша, потом верифицируем токен
      setUser(stored);
      setScreen("app");
      apiMe(token).then((data) => {
        if (data.error) { clearSession(); setScreen("auth"); setUser(null); }
        else { saveStoredUser(data.user); setUser(data.user); }
      });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("vc_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.background = theme === "dark" ? "#0d0d1a" : "#f0f2f8";
  }, [theme]);

  const handleLogin = (u: { id: number; nick: string; name: string }) => {
    setUser(u);
    setScreen("app");
  };

  const handleLogout = () => {
    clearSession();
    setUser(null);
    setScreen("auth");
  };

  const toggleTheme = () => setTheme((t) => t === "dark" ? "light" : "dark");

  if (screen === "auth" || !user) return <AuthScreen onLogin={handleLogin} theme={theme} />;
  return (
    <AppScreen
      user={user}
      theme={theme}
      onThemeToggle={toggleTheme}
      onLogout={handleLogout}
    />
  );
}
