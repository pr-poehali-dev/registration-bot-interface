import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";

// ===== ТИПЫ =====
type Screen = "auth" | "app";
type AuthMode = "login" | "register";
type Tab = "chats" | "contacts" | "bots" | "profile" | "settings";
type Theme = "dark" | "light";

interface Message {
  id: number;
  text: string;
  from: "me" | "other" | "bot";
  time: string;
}

interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  isBot?: boolean;
}

// ===== ДАННЫЕ =====
const CONTACTS = [
  { id: 1, name: "Алина Морозова", avatar: "АМ", status: "В сети", color: "#a855f7" },
  { id: 2, name: "Дмитрий Ковалёв", avatar: "ДК", status: "30 мин назад", color: "#3b82f6" },
  { id: 3, name: "Катя Белова", avatar: "КБ", status: "В сети", color: "#ec4899" },
  { id: 4, name: "Макс Орлов", avatar: "МО", status: "Вчера", color: "#f97316" },
  { id: 5, name: "Соня Лебедева", avatar: "СЛ", status: "В сети", color: "#06b6d4" },
];

const VESELUSHKA_REPLIES: Record<string, string> = {
  "привет": "Привет-привет! 👋 Какие дела?",
  "как дела": "Отлично! Я бот, у меня всегда хорошее настроение 😄 А у тебя как?",
  "ты кто": "Я бот Веселушка! 🤖 Помогаю сделать общение ярче и веселее в этом мессенджере!",
  "что умеешь": "Я умею общаться, поднимать настроение и быть рядом, когда скучно! 🎉",
  "анекдот": "Почему программисты путают Halloween и Christmas? Потому что Oct 31 == Dec 25! 😂",
  "как тебя зовут": "Меня зовут Веселушка! Твой верный бот-друг 🌟",
  "пока": "Пока-пока! Буду скучать! 👋😊",
  "хорошо": "Вот и отлично! 🌈 Хорошее настроение — это главное!",
  "плохо": "Не грусти! Я рядом 🫂 Напиши анекдот — подниму настроение!",
};

const EMOJIS = [
  "😊", "😢", "😂", "❤️", "👍", "🔥", "😍", "🥺",
  "😎", "🤔", "😅", "🎉", "🙏", "💪", "✨", "😘",
  "🤣", "😱", "👏", "💯", "🥰", "😏", "🤗", "😭",
];

function getVeselushkaReply(text: string): string {
  const lower = text.toLowerCase().trim();
  for (const key in VESELUSHKA_REPLIES) {
    if (lower.includes(key)) return VESELUSHKA_REPLIES[key];
  }
  return "Интересно! 😊 Напиши «анекдот» — расскажу смешное, или «что умеешь» — покажу возможности!";
}

function nowTime() {
  return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

// ===== ХРАНИЛИЩЕ =====
interface StoredUser { nick: string; name: string; password: string; }

function getUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem("vc_users") || "[]"); } catch { return []; }
}
function saveUser(user: StoredUser) {
  const users = getUsers(); users.push(user);
  localStorage.setItem("vc_users", JSON.stringify(users));
}
function findUser(nick: string, password: string): StoredUser | null {
  return getUsers().find((u) => u.nick.toLowerCase() === nick.toLowerCase() && u.password === password) || null;
}
function getSession(): { nick: string; name: string } | null {
  try { return JSON.parse(localStorage.getItem("vc_session") || "null"); } catch { return null; }
}
function setSession(nick: string, name: string) {
  localStorage.setItem("vc_session", JSON.stringify({ nick, name }));
}
function clearSession() { localStorage.removeItem("vc_session"); }

// ===== ЧАСТИЦЫ =====
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

