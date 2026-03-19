import { useState } from "react";
import Icon from "@/components/ui/icon";
import ChatView from "@/components/chat/ChatView";
import { Avatar } from "@/components/chat/ChatView";
import {
  Tab, Theme, Chat, Message,
  CONTACTS, getVeselushkaReply, nowTime,
} from "@/lib/chat-types";

export default function AppScreen({ userName, userNick, theme, onThemeToggle, onLogout }: {
  userName: string; userNick: string; theme: Theme; onThemeToggle: () => void; onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>("chats");
  const [activeChat, setActiveChat] = useState<number | null>(null);
  const [notifChats, setNotifChats] = useState(2);
  const [notifBots, setNotifBots] = useState(1);
  const [isTyping, setIsTyping] = useState(false);
  const isDark = theme === "dark";

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

      {/* Боковая панель */}
      <div className={`relative z-10 flex flex-col flex-shrink-0 sm:w-72 sm:flex ${isMobileChat ? "hidden sm:flex" : "flex w-full sm:w-72"}`}
        style={{ background: sidebarBg, borderRight: sidebarBorder }}>

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

        <SideContent />
      </div>

      {/* Область чата */}
      <div className={`relative z-10 flex-1 flex flex-col min-w-0 ${isMobileChat ? "flex" : "hidden sm:flex"}`}>
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

      {/* Мобильная нижняя навигация */}
      {!isMobileChat && (
        <nav className="sm:hidden fixed bottom-0 left-0 right-0 z-20 flex items-center px-2 py-2 pb-safe"
          style={{ background: isDark ? "rgba(10,10,20,0.95)" : "rgba(255,255,255,0.95)", borderTop: sidebarBorder, backdropFilter: "blur(20px)" }}>
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

      {!isMobileChat && <div className="sm:hidden h-16 flex-shrink-0" />}
    </div>
  );
}
