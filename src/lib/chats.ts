import { resolveApiAsset } from "@/lib/config";
import { fetchJson } from "@/lib/http";

// Chat between a buyer and the seller of a listing (backend: src/chats/chats.controller.ts).

export type ChatSummary = {
  id: number;
  /** The signed-in user's side in this conversation. */
  role: "BUYER" | "SELLER";
  listing: { id: number; title: string | null; price: number | null; status: string | null; thumbnail?: string };
  /** First name of the other side; null when that account was blocked or deleted. */
  otherName: string | null;
  otherAvailable: boolean;
  lastMessage: string | null;
  lastMessageMine: boolean;
  lastMessageAt: string;
  unread: number;
};

export type ChatMessage = { id: number; mine: boolean; body: string; createdAt: string };

export const CHAT_MESSAGE_MAX = 2000;

function normalize(chat: ChatSummary): ChatSummary {
  return { ...chat, listing: { ...chat.listing, thumbnail: resolveApiAsset(chat.listing.thumbnail) } };
}

export async function listChats() {
  return (await fetchJson<ChatSummary[]>("/chats")).map(normalize);
}

export async function getChat(id: number | string, after = 0) {
  const r = await fetchJson<{ chat: ChatSummary; messages: ChatMessage[] }>(
    `/chats/${encodeURIComponent(String(id))}${after ? `?after=${after}` : ""}`
  );
  return { chat: normalize(r.chat), messages: r.messages };
}

export function sendChatMessage(id: number | string, message: string) {
  return fetchJson<ChatMessage>(`/chats/${encodeURIComponent(String(id))}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

/** Writes to the seller of a listing; continues the existing conversation if there is one. */
export function startChat(listingId: number | string, message: string) {
  return fetchJson<{ chatId: number; message: ChatMessage }>("/chats", {
    method: "POST",
    body: JSON.stringify({ listingId: Number(listingId), message }),
  });
}

export function getListingChat(listingId: number | string) {
  return fetchJson<{ chatId: number | null; own: boolean; available: boolean }>(
    `/chats/listing/${encodeURIComponent(String(listingId))}`
  );
}

export function getUnreadChats() {
  return fetchJson<{ count: number }>("/chats/unread");
}

/** Fired after messages are read or sent, so the header badge refreshes at once. */
export const CHATS_CHANGED_EVENT = "wheelio:chats-changed";
export function notifyChatsChanged() {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(CHATS_CHANGED_EVENT));
}
