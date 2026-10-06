"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useCallback, useEffect, useRef, useState, type KeyboardEvent } from "react";
import { useLanguage } from "@/context/LanguageContext";
import AssetIcon from "@/components/ui/AssetIcon";
import { ApiError } from "@/lib/http";
import {
  CHAT_MESSAGE_MAX,
  getChat,
  listChats,
  notifyChatsChanged,
  sendChatMessage,
  type ChatMessage,
  type ChatSummary,
} from "@/lib/chats";

const FALLBACK_IMAGE = "/images/no-photo.svg";
/** How often an open conversation and the list ask for new messages while the tab is visible. */
const THREAD_POLL_MS = 4000;
const LIST_POLL_MS = 15000;

function formatPrice(value: number | null) {
  if (value == null) return "";
  return new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}

function sameDay(a: Date, b: Date) {
  return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
}

function useVisiblePoll(fn: () => void, ms: number, enabled = true) {
  const saved = useRef(fn);
  saved.current = fn;
  useEffect(() => {
    if (!enabled) return;
    const tick = () => {
      if (document.visibilityState === "visible") saved.current();
    };
    const timer = window.setInterval(tick, ms);
    document.addEventListener("visibilitychange", tick);
    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", tick);
    };
  }, [ms, enabled]);
}

function Thumb({ src, className = "" }: { src?: string; className?: string }) {
  const [failed, setFailed] = useState(false);
  return (
    // eslint-disable-next-line @next/next/no-img-element -- API images are served by the backend origin
    <img
      src={!src || failed ? FALLBACK_IMAGE : src}
      alt=""
      onError={() => setFailed(true)}
      className={`shrink-0 rounded-lg bg-muted object-cover ${className}`}
    />
  );
}

/** "Messages": conversations with buyers and sellers. activeId opens one; on phones the list and the open
 * conversation are separate screens. */