// ===== АВТОРИЗАЦИЯ =====
function AuthScreen({ onLogin, theme }: { onLogin: (nick: string, name: string) => void; theme: Theme }) {
  const [mode, setMode] = useState<AuthMode>("register");
  const [nick, setNick] = useState("");
  const [name, setName] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const isDark = theme === "dark";

  const handleSubmit = () => {
    if (mode === "register") {
      if (!nick.trim() || !name.trim() || !password.trim()) { setError("Заполни все поля!"); return; }
      if (nick.length < 3) { setError("Ник минимум 3 символа"); return; }
      if (password.length < 4) { setError("Пароль минимум 4 символа"); return; }
      if (getUsers().find((u) => u.nick.toLowerCase() === nick.toLowerCase())) { setError("Такой ник уже занят!"); return; }
      setError(""); setLoading(true);
      setTimeout(() => {
        saveUser({ nick: nick.trim(), name: name.trim(), password });
        setSession(nick.trim(), name.trim());
        setLoading(false); onLogin(nick.trim(), name.trim());
      }, 1000);
    } else {
      if (!nick.trim() || !password.trim()) { setError("Введи ник и пароль!"); return; }
      const found = findUser(nick.trim(), password);
      if (!found) { setError("Неверный ник или пароль!"); return; }
      setError(""); setLoading(true);
      setTimeout(() => { setSession(found.nick, found.name); setLoading(false); onLogin(found.nick, found.name); }, 900);
    }
  };

  const inputStyle = {
    background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.04)",
    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
    color: isDark ? "white" : "#1a1a2e", borderRadius: 12,
    fontFamily: "'Golos Text',sans-serif", width: "100%", padding: "12px 16px", fontSize: 14,
    outline: "none", transition: "all 0.3s ease",
  };

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
              <label className="text-xs mb-1.5 block font-medium" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)" }}>Ник (логин)</label>
              <input style={inputStyle} placeholder="@твой_ник" value={nick}
                onChange={(e) => setNick(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
            </div>
            {mode === "register" && (
              <div className="animate-fade-in">
                <label className="text-xs mb-1.5 block font-medium" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)" }}>Твоё имя</label>
                <input style={inputStyle} placeholder="Как тебя зовут?" value={name}
                  onChange={(e) => setName(e.target.value)} onKeyDown={(e) => e.key === "Enter" && handleSubmit()} />
              </div>
            )}
            <div>
              <label className="text-xs mb-1.5 block font-medium" style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.5)" }}>Пароль</label>
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
          VibeChat © 2024 · Версия 1.0
        </p>
      </div>
    </div>
  );
}

// ===== АВАТАР =====
function Avatar({ text, color, size = 40, online, sidebarBg }: {
  text: string; color?: string; size?: number; online?: boolean; sidebarBg?: string;
}) {
  return (
    <div className="relative flex-shrink-0">
      <div className="flex items-center justify-center rounded-full font-bold text-white"
        style={{ width: size, height: size, background: color || "linear-gradient(135deg,#7c3aed,#ec4899)", fontSize: size * 0.3 }}>
        {text}
      </div>
      {online !== undefined && (
        <div className="absolute bottom-0 right-0 rounded-full border-2"
          style={{ width: size * 0.28, height: size * 0.28, background: online ? "#22c55e" : "#6b7280", borderColor: sidebarBg || "var(--sidebar-bg)" }} />
      )}
    </div>
  );
}

