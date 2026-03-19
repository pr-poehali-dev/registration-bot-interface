import { useState } from "react";
import { AuthMode, Theme, apiRegister, apiLogin, saveToken, saveStoredUser } from "@/lib/chat-types";

function Particles({ theme }: { theme: Theme }) {
  return (
    <div className="bg-particles">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="particle" style={{
          width: `${120 + i * 40}px`, height: `${120 + i * 40}px`,
          left: `${(i * 17) % 100}%`, top: `${(i * 23) % 100}%`,
          animationDuration: `${5 + i * 1.5}s`, animationDelay: `${i * 0.8}s`,
          background: i % 2 === 0 ? "var(--neon-purple)" : "var(--neon-pink)",
          opacity: theme === "light" ? 0.03 : 0.05, filter: "blur(60px)",
        }} />
      ))}
    </div>
  );
}

export default function AuthScreen({ onLogin, theme }: {
  onLogin: (user: { id: number; nick: string; name: string }) => void;
  theme: Theme;
}) {
  const [mode, setMode] = useState<AuthMode>("register");
  const [nick, setNick] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isDark = theme === "dark";

  const handleSubmit = async () => {
    setError("");
    if (mode === "register") {
      if (!nick.trim() || !name.trim() || !password.trim()) { setError("Заполни все поля!"); return; }
      if (nick.length < 3) { setError("Ник минимум 3 символа"); return; }
      if (password.length < 4) { setError("Пароль минимум 4 символа"); return; }
      setLoading(true);
      const data = await apiRegister(nick.trim(), name.trim(), password, phone.trim() || undefined);
      setLoading(false);
      if (data.error) { setError(data.error); return; }
      saveToken(data.token);
      saveStoredUser(data.user);
      onLogin(data.user);
    } else {
      if (!nick.trim() || !password.trim()) { setError("Введи ник и пароль!"); return; }
      setLoading(true);
      const data = await apiLogin(nick.trim(), password);
      setLoading(false);
      if (data.error) { setError(data.error); return; }
      saveToken(data.token);
      saveStoredUser(data.user);
      onLogin(data.user);
    }
  };

  const inputStyle = {
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
    color: isDark ? "white" : "#1a1a2e", borderRadius: 12,
    fontFamily: "'Golos Text',sans-serif", width: "100%", padding: "12px 16px", fontSize: 14,
    outline: "none", transition: "all 0.3s ease",
  };

  const labelStyle = { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)" };

  return (
    <div className="fixed inset-0 flex items-center justify-center px-4" style={{ background: "var(--chat-bg)" }}>
      <Particles theme={theme} />
      <div className="relative z-10 w-full max-w-md">
        <div className="text-center mb-8 animate-fade-in">
          <div className="inline-flex items-center justify-center w-16 h-16 sm:w-20 sm:h-20 rounded-3xl mb-3 animate-float"
            style={{ background: "linear-gradient(135deg, #7c3aed, #ec4899)" }}>
            <span className="text-3xl sm:text-4xl">💬</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-black gradient-text font-golos">VibeChat</h1>
          <p className="text-sm mt-1" style={{ color: isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.4)" }}>Мессенджер нового поколения</p>
        </div>

        <div className={isDark ? "glass rounded-3xl p-6 sm:p-8 animate-scale-in" : "glass-light rounded-3xl p-6 sm:p-8 animate-scale-in"}>
          <div className="flex rounded-2xl p-1 mb-5" style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
            {(["register", "login"] as AuthMode[]).map((m) => (
              <button key={m} onClick={() => { setMode(m); setError(""); }}
                className="flex-1 py-2.5 rounded-xl text-sm font-semibold transition-all duration-300"
                style={mode === m ? { background: "linear-gradient(135deg,#7c3aed,#ec4899)", color: "white" }
                  : { color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }}>
                {m === "register" ? "Регистрация" : "Войти"}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={labelStyle}>Ник (логин)</label>
              <input style={inputStyle} placeholder="@твой_ник" value={nick}
                onChange={(e) => setNick(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
            </div>
            {mode === "register" && (
              <>
                <div className="animate-fade-in">
                  <label className="text-xs mb-1.5 block font-medium" style={labelStyle}>Твоё имя</label>
                  <input style={inputStyle} placeholder="Как тебя зовут?" value={name}
                    onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
                </div>
                <div className="animate-fade-in">
                  <label className="text-xs mb-1.5 block font-medium" style={labelStyle}>
                    Номер телефона <span style={{ color: isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.3)" }}>(необязательно — чтобы тебя нашли)</span>
                  </label>
                  <input style={inputStyle} placeholder="+7 999 123-45-67" value={phone} type="tel"
                    onChange={(e) => setPhone(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
                </div>
              </>
            )}
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={labelStyle}>Пароль</label>
              <input style={inputStyle} type="password" placeholder="••••••••" value={password}
                onChange={(e) => setPassword(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
            </div>
            {error && (
              <div className="text-sm text-center py-2 px-4 rounded-xl animate-fade-in"
                style={{ background: "rgba(239,68,68,0.15)", color: "#f87171", border: "1px solid rgba(239,68,68,0.3)" }}>
                {error}
              </div>
            )}
            <button onClick={handleSubmit} disabled={loading} className="btn-neon w-full py-3.5 rounded-2xl font-bold text-white text-base mt-2">
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                  {mode === "register" ? "Регистрируемся..." : "Входим..."}
                </span>
              ) : (mode === "register" ? "Зарегистрироваться 🚀" : "Войти ✨")}
            </button>
          </div>
        </div>

        <p className="text-center text-xs mt-5" style={{ color: isDark ? "rgba(255,255,255,0.15)" : "rgba(0,0,0,0.25)" }}>
          VibeChat © 2026 · Версия 2.0
        </p>
      </div>
    </div>
  );
}