export default function Messenger({ activeId }: { activeId?: number }) {
  const { tr, language } = useLanguage();
  const router = useRouter();
  const [chats, setChats] = useState<ChatSummary[] | null>(null);
  const [error, setError] = useState("");

  const locale = language === "LT" ? "lt-LT" : language === "RU" ? "ru-RU" : "en-GB";

  const onAuthError = useCallback(
    (e: unknown) => {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        router.replace(`/auth/login?return=${encodeURIComponent(activeId ? `/messages/${activeId}` : "/messages")}`);
        return true;
      }
      return false;
    },
    [router, activeId]
  );

  const loadList = useCallback(() => {
    listChats()
      .then((list) => {
        setChats(list);
        setError("");
      })
      .catch((e) => {
        if (onAuthError(e)) return;
        setChats((current) => current ?? []);
        setError(
          e instanceof ApiError && e.status === 503
            ? tr("Messages are not available yet.", "Žinutės dar neveikia.", "Сообщения пока недоступны.")
            : e instanceof Error
              ? e.message
              : "Error"
        );
      });
  }, [onAuthError, tr]);

  useEffect(loadList, [loadList]);
  useVisiblePoll(loadList, LIST_POLL_MS);

  const roleLabel = (c: ChatSummary) =>
    c.role === "SELLER" ? tr("Buyer", "Pirkėjas", "Покупатель") : tr("Seller", "Pardavėjas", "Продавец");
  const nameOf = (c: ChatSummary) => c.otherName || (c.otherAvailable ? roleLabel(c) : tr("Deleted user", "Ištrintas naudotojas", "Удалённый пользователь"));

  const timeLabel = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    return sameDay(d, new Date())
      ? d.toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })
      : d.toLocaleDateString(locale, { day: "numeric", month: "short" });
  };

  const list = (
    <aside className={`${activeId ? "hidden lg:flex" : "flex"} min-h-0 min-w-0 flex-col border-border lg:border-r`}>
      {chats === null ? (
        <div className="space-y-2 p-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[76px] animate-pulse rounded-xl bg-muted" />
          ))}
        </div>
      ) : chats.length === 0 ? (
        <div className="flex flex-1 flex-col items-center justify-center p-8 text-center">
          <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent/10 text-accent-ink">
            <AssetIcon name="message" size={26} />
          </span>
          <h2 className="mt-4 text-lg font-bold">{tr("No messages yet", "Žinučių dar nėra", "Сообщений пока нет")}</h2>
          <p className="mt-1 max-w-xs text-sm text-muted-foreground">
            {tr(
              "Press “Write to the seller” on a listing. Buyers’ questions about your cars also appear here.",
              "Skelbime paspauskite „Parašyti pardavėjui“. Čia matysite ir pirkėjų klausimus apie jūsų automobilius.",
              "Нажмите «Написать продавцу» в объявлении. Вопросы покупателей о ваших машинах тоже появятся здесь."
            )}
          </p>
          <Link href="/" className="mt-5 rounded-xl bg-accent px-5 py-2.5 text-sm font-bold text-accent-foreground">
            {tr("Browse cars", "Žiūrėti automobilius", "Смотреть автомобили")}
          </Link>
        </div>
      ) : (
        <ul className="min-h-0 flex-1 overflow-y-auto p-2">
          {chats.map((c) => {
            const active = c.id === activeId;
            return (
              <li key={c.id}>
                <Link
                  href={`/messages/${c.id}`}
                  className={`flex items-center gap-3 rounded-xl p-2.5 transition ${active ? "bg-accent/10" : "hover:bg-muted"}`}
                >
                  <Thumb src={c.listing.thumbnail} className="h-14 w-[72px]" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-baseline gap-2">
                      <span className="truncate font-bold">{nameOf(c)}</span>
                      <span className="ml-auto shrink-0 text-xs text-muted-foreground">{timeLabel(c.lastMessageAt)}</span>
                    </div>
                    <div className="truncate text-xs font-semibold text-muted-foreground">{c.listing.title || `#${c.listing.id}`}</div>
                    <div className="mt-0.5 flex items-center gap-2">
                      <span className={`truncate text-sm ${c.unread ? "font-semibold text-foreground" : "text-muted-foreground"}`}>
                        {c.lastMessageMine && `${tr("You", "Jūs", "Вы")}: `}
                        {c.lastMessage}
                      </span>
                      {c.unread > 0 && (
                        <span className="ml-auto flex h-5 min-w-5 shrink-0 items-center justify-center rounded-full bg-accent px-1.5 text-[11px] font-bold text-accent-foreground">
                          {c.unread > 99 ? "99+" : c.unread}
                        </span>
                      )}
                    </div>
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </aside>
  );

  return (
    <main className="bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-0 py-0 sm:px-6 sm:py-8 lg:px-8">
        <h1 className={`page-title px-4 pt-6 sm:px-0 sm:pt-0 ${activeId ? "hidden lg:block" : ""}`}>
          {tr("Messages", "Žinutės", "Сообщения")}
        </h1>
        {error && <div className="mx-4 mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-500 sm:mx-0">{error}</div>}
        <div
          className={`grid grid-cols-1 overflow-hidden bg-card sm:rounded-2xl sm:ring-1 sm:ring-border lg:grid-cols-[340px_1fr] ${
            activeId
              ? "h-[calc(100dvh-64px)] sm:h-[calc(100dvh-144px)] lg:mt-6 lg:h-[calc(100dvh-250px)] lg:min-h-[480px]"
              : "mt-4 min-h-[60vh] sm:mt-6 lg:h-[calc(100dvh-250px)] lg:min-h-[480px]"
          }`}
        >
          {list}
          {activeId ? (
            <Thread
              key={activeId}
              id={activeId}
              locale={locale}
              nameOf={nameOf}
              roleLabel={roleLabel}
              onAuthError={onAuthError}
              onActivity={loadList}
            />
          ) : (
            <div className="hidden flex-col items-center justify-center p-8 text-center text-muted-foreground lg:flex">
              <AssetIcon name="message" size={40} className="opacity-40" />
              <p className="mt-3 text-sm">{tr("Choose a conversation", "Pasirinkite pokalbį", "Выберите переписку")}</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}

function Thread({
  id,
  locale,
  nameOf,
  roleLabel,
  onAuthError,
  onActivity,
}: {
  id: number;
  locale: string;
  nameOf: (c: ChatSummary) => string;
  roleLabel: (c: ChatSummary) => string;
  onAuthError: (e: unknown) => boolean;
  onActivity: () => void;
}) {
  const { tr } = useLanguage();
  const [chat, setChat] = useState<ChatSummary | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [missing, setMissing] = useState(false);
  const [draft, setDraft] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const lastId = useRef(0);
  const scroller = useRef<HTMLDivElement>(null);
  const atBottom = useRef(true);

  const merge = useCallback((incoming: ChatMessage[]) => {
    if (!incoming.length) return;
    setMessages((current) => {
      const known = new Set(current.map((m) => m.id));
      const next = [...current, ...incoming.filter((m) => !known.has(m.id))].sort((a, b) => a.id - b.id);
      lastId.current = next.length ? next[next.length - 1].id : 0;
      return next;
    });
  }, []);

  const poll = useCallback(
    (first = false) => {
      getChat(id, first ? 0 : lastId.current)
        .then((r) => {
          setChat(r.chat);
          if (r.messages.some((m) => !m.mine) || first) {
            notifyChatsChanged();
            if (!first) onActivity();
          }
          merge(r.messages);
        })
        .catch((e) => {
          if (onAuthError(e)) return;
          if (e instanceof ApiError && e.status === 404) setMissing(true);
          else if (first) setError(e instanceof Error ? e.message : "Error");
        });
    },
    [id, merge, onAuthError, onActivity]
  );

  useEffect(() => poll(true), [poll]);
  useVisiblePoll(() => poll(false), THREAD_POLL_MS, !missing);

  useEffect(() => {
    const el = scroller.current;
    if (el && atBottom.current) el.scrollTop = el.scrollHeight;
  }, [messages]);

  const send = async () => {
    const text = draft.trim();
    if (!text || sending) return;
    setSending(true);
    setError("");
    try {
      const m = await sendChatMessage(id, text);
      atBottom.current = true;
      merge([m]);
      setDraft("");
      onActivity();
    } catch (e) {
      if (onAuthError(e)) return;
      const code = e instanceof ApiError ? (e.details as { code?: string } | undefined)?.code : undefined;
      setError(
        code === "USER_UNAVAILABLE"
          ? tr("This user can no longer receive messages.", "Šis naudotojas nebegali gauti žinučių.", "Этот пользователь больше не может получать сообщения.")
          : e instanceof ApiError && e.status === 429
            ? tr("Too many messages. Try again later.", "Per daug žinučių. Bandykite vėliau.", "Слишком много сообщений. Попробуйте позже.")
            : e instanceof Error
              ? e.message
              : "Error"
      );
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
      e.preventDefault();
      void send();
    }
  };

  if (missing) {
    return (
      <section className="flex flex-col items-center justify-center p-8 text-center">
        <h2 className="text-lg font-bold">{tr("Conversation not found", "Pokalbis nerastas", "Переписка не найдена")}</h2>
        <Link href="/messages" className="mt-4 text-sm font-semibold text-accent-ink underline">
          {tr("All messages", "Visos žinutės", "Все сообщения")}
        </Link>
      </section>
    );
  }

  const status = chat?.listing.status;
  const statusLabel =
    status === "SOLD"
      ? tr("Sold", "Parduota", "Продано")
      : status && status !== "ACTIVE"
        ? tr("Not for sale", "Neparduodama", "Не продаётся")
        : "";

  const items: ({ day: string } | ChatMessage)[] = [];
  let prev: Date | null = null;
  for (const m of messages) {
    const d = new Date(m.createdAt);
    if (!prev || !sameDay(prev, d)) items.push({ day: d.toLocaleDateString(locale, { day: "numeric", month: "long", year: "numeric" }) });
    items.push(m);
    prev = d;
  }

  return (
    <section className="flex min-h-0 min-w-0 flex-col">
      <header className="flex items-center gap-3 border-b border-border px-3 py-2.5 sm:px-4">
        <Link href="/messages" className="-ml-1 flex h-9 w-9 items-center justify-center rounded-full hover:bg-muted lg:hidden" aria-label={tr("Back", "Atgal", "Назад")}>
          <AssetIcon name="arrow-left" size={20} />
        </Link>
        {chat ? (
          <Link href={`/listing/${chat.listing.id}`} className="flex min-w-0 flex-1 items-center gap-3">
            <Thumb src={chat.listing.thumbnail} className="h-11 w-14" />
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="truncate font-bold">{nameOf(chat)}</span>
                <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] font-semibold text-muted-foreground">{roleLabel(chat)}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="truncate">{chat.listing.title || `#${chat.listing.id}`}</span>
                {chat.listing.price != null && <span className="shrink-0 font-semibold text-accent-ink">{formatPrice(chat.listing.price)}</span>}
                {statusLabel && <span className="shrink-0 rounded-full border border-border px-2 text-[11px] font-semibold">{statusLabel}</span>}
              </div>
            </div>
          </Link>
        ) : (
          <div className="h-11 flex-1 animate-pulse rounded-lg bg-muted" />
        )}
      </header>

      <div
        ref={scroller}
        onScroll={(e) => {
          const el = e.currentTarget;
          atBottom.current = el.scrollHeight - el.scrollTop - el.clientHeight < 80;
        }}
        className="min-h-0 flex-1 overflow-y-auto bg-background/60 px-3 py-4 sm:px-5"
      >
        <div className="mx-auto mb-4 flex max-w-md items-start gap-2 rounded-xl border border-accent/30 bg-accent/5 px-3 py-2 text-xs text-muted-foreground">
          <AssetIcon name="shield" size={16} className="mt-px text-accent-ink" />
          <span>
            {tr(
              "Meet in person and check the car before paying. Never pay in advance or share card details: Wheelio never asks for payment in messages.",
              "Susitikite ir apžiūrėkite automobilį prieš mokėdami. Niekada nemokėkite iš anksto ir nesiųskite kortelės duomenų: Wheelio žinutėse niekada neprašo mokėti.",
              "Встречайтесь лично и осматривайте машину до оплаты. Никогда не платите заранее и не сообщайте данные карты: Wheelio никогда не просит оплату в сообщениях."
            )}
          </span>
        </div>
        {items.map((item, i) =>
          "day" in item ? (
            <div key={`d-${i}`} className="my-3 text-center text-xs font-semibold text-muted-foreground">
              {item.day}
            </div>
          ) : (
            <div key={item.id} className={`mb-1.5 flex ${item.mine ? "justify-end" : "justify-start"}`}>
              <div
                className={`max-w-[80%] rounded-2xl px-3.5 py-2 text-[15px] leading-snug shadow-sm sm:max-w-[70%] ${
                  item.mine ? "rounded-br-md bg-accent text-accent-foreground" : "rounded-bl-md bg-card ring-1 ring-border"
                }`}
              >
                <p className="whitespace-pre-wrap break-words">{item.body}</p>
                <div className={`mt-0.5 text-right text-[11px] ${item.mine ? "opacity-75" : "text-muted-foreground"}`}>
                  {new Date(item.createdAt).toLocaleTimeString(locale, { hour: "2-digit", minute: "2-digit" })}
                </div>
              </div>
            </div>
          )
        )}
      </div>

      <footer className="border-t border-border p-2.5 sm:p-3">
        {error && <p className="mb-2 px-1 text-sm text-red-500">{error}</p>}
        {chat && !chat.otherAvailable ? (
          <p className="px-1 py-2 text-center text-sm text-muted-foreground">
            {tr("This user can no longer receive messages.", "Šis naudotojas nebegali gauti žinučių.", "Этот пользователь больше не может получать сообщения.")}
          </p>
        ) : (
          <div className="flex items-end gap-2">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value.slice(0, CHAT_MESSAGE_MAX))}
              onKeyDown={onKeyDown}
              rows={1}
              placeholder={tr("Write a message…", "Rašykite žinutę…", "Напишите сообщение…")}
              aria-label={tr("Message", "Žinutė", "Сообщение")}
              className="max-h-40 min-h-[44px] flex-1 resize-none rounded-xl border border-border bg-background px-3.5 py-2.5 text-[15px] outline-none [field-sizing:content] focus:border-accent"
            />
            <button
              type="button"
              onClick={send}
              disabled={sending || !draft.trim()}
              aria-label={tr("Send", "Siųsti", "Отправить")}
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-accent text-accent-foreground transition disabled:opacity-40"
            >
              <AssetIcon name={sending ? "spinner" : "send"} size={19} className={sending ? "animate-spin" : ""} />
            </button>
          </div>
        )}
      </footer>
    </section>
  );
}