// ===== ЧАТ =====
function ChatView({ chat, messages, onSend, isTyping, theme, onBack }: {
  chat: Chat; messages: Message[]; onSend: (text: string) => void;
  isTyping: boolean; theme: Theme; onBack?: () => void;
}) {
  const [input, setInput] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);
  const isDark = theme === "dark";

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isTyping]);

  const send = () => {
    if (!input.trim()) return;
    onSend(input.trim()); setInput(""); setShowEmoji(false);
  };

  const headerBg = isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.9)";
  const headerBorder = isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.08)";
  const chatAreaBg = isDark ? "var(--chat-bg)" : "#f0f2f8";
  const inputAreaBg = isDark ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.9)";
  const headerTextColor = isDark ? "text-white" : "text-gray-800";
  const timeColor = isDark ? "rgba(255,255,255,0.25)" : "rgba(0,0,0,0.35)";
  const onlineColor = isDark ? (chat.online ? "#22c55e" : "rgba(255,255,255,0.35)") : (chat.online ? "#16a34a" : "rgba(0,0,0,0.35)");

  return (
    <div className="flex flex-col h-full">
      {/* Хедер */}
      <div className="flex items-center gap-2 px-3 sm:px-4 py-3 flex-shrink-0"
        style={{ background: headerBg, borderBottom: headerBorder, backdropFilter: "blur(20px)" }}>
        {/* Кнопка назад (мобилка) */}
        {onBack && (
          <button onClick={onBack}
            className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 sm:hidden transition-all active:scale-95"
            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)" }}>
            <Icon name="ArrowLeft" size={18} className={isDark ? "text-white/80" : "text-gray-600"} />
          </button>
        )}
        <Avatar text={chat.avatar} color={chat.isBot ? "linear-gradient(135deg,#f97316,#ec4899)" : undefined} size={40} online={chat.online} />
        <div className="flex-1 min-w-0">
          <div className={`font-semibold text-sm truncate ${headerTextColor}`}>{chat.name}</div>
          <div className="text-xs" style={{ color: onlineColor }}>
            {isTyping ? <span style={{ color: "var(--neon-purple)" }}>печатает...</span>
              : chat.online ? "в сети" : "не в сети"}
          </div>
        </div>
        <div className="flex items-center gap-1">
          {[{ icon: "Phone" }, { icon: "Video" }].map((b) => (
            <button key={b.icon}
              className="w-9 h-9 rounded-full flex items-center justify-center transition-all hover:scale-110"
              style={{ background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
              <Icon name={b.icon} size={16} className={isDark ? "text-white/60" : "text-gray-500"} />
            </button>
          ))}
        </div>
      </div>

      {/* Сообщения */}
      <div className="flex-1 overflow-y-auto px-3 sm:px-4 py-4 space-y-2" style={{ background: chatAreaBg }}>
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.from === "me" ? "justify-end" : "justify-start"} animate-msg`}>
            <div className="max-w-[80%] sm:max-w-[75%]">
              <div className={`px-4 py-2.5 text-sm leading-relaxed ${msg.from === "me" ? "msg-bubble-out" : isDark ? "msg-bubble-in" : "msg-bubble-in-light"}`}>
                {msg.text}
              </div>
              <div className={`text-xs mt-1 ${msg.from === "me" ? "text-right" : "text-left"}`} style={{ color: timeColor }}>
                {msg.time}
              </div>
            </div>
          </div>
        ))}
        {isTyping && (
          <div className="flex justify-start animate-fade-in">
            <div className={`px-4 py-3 flex items-center gap-1.5 ${isDark ? "msg-bubble-in" : "msg-bubble-in-light"}`}>
              <div className="typing-dot" /><div className="typing-dot" /><div className="typing-dot" />
            </div>
          </div>
        )}
        <div ref={endRef} />
      </div>

      {/* Панель смайликов */}
      {showEmoji && (
        <div className="flex-shrink-0 px-3 py-2 animate-fade-in"
          style={{ background: isDark ? "rgba(0,0,0,0.5)" : "rgba(255,255,255,0.95)", borderTop: headerBorder, backdropFilter: "blur(20px)" }}>
          <div className="flex flex-wrap gap-1">
            {EMOJIS.map((emoji) => (
              <button key={emoji} onClick={() => setInput((p) => p + emoji)}
                className="w-9 h-9 text-xl rounded-lg transition-all hover:scale-125 active:scale-95 flex items-center justify-center">
                {emoji}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Инпут */}
      <div className="px-3 sm:px-4 py-3 flex items-center gap-2 flex-shrink-0"
        style={{ background: inputAreaBg, borderTop: headerBorder, backdropFilter: "blur(20px)" }}>
        <button onClick={() => setShowEmoji((v) => !v)}
          className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 text-xl transition-all hover:scale-110 active:scale-95"
          style={{ background: showEmoji ? "linear-gradient(135deg,#7c3aed,#ec4899)" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
          😊
        </button>
        <input
          className={isDark ? "input-neon flex-1 px-4 py-2.5 text-sm" : "input-light flex-1 px-4 py-2.5 text-sm"}
          placeholder="Напиши сообщение..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && send()}
        />
        <button onClick={send}
          className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-110 active:scale-95"
          style={{ background: input.trim() ? "linear-gradient(135deg,#7c3aed,#ec4899)" : isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.06)" }}>
          <Icon name="Send" size={16} className={input.trim() ? "text-white" : isDark ? "text-white/40" : "text-gray-400"} />
        </button>
      </div>
    </div>
  );
}

// ===== ГЛАВНОЕ ПРИЛОЖЕНИЕ =====
function AppScreen({ userName, userNick, theme, onThemeToggle, onLogout }: {
  userName: string; userNick: string; theme: Theme; onThemeToggle: () => void; onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>("chats");
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [notifChats, setNotifChats] = useState(2);
  const [notifBots, setNotifBots] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const isDark = theme === "dark";

  // На мобилке: если открыт чат — скрываем панель
  const isMobileChat = activeChat !== null;

  const [chats, setChats] = useState<Chat[]>([
    { id: 1, name: "Алина Морозова", avatar: "АМ", lastMsg: "Привет! Как дела?", time: "14:32", unread: 2, online: true },
    { id: 2, name: "Дмитрий Ковалёв", avatar: "ДК", lastMsg: "Встреча в 18:00?", time: "13:15", unread: 0, online: false },
    { id: 3, name: "Катя Белова", avatar: "КБ", lastMsg: "Отправила фото 📸", time: "вчера", unread: 1, online: true },
    { id: 100, name: "Веселушка 🤖", avatar: "ВС", lastMsg: "Привет! Я жду тебя!", time: "сейчас", unread: 1, online: true, isBot: true },
  ]);

  const [allMessages, setAllMessages] = useState<Record<number, Message[]>>({
    1: [{ id: 1, text: "Привет! 👋", from: "other", time: "14:30" }, { id: 2, text: "Как дела?", from: "other", time: "14:32" }],
    2: [{ id: 1, text: "Встреча в 18:00?", from: "other", time: "13:15" }],
    3: [{ id: 1, text: "Смотри, какое фото!", from: "other", time: "вчера" }, { id: 2, text: "Отправила фото 📸", from: "other", time: "вчера" }],
    100: [{ id: 1, text: "Привет! Я бот Веселушка 🎉 Напиши мне «привет» или «ты кто»!", from: "bot", time: "сейчас" }],
  });

  const openChat = (id: number) => {
    setActiveChat(id);
    const hadUnread = chats.find((c) => c.id === id)?.unread ?? 0;
    setChats((prev) => prev.map((c) => c.id === id ? { ...c, unread: 0 } : c));
    if (hadUnread > 0) {
      if (id === 100) setNotifBots(0);
      else setNotifChats((n) => Math.max(0, n - 1));
    }
  };

  const handleSend = (text: string) => {
    if (!activeChat) return;
    const msg: Message = { id: Date.now(), text, from: "me", time: nowTime() };
    setAllMessages((prev) => ({ ...prev, [activeChat]: [...(prev[activeChat] || []), msg] }));
    if (activeChat === 100) {
      setIsTyping(true);
      setTimeout(() => {
        setIsTyping(false);
        const reply: Message = { id: Date.now() + 1, text: getVeselushkaReply(text), from: "bot", time: nowTime() };
        setAllMessages((prev) => ({ ...prev, 100: [...(prev[100] || []), reply] }));
        setChats((prev) => prev.map((c) => c.id === 100 ? { ...c, lastMsg: reply.text, time: "сейчас" } : c));
      }, 900 + Math.random() * 700);
    }
  };

  const activeChatData = chats.find((c) => c.id === activeChat);

  const NAV = [
    { id: "chats", icon: "MessageCircle", label: "Чаты", badge: notifChats },
    { id: "contacts", icon: "Users", label: "Контакты", badge: 0 },
    { id: "bots", icon: "Bot", label: "Боты", badge: notifBots },
    { id: "profile", icon: "User", label: "Профиль", badge: 0 },
    { id: "settings", icon: "Settings", label: "Настройки", badge: 0 },
  ] as const;

  const sidebarBg = isDark ? "var(--sidebar-bg)" : "#ffffff";
  const sidebarBorder = isDark ? "1px solid rgba(255,255,255,0.06)" : "1px solid rgba(0,0,0,0.08)";
  const textPrimary = isDark ? "text-white" : "text-gray-800";
  const textMuted = isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)";
  const textSection = isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)";
  const hoverBg = isDark ? "hover:bg-white/5" : "hover:bg-black/5";
  const activeBg = isDark ? "bg-white/10" : "bg-black/5";

  // Контент боковой панели
  const SideContent = () => (
    <div className="flex-1 overflow-y-auto px-2 py-2">
      {/* ЧАТЫ */}
      {tab === "chats" && (
        <div className="space-y-1">
          <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: textSection }}>Диалоги</div>
          {chats.map((chat) => (
            <button key={chat.id} onClick={() => openChat(chat.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${activeChat === chat.id ? activeBg : hoverBg}`}>
              <Avatar text={chat.avatar} color={chat.isBot ? "linear-gradient(135deg,#f97316,#ec4899)" : undefined}
                size={42} online={chat.online} sidebarBg={sidebarBg} />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium truncate ${textPrimary}`}>{chat.name}</span>
                  <span className="text-xs flex-shrink-0 ml-1" style={{ color: textMuted }}>{chat.time}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs truncate" style={{ color: textMuted }}>{chat.lastMsg}</span>
                  {chat.unread > 0 && (
                    <span className="notif-badge rounded-full w-5 h-5 text-xs flex items-center justify-center text-white font-bold flex-shrink-0 ml-1">
                      {chat.unread}
                    </span>
                  )}
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* КОНТАКТЫ */}
      {tab === "contacts" && (
        <div className="space-y-1 animate-fade-in">
          <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: textSection }}>Контакты</div>
          {CONTACTS.map((c) => (
            <div key={c.id} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl ${hoverBg} transition-all cursor-pointer`}>
              <Avatar text={c.avatar} color={c.color} size={42} online={c.status === "В сети"} sidebarBg={sidebarBg} />
              <div className="flex-1 min-w-0">
                <div className={`text-sm font-medium truncate ${textPrimary}`}>{c.name}</div>
                <div className="text-xs" style={{ color: c.status === "В сети" ? "#22c55e" : textMuted }}>{c.status}</div>
              </div>
              <button className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0"
                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                <Icon name="MessageCircle" size={13} className={isDark ? "text-white/40" : "text-gray-400"} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* БОТЫ */}
      {tab === "bots" && (
        <div className="space-y-2 py-1 animate-fade-in">
          <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: textSection }}>Боты</div>
          <div className="mx-1 rounded-2xl p-4 cursor-pointer transition-all hover:scale-[1.02]"
            style={{ background: "linear-gradient(135deg,rgba(249,115,22,0.15),rgba(236,72,153,0.15))", border: "1px solid rgba(249,115,22,0.3)" }}
            onClick={() => { openChat(100); setTab("chats"); }}>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl flex-shrink-0"
                style={{ background: "linear-gradient(135deg,#f97316,#ec4899)" }}>🤖</div>
              <div className="flex-1">
                <div className={`font-bold text-sm ${textPrimary}`}>Веселушка</div>
                <div className="text-xs" style={{ color: "#f97316" }}>● Активен сейчас</div>
              </div>
              {notifBots > 0 && (
                <span className="notif-badge rounded-full w-5 h-5 text-xs flex items-center justify-center text-white font-bold">{notifBots}</span>
              )}
            </div>
            <p className="text-xs leading-relaxed mb-3" style={{ color: isDark ? "rgba(255,255,255,0.5)" : "rgba(0,0,0,0.5)" }}>
              Дружелюбный бот! Напиши «привет» и он ответит 😊
            </p>
            <button className="w-full py-2 rounded-xl text-xs font-semibold text-white"
              style={{ background: "linear-gradient(135deg,#f97316,#ec4899)" }}>Открыть чат →</button>
          </div>
        </div>
      )}

      {/* ПРОФИЛЬ */}
      {tab === "profile" && (
        <div className="px-2 py-4 space-y-4 animate-fade-in">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-white animate-pulse-glow"
              style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)", fontSize: 28 }}>
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="text-center">
              <div className={`font-bold ${textPrimary}`}>{userName}</div>
              <div className="text-sm" style={{ color: "var(--neon-purple)" }}>@{userNick}</div>
            </div>
          </div>
          <div className="divider-glow" />
          {[
            { icon: "User", label: "Имя", value: userName },
            { icon: "AtSign", label: "Ник", value: `@${userNick}` },
            { icon: "Shield", label: "Статус", value: "В сети" },
            { icon: "Calendar", label: "В VibeChat с", value: "19 марта 2026" },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-3 px-2 py-2">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(168,85,247,0.15)" }}>
                <Icon name={item.icon} size={14} style={{ color: "var(--neon-purple)" }} />
              </div>
              <div>
                <div className="text-xs" style={{ color: textMuted }}>{item.label}</div>
                <div className={`text-sm ${textPrimary}`}>{item.value}</div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* НАСТРОЙКИ */}
      {tab === "settings" && (
        <div className="px-2 py-4 space-y-2 animate-fade-in">
          <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: textSection }}>Настройки</div>
          {/* Тема */}
          <div className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${hoverBg} transition-all`}>
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
              style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
              <span className="text-base">{isDark ? "🌙" : "☀️"}</span>
            </div>
            <div className="flex-1 text-left">
              <div className={`text-sm ${textPrimary}`}>Тема</div>
              <div className="text-xs" style={{ color: textMuted }}>{isDark ? "Тёмная" : "Светлая"}</div>
            </div>
            <button onClick={onThemeToggle}
              className="relative w-11 h-6 rounded-full transition-all duration-300 flex-shrink-0"
              style={{ background: isDark ? "linear-gradient(135deg,#7c3aed,#ec4899)" : "rgba(0,0,0,0.15)" }}>
              <div className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all duration-300"
                style={{ left: isDark ? "calc(100% - 22px)" : "2px" }} />
            </button>
          </div>
          {[
            { icon: "Bell", label: "Уведомления", desc: "Включены" },
            { icon: "Lock", label: "Конфиденциальность", desc: "Настройки" },
            { icon: "Volume2", label: "Звуки", desc: "Включены" },
            { icon: "HelpCircle", label: "Помощь", desc: "FAQ" },
          ].map((item) => (
            <button key={item.label} className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl ${hoverBg} transition-all text-left`}>
              <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: isDark ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.05)" }}>
                <Icon name={item.icon} size={14} style={{ color: isDark ? "rgba(255,255,255,0.4)" : "rgba(0,0,0,0.4)" }} />
              </div>
              <div className="flex-1">
                <div className={`text-sm ${textPrimary}`}>{item.label}</div>
                <div className="text-xs" style={{ color: textMuted }}>{item.desc}</div>
              </div>
              <Icon name="ChevronRight" size={14} style={{ color: textMuted }} />
            </button>
          ))}
          <button onClick={onLogout} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-red-500/10 transition-all text-left">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: "rgba(239,68,68,0.15)" }}>
              <Icon name="LogOut" size={14} style={{ color: "#ef4444" }} />
            </div>
            <div className="flex-1">
              <div className="text-sm text-red-400">Выйти</div>
            </div>
          </button>
        </div>
      )}
    </div>
  );

  return (
    <div className="fixed inset-0 flex flex-col sm:flex-row" style={{ background: "var(--chat-bg)", fontFamily: "'Golos Text',sans-serif" }}>
      <Particles theme={theme} />

      {/* ===== ДЕСКТОП: боковая панель (всегда видна) ===== */}
      {/* ===== МОБИЛКА: показываем только если нет активного чата ===== */}
      <div className={`relative z-10 flex flex-col flex-shrink-0
        sm:w-72 sm:flex
        ${isMobileChat ? "hidden sm:flex" : "flex w-full sm:w-72"}
      `} style={{ background: sidebarBg, borderRight: sidebarBorder }}>

        {/* Шапка профиля */}
        <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0" style={{ borderBottom: sidebarBorder }}>
          <div className="avatar-glow">
            <div className="avatar-glow-inner" style={{ background: sidebarBg }}>
              <div className="flex items-center justify-center rounded-full font-bold text-white"
                style={{ width: 40, height: 40, background: "linear-gradient(135deg,#7c3aed,#ec4899)", fontSize: 14 }}>
                {userName.slice(0, 2).toUpperCase()}
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-sm truncate ${textPrimary}`}>{userName}</div>
            <div className="text-xs" style={{ color: "var(--neon-purple)" }}>@{userNick}</div>
          </div>
          <button onClick={onThemeToggle}
            className="w-8 h-8 rounded-full flex items-center justify-center transition-all hover:scale-110"
            style={{ background: isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)" }}>
            <span className="text-base">{isDark ? "☀️" : "🌙"}</span>
          </button>
        </div>

        {/* Навигация — на десктопе вертикальная, на мобилке горизонтальная снизу */}
        {/* Десктоп навигация */}
        <nav className="hidden sm:block px-2 py-3 space-y-1 flex-shrink-0">
          {NAV.map((item) => (
            <button key={item.id}
              onClick={() => { setTab(item.id as Tab); setActiveChat(null); }}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 ${
                tab === item.id ? "nav-item-active" : `${isDark ? "text-white/40 hover:text-white/70" : "text-gray-500 hover:text-gray-700"} ${hoverBg}`
              }`}
              style={tab === item.id ? { color: isDark ? "white" : "#7c3aed" } : {}}>
              <Icon name={item.icon} size={18} />
              <span className="flex-1 text-left">{item.label}</span>
              {item.badge > 0 && (
                <span className="notif-badge rounded-full w-5 h-5 text-xs flex items-center justify-center text-white font-bold">{item.badge}</span>
              )}
            </button>
          ))}
        </nav>

        <div className="hidden sm:block divider-glow mx-4" />

        {/* Контент */}
        <SideContent />
      </div>

      {/* ===== ДЕСКТОП: область чата (всегда справа) ===== */}
      {/* ===== МОБИЛКА: показываем только если есть активный чат ===== */}
      <div className={`relative z-10 flex-1 flex flex-col min-w-0
        ${isMobileChat ? "flex" : "hidden sm:flex"}
      `}>
        {activeChat && activeChatData ? (
          <ChatView
            chat={activeChatData}
            messages={allMessages[activeChat] || []}
            onSend={handleSend}
            isTyping={isTyping}
            theme={theme}
            onBack={() => setActiveChat(null)}
          />
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 animate-fade-in">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl animate-float"
              style={{ background: "rgba(168,85,247,0.1)", border: "1px solid rgba(168,85,247,0.2)" }}>💬</div>
            <div className="text-center">
              <h2 className="text-2xl font-black gradient-text font-golos mb-2">VibeChat</h2>
              <p className="text-sm" style={{ color: isDark ? "rgba(255,255,255,0.3)" : "rgba(0,0,0,0.4)" }}>Выбери чат из списка</p>
              <p className="text-xs mt-1" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)" }}>Или пообщайся с ботом Веселушкой 🤖</p>
            </div>
          </div>
        )}
      </div>

      {/* ===== МОБИЛКА: нижняя навигация (только когда нет активного чата) ===== */}
      {!isMobileChat && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center px-2 py-2 pb-safe"
          style={{
            background: isDark ? "rgba(10,10,20,0.95)" : "rgba(255,255,255,0.95)",
            borderTop: sidebarBorder, backdropFilter: "blur(20px)",
          }}>
          {NAV.map((item) => (
            <button key={item.id}
              onClick={() => { setTab(item.id as Tab); setActiveChat(null); }}
              className="flex-1 flex flex-col items-center gap-1 py-2 px-1 rounded-xl transition-all relative"
              style={{ color: tab === item.id ? "var(--neon-purple)" : isDark ? "rgba(255,255,255,0.35)" : "rgba(0,0,0,0.35)" }}>
              <div className="relative">
                <Icon name={item.icon} size={22} />
                {item.badge > 0 && (
                  <span className="notif-badge absolute -top-1.5 -right-2 rounded-full w-4 h-4 text-[10px] flex items-center justify-center text-white font-bold">
                    {item.badge}
                  </span>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{item.label}</span>
              {tab === item.id && (
                <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-0.5 rounded-full"
                  style={{ background: "var(--neon-purple)" }} />
              )}
            </button>
          ))}
        </nav>
      )}

      {/* Отступ снизу на мобилке чтобы контент не перекрывался навигацией */}
      {!isMobileChat && <div className="sm:hidden h-16 flex-shrink-0" />}
    </div>
  );
}

// ===== КОРЕНЬ =====
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

  const handleLogin = (nick: string, name: string) => { setUser({ nick, name }); setScreen("app"); };
  const handleLogout = () => { clearSession(); setUser({ nick: "", name: "" }); setScreen("auth"); };
  const toggleTheme = () => setTheme((t) => t === "dark" ? "light" : "dark");

  if (screen === "auth") return <AuthScreen onLogin={handleLogin} theme={theme} />;
  return <AppScreen userName={user.name} userNick={user.nick} theme={theme} onThemeToggle={toggleTheme} onLogout={handleLogout} />;
}
