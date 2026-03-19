// ===== ТИПЫ =====
export type Screen = "auth" | "app";
export type AuthMode = "login" | "register";
export type Tab = "chats" | "contacts" | "bots" | "profile" | "settings";
export type Theme = "dark" | "light";

export interface Message {
  id: number;
  text: string;
  from: "me" | "other" | "bot";
  time: string;
}

export interface Chat {
  id: number;
  name: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  isBot?: boolean;
}

export interface StoredUser {
  nick: string;
  name: string;
  password: string;
}

// ===== КОНСТАНТЫ =====
export const CONTACTS = [
  { id: 1, name: "Алина Морозова", avatar: "АМ", status: "В сети", color: "#a855f7" },
  { id: 2, name: "Дмитрий Ковалёв", avatar: "ДК", status: "30 мин назад", color: "#3b82f6" },
  { id: 3, name: "Катя Белова", avatar: "КБ", status: "В сети", color: "#ec4899" },
  { id: 4, name: "Макс Орлов", avatar: "МО", status: "Вчера", color: "#f97316" },
  { id: 5, name: "Соня Лебедева", avatar: "СЛ", status: "В сети", color: "#06b6d4" },
];

export const VESELUSHKA_REPLIES: Record<string, string> = {
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

export const EMOJIS = [
  "😊", "😢", "😂", "❤️", "👍", "🔥", "😍", "🥺",
  "😎", "🤔", "😅", "🎉", "🙏", "💪", "✨", "😘",
  "🤣", "😱", "👏", "💯", "🥰", "😏", "🤗", "😭",
];

// ===== УТИЛИТЫ =====
export function getVeselushkaReply(text: string): string {
  const lower = text.toLowerCase().trim();
  for (const key in VESELUSHKA_REPLIES) {
    if (lower.includes(key)) return VESELUSHKA_REPLIES[key];
  }
  return "Интересно! 😊 Напиши «анекдот» — расскажу смешное, или «что умеешь» — покажу возможности!";
}

export function nowTime() {
  return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

// ===== ХРАНИЛИЩЕ =====
export function getUsers(): StoredUser[] {
  try { return JSON.parse(localStorage.getItem("vc_users") || "[]"); } catch { return []; }
}

export function saveUser(user: StoredUser) {
  const users = getUsers(); users.push(user);
  localStorage.setItem("vc_users", JSON.stringify(users));
}

export function findUser(nick: string, password: string): StoredUser | null {
  return getUsers().find((u) => u.nick.toLowerCase() === nick.toLowerCase() && u.password === password) || null;
}

export function getSession(): { nick: string; name: string } | null {
  try { return JSON.parse(localStorage.getItem("vc_session") || "null"); } catch { return null; }
}

export function setSession(nick: string, name: string) {
  localStorage.setItem("vc_session", JSON.stringify({ nick, name }));
}

export function clearSession() {
  localStorage.removeItem("vc_session");
}
