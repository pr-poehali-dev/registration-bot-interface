import { useState, useEffect } from "react";
import AuthScreen from "@/components/chat/AuthScreen";
import AppScreen from "@/components/chat/AppScreen";
import { Screen, Theme, getSession, setSession, clearSession } from "@/lib/chat-types";

export default function Index() {
  const [screen, setScreen] = useState<Screen>("auth");
  const [user, setUser] = useState({ nick: "", name: "" });
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("vc_theme") as Theme) || "dark");

  useEffect(() => {
    const session = getSession();
    if (session) { setUser(session); setScreen("app"); }
  }, []);

  useEffect(() => {
    localStorage.setItem("vc_theme", theme);
    document.documentElement.setAttribute("data-theme", theme);
    document.body.style.background = theme === "dark" ? "#0d0d1a" : "#f0f2f8";
  }, [theme]);

  const handleLogin = (nick: string, name: string) => {
    setSession(nick, name);
    setUser({ nick, name });
    setScreen("app");
  };

  const handleLogout = () => {
    clearSession();
    setUser({ nick: "", name: "" });
    setScreen("auth");
  };

  const toggleTheme = () => setTheme((t) => t === "dark" ? "light" : "dark");

  if (screen === "auth") return <AuthScreen onLogin={handleLogin} theme={theme} />;
  return (
    <AppScreen
      userName={user.name}
      userNick={user.nick}
      theme={theme}
      onThemeToggle={toggleTheme}
      onLogout={handleLogout}
    />
  );
}
