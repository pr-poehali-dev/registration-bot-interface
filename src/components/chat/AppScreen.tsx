import { useState, useEffect } from "react";
import Icon from "@/components/ui/icon";
import ChatView from "@/components/chat/ChatView";
import { Avatar } from "@/components/chat/ChatView";
import {
  Tab, Theme, Chat, Message,
  getToken, nameToAvatar,
  apiGetChats, apiBotHistory, apiChatHistory,
  apiBotSend, apiChatSend,
  apiSearchByPhone,
} from "@/lib/chat-types";

const BOT_CHAT: Chat = {
  id: -1, partner_id: 0,
  name: "Веселушка 🤖", nick: "veselushka", avatar: "ВС",
  lastMsg: "Привет! Напиши мне что-нибудь 😊",
  time: "", unread: 0, online: true, isBot: true,
};

export default function AppScreen({ user, theme, onThemeToggle, onLogout }: {
  user: { id: number; nick: string; name: string };
  theme: Theme; onThemeToggle: () => void; onLogout: () => void;
}) {
  const [tab, setTab] = useState<Tab>("chats");
  const [activeChat, setActiveChat] = useState<Chat | null>(null);
  const [chats, setChats] = useState<Chat[]>([BOT_CHAT]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [loadingMsgs, setLoadingMsgs] = useState(false);

  // Поиск по телефону
  const [phoneInput, setPhoneInput] = useState("");
  const [phoneResult, setPhoneResult] = useState<{ id: number; nick: string; name: string } | null>(null);
  const [phoneError, setPhoneError] = useState("");
  const [phoneSearching, setPhoneSearching] = useState(false);

  const isDark = theme === "dark";
  const isMobileChat = activeChat !== null;
  const token = getToken();

  // Загрузка списка чатов
  const loadChats = async () => {
    const data = await apiGetChats(token);
    if (data.chats) {
      const real: Chat[] = data.chats.map((c: { chat_id: number; partner_id: number; nick: string; name: string; last_msg: string; last_time: string }) => ({
        id: c.chat_id,
        partner_id: c.partner_id,
        name: c.name,
        nick: c.nick,
        avatar: nameToAvatar(c.name),
        lastMsg: c.last_msg,
        time: c.last_time,
        unread: 0,
        online: false,
      }));
      setChats([BOT_CHAT, ...real]);
    }
  };

  useEffect(() => { loadChats(); }, []);

  // Открыть чат
  const openChat = async (chat: Chat) => {
    setActiveChat(chat);
    setMessages([]);
    setLoadingMsgs(true);
    if (chat.isBot) {
      const data = await apiBotHistory(token);
      setMessages(data.messages || []);
    } else {
      const data = await apiChatHistory(token, chat.partner_id);
      setMessages(data.messages || []);
    }
    setLoadingMsgs(false);
  };

  // Отправить сообщение
  const handleSend = async (text: string) => {
    if (!activeChat) return;
    const tempMsg: Message = { id: Date.now(), text, from: "me", time: new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, tempMsg]);

    if (activeChat.isBot) {
      setIsTyping(true);
      const data = await apiBotSend(token, text);
      setIsTyping(false);
      if (data.botMsg) {
        setMessages((prev) => [
          ...prev.filter((m) => m.id !== tempMsg.id),
          { ...data.userMsg },
          { ...data.botMsg },
        ]);
      }
    } else {
      const data = await apiChatSend(token, activeChat.partner_id, text);
      if (data.message) {
        setMessages((prev) => [...prev.filter((m) => m.id !== tempMsg.id), data.message]);
        setChats((prev) => prev.map((c) => c.id === activeChat.id ? { ...c, lastMsg: text, time: data.message.time } : c));
      }
    }
  };

  // Поиск по телефону и открытие чата
  const handlePhoneSearch = async () => {
    if (!phoneInput.trim()) { setPhoneError("Введи номер телефона"); return; }
    setPhoneError(""); setPhoneResult(null); setPhoneSearching(true);
    const data = await apiSearchByPhone(token, phoneInput.trim());
    setPhoneSearching(false);
    if (data.error) { setPhoneError(data.error); return; }
    setPhoneResult(data.user);
  };

  const openFoundUser = (foundUser: { id: number; nick: string; name: string }) => {
    const existing = chats.find((c) => c.partner_id === foundUser.id);
    if (existing) { openChat(existing); setTab("chats"); return; }
    const newChat: Chat = {
      id: -(foundUser.id),
      partner_id: foundUser.id,
      name: foundUser.name,
      nick: foundUser.nick,
      avatar: nameToAvatar(foundUser.name),
      lastMsg: "", time: "", unread: 0, online: false,
    };
    setChats((prev) => [...prev, newChat]);
    openChat(newChat);
    setTab("chats");
    setPhoneInput(""); setPhoneResult(null);
  };

  const NAV = [
    { id: "chats", icon: "MessageCircle", label: "Чаты", badge: 0 },
    { id: "contacts", icon: "UserPlus", label: "Добавить", badge: 0 },
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

  const inputStyle = {
    background: isDark ? "rgba(255,255,255,0.06)" : "rgba(0,0,0,0.04)",
    border: isDark ? "1px solid rgba(255,255,255,0.1)" : "1px solid rgba(0,0,0,0.1)",
    color: isDark ? "white" : "#1a1a2e", borderRadius: 12,
    fontFamily: "'Golos Text',sans-serif", padding: "10px 14px", fontSize: 14,
    outline: "none", width: "100%",
  };

  const SideContent = () => (
    <div className="flex-1 overflow-y-auto px-2 py-2">

      {/* ЧАТЫ */}
      {tab === "chats" && (
        <div className="space-y-1">
          <div className="px-2 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: textSection }}>Диалоги</div>
          {chats.map((chat) => (
            <button key={chat.id} onClick={() => openChat(chat)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${activeChat?.id === chat.id ? activeBg : hoverBg}`}>
              <Avatar text={chat.avatar} color={chat.isBot ? "linear-gradient(135deg,#f97316,#ec4899)" : undefined}
                size={42} online={chat.online} sidebarBg={sidebarBg} />
              <div className="flex-1 min-w-0 text-left">
                <div className="flex items-center justify-between">
                  <span className={`text-sm font-medium truncate ${textPrimary}`}>{chat.name}</span>
                  <span className="text-xs flex-shrink-0 ml-1" style={{ color: textMuted }}>{chat.time}</span>
                </div>
                <div className="flex items-center justify-between mt-0.5">
                  <span className="text-xs truncate" style={{ color: textMuted }}>{chat.lastMsg || "Нет сообщений"}</span>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* ДОБАВИТЬ КОНТАКТ */}
      {tab === "contacts" && (
        <div className="px-2 py-4 space-y-4 animate-fade-in">
          <div className="px-0 py-1 text-xs font-semibold uppercase tracking-wider" style={{ color: textSection }}>Найти человека</div>
          <p className="text-xs leading-relaxed" style={{ color: textMuted }}>
            Введи номер телефона — найдём пользователя VibeChat
          </p>
          <div>
            <label className="text-xs mb-1.5 block font-medium" style={{ color: textMuted }}>Номер телефона</label>
            <input style={inputStyle} placeholder="+7 999 123-45-67" value={phoneInput} type="tel"
              onChange={(e) => { setPhoneInput(e.target.value); setPhoneError(""); setPhoneResult(null); }}
              onKeyDown={(e) => e.key === "Enter" && handlePhoneSearch()} />
          </div>
          {phoneError && (
            <div className="text-xs py-2 px-3 rounded-xl"
              style={{ background: "rgba(239,68,68,0.12)", color: "#f87171", border: "1px solid rgba(239,68,68,0.25)" }}>
              {phoneError}
            </div>
          )}
          {phoneResult && (
            <div className="rounded-2xl p-4 animate-fade-in"
              style={{ background: isDark ? "rgba(168,85,247,0.1)" : "rgba(124,58,237,0.07)", border: "1px solid rgba(168,85,247,0.3)" }}>
              <div className="flex items-center gap-3 mb-3">
                <Avatar text={nameToAvatar(phoneResult.name)} size={44} sidebarBg={sidebarBg} />
                <div>
                  <div className={`font-semibold text-sm ${textPrimary}`}>{phoneResult.name}</div>
                  <div className="text-xs" style={{ color: "var(--neon-purple)" }}>@{phoneResult.nick}</div>
                </div>
              </div>
              <button onClick={() => openFoundUser(phoneResult)}
                className="w-full py-2 rounded-xl text-sm font-semibold text-white"
                style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)" }}>
                Написать сообщение →
              </button>
            </div>
          )}
          <button onClick={handlePhoneSearch} disabled={phoneSearching}
            className="btn-neon w-full py-2.5 rounded-xl text-sm font-semibold text-white">
            {phoneSearching ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                Ищем...
              </span>
            ) : "Найти 🔍"}
          </button>
        </div>
      )}

      {/* ПРОФИЛЬ */}
      {tab === "profile" && (
        <div className="px-2 py-4 space-y-4 animate-fade-in">
          <div className="flex flex-col items-center gap-3 py-4">
            <div className="w-20 h-20 rounded-3xl flex items-center justify-center font-black text-white animate-pulse-glow"
              style={{ background: "linear-gradient(135deg,#7c3aed,#ec4899)", fontSize: 28 }}>
              {nameToAvatar(user.name)}
            </div>
            <div className="text-center">
              <div className={`font-bold ${textPrimary}`}>{user.name}</div>
              <div className="text-sm" style={{ color: "var(--neon-purple)" }}>@{user.nick}</div>
            </div>
          </div>
          <div className="divider-glow" />
          {[
            { icon: "User", label: "Имя", value: user.name },
            { icon: "AtSign", label: "Ник", value: `@${user.nick}` },
            { icon: "Shield", label: "Статус", value: "В сети" },
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

        {/* Шапка */}
        <div className="flex items-center gap-3 px-4 py-4 flex-shrink-0" style={{ borderBottom: sidebarBorder }}>
          <div className="avatar-glow">
            <div className="avatar-glow-inner" style={{ background: sidebarBg }}>
              <div className="flex items-center justify-center rounded-full font-bold text-white"
                style={{ width: 40, height: 40, background: "linear-gradient(135deg,#7c3aed,#ec4899)", fontSize: 14 }}>
                {nameToAvatar(user.name)}
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <div className={`font-semibold text-sm truncate ${textPrimary}`}>{user.name}</div>
            <div className="text-xs" style={{ color: "var(--neon-purple)" }}>@{user.nick}</div>
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
            </button>
          ))}
        </nav>

        <div className="hidden sm:block divider-glow mx-4" />
        <SideContent />
      </div>

      {/* Область чата */}
      <div className={`relative z-10 flex-1 flex flex-col min-w-0 ${isMobileChat ? "flex" : "hidden sm:flex"}`}>
        {activeChat ? (
          <ChatView
            chat={activeChat}
            messages={messages}
            onSend={handleSend}
            isTyping={isTyping}
            loading={loadingMsgs}
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
              <p className="text-xs mt-1" style={{ color: isDark ? "rgba(255,255,255,0.2)" : "rgba(0,0,0,0.3)" }}>Или добавь человека по номеру телефона 📱</p>
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
              <Icon name={item.icon} size={22} />
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
