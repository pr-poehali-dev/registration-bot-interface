import { useState, useEffect, useRef } from "react";
import Icon from "@/components/ui/icon";
import { Chat, Message, Theme, EMOJIS } from "@/lib/chat-types";

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

export { Avatar };

export default function ChatView({ chat, messages, onSend, isTyping, theme, onBack }: {
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
