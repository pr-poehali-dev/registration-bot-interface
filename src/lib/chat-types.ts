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
  partner_id: number;
  name: string;
  nick: string;
  avatar: string;
  lastMsg: string;
  time: string;
  unread: number;
  online: boolean;
  isBot?: boolean;
}

// ===== КОНСТАНТЫ =====
export const EMOJIS = [
  "😊", "😢", "😂", "❤️", "👍", "🔥", "😍", "🥺",
  "😎", "🤔", "😅", "🎉", "🙏", "💪", "✨", "😘",
  "🤣", "😱", "👏", "💯", "🥰", "😏", "🤗", "😭",
];

// ===== API URLs =====
const AUTH_URL = "https://functions.poehali.dev/8c526912-ae6f-4e2f-9cf3-c5a0ef311f73";
const MESSAGES_URL = "https://functions.poehali.dev/d4968893-eb2a-4491-9ba4-58edfd271760";
const CONTACTS_URL = "https://functions.poehali.dev/ae667d64-11b5-45de-851b-5f06e6533dca";

// ===== СЕССИЯ =====
export function getToken(): string {
  return localStorage.getItem("vc_token") || "";
}
export function saveToken(token: string) {
  localStorage.setItem("vc_token", token);
}
export function getStoredUser(): { id: number; nick: string; name: string } | null {
  try { return JSON.parse(localStorage.getItem("vc_user") || "null"); } catch { return null; }
}
export function saveStoredUser(user: { id: number; nick: string; name: string }) {
  localStorage.setItem("vc_user", JSON.stringify(user));
}
export function clearSession() {
  localStorage.removeItem("vc_token");
  localStorage.removeItem("vc_user");
}

// ===== API AUTH =====
export async function apiRegister(nick: string, name: string, password: string, phone?: string) {
  const res = await fetch(`${AUTH_URL}?action=register`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nick, name, password, phone }),
  });
  return res.json();
}

export async function apiLogin(nick: string, password: string) {
  const res = await fetch(`${AUTH_URL}?action=login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ nick, password }),
  });
  return res.json();
}

export async function apiMe(token: string) {
  const res = await fetch(`${AUTH_URL}?action=me`, {
    headers: { "X-Session-Token": token },
  });
  return res.json();
}

// ===== API MESSAGES =====
export async function apiBotHistory(token: string) {
  const res = await fetch(`${MESSAGES_URL}?action=bot`, {
    headers: { "X-Session-Token": token },
  });
  return res.json();
}

export async function apiBotSend(token: string, text: string) {
  const res = await fetch(`${MESSAGES_URL}?action=bot`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-Token": token },
    body: JSON.stringify({ text }),
  });
  return res.json();
}

export async function apiChatHistory(token: string, with_user_id: number) {
  const res = await fetch(`${MESSAGES_URL}?action=chat&with_user_id=${with_user_id}`, {
    headers: { "X-Session-Token": token },
  });
  return res.json();
}

export async function apiChatSend(token: string, with_user_id: number, text: string) {
  const res = await fetch(`${MESSAGES_URL}?action=chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Session-Token": token },
    body: JSON.stringify({ with_user_id, text }),
  });
  return res.json();
}

export async function apiGetChats(token: string) {
  const res = await fetch(`${MESSAGES_URL}?action=chats`, {
    headers: { "X-Session-Token": token },
  });
  return res.json();
}

// ===== API CONTACTS =====
export async function apiSearchByPhone(token: string, phone: string) {
  const res = await fetch(`${CONTACTS_URL}?action=search&phone=${encodeURIComponent(phone)}`, {
    headers: { "X-Session-Token": token },
  });
  return res.json();
}

// ===== УТИЛИТЫ =====
export function nowTime() {
  return new Date().toLocaleTimeString("ru", { hour: "2-digit", minute: "2-digit" });
}

export function nameToAvatar(name: string): string {
  const parts = name.trim().split(" ");
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return name.slice(0, 2).toUpperCase();
}
