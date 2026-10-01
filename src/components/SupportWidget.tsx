"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { useLatest } from "@/lib/useLatest";
import {
  getLiveSupportMessages,
  liveSupportStreamUrl,
  sendLiveSupportMessage,
  startLiveSupport,
  type LiveSupportMessage,
} from "@/lib/pirkApi";
import AssetIcon from "@/components/ui/AssetIcon";

type SavedChat = { id: number; token?: string };

export default function SupportWidget() {
  const pathname = usePathname();
  const { tr } = useLanguage();
  const trRef = useLatest(tr);

  const hidden = pathname.startsWith("/admin");

  const [open, setOpen] = useState(false);
  const [chat, setChat] = useState<SavedChat | null>(null);
  const [messages, setMessages] = useState<LiveSupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [unread, setUnread] = useState(0);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const openRef = useRef(open);
  const startAttemptedRef = useRef(false);

  useEffect(() => {
    openRef.current = open;
    if (open) {
      setUnread(0);
    } else {
      startAttemptedRef.current = false;
    }
  }, [open]);

  useEffect(() => {
    try {
      const saved = (localStorage.getItem("wheelio-live-support") ?? localStorage.getItem("pirkauto-live-support"));
      if (saved) setChat(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (!open || chat || startAttemptedRef.current) return;

    startAttemptedRef.current = true;
    let cancelled = false;
    setLoading(true);
    setError("");

    startLiveSupport({})
      .then((created) => {
        if (cancelled) return;
        const saved = {
          id: created.id,
          token: created.accessToken || undefined,
        };
        localStorage.setItem("wheelio-live-support", JSON.stringify(saved));
        setChat(saved);
      })
      .catch((e) => {
        if (!cancelled) {
          setError(
            e instanceof Error
              ? e.message
              : trRef.current(
                  "Support is temporarily unavailable.",
                  "Pagalba laikinai nepasiekiama.",
                  "Поддержка временно недоступна."
                )
          );
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [open, chat, trRef]);

  useEffect(() => {
    if (!chat) return;

    let source: EventSource | null = null;
    let cancelled = false;

    getLiveSupportMessages(chat.id, chat.token)
      .then((history) => {
        if (!cancelled) {
          setMessages(history.filter((item) => item.sender !== "SYSTEM"));
        }
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem("wheelio-live-support"); localStorage.removeItem("pirkauto-live-support");
          setChat(null);
          setMessages([]);
        }
      });

    source = new EventSource(liveSupportStreamUrl(chat.id, chat.token), {
      withCredentials: true,
    });

    const onMessage = (event: MessageEvent) => {
      try {
        const incoming = JSON.parse(event.data) as LiveSupportMessage;
        if (incoming.sender === "SYSTEM") return;

        setMessages((current) =>
          current.some((item) => item.id === incoming.id)
            ? current
            : [...current, incoming]
        );

        if (incoming.sender === "AGENT" && !openRef.current) {
          setUnread((value) => value + 1);
        }
      } catch {}
    };

    source.addEventListener("message", onMessage as EventListener);

    return () => {
      cancelled = true;
      source?.removeEventListener("message", onMessage as EventListener);
      source?.close();
    };
  }, [chat]);

  useEffect(() => {
    if (open) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, open]);

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!chat || !draft.trim()) return;

    const text = draft.trim();
    setDraft("");
    setError("");

    try {
      const sent = await sendLiveSupportMessage(chat.id, text, chat.token);
      setMessages((current) =>
        current.some((item) => item.id === sent.id)
          ? current
          : [...current, sent]
      );
    } catch (e) {
      setDraft(text);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  if (hidden) return null;

  return (
    <div className="pointer-events-none fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-[90] flex flex-col items-end sm:bottom-6 sm:right-6">
      <div
        className={`pointer-events-none mb-3 max-h-[calc(100dvh-6rem)] w-[calc(100vw-2rem)] max-w-[370px] origin-bottom-right overflow-hidden rounded-3xl border border-border bg-card text-foreground shadow-2xl transition-all duration-300 ${
          open
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "translate-y-3 scale-95 opacity-0"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between bg-accent px-5 py-4 text-accent-foreground">
          <div>
            <div className="flex items-center gap-2 font-extrabold">
              <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 ring-2 ring-white/70" />
              {tr("Wheelio support", "Wheelio pagalba", "Поддержка Wheelio")}
            </div>
            <div className="mt-0.5 text-xs font-medium opacity-80">
              {tr("Online chat", "Pokalbis internetu", "Онлайн-чат")}
            </div>
          </div>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-full bg-black/10 hover:bg-black/15"
            aria-label={tr("Close chat", "Uždaryti pokalbį", "Закрыть чат")}
          >
            <AssetIcon name="close" size={18} />
          </button>
        </div>

        <div className="h-[min(350px,40dvh)] min-h-40 space-y-3 overflow-y-auto bg-background/70 p-4">
          <div className="flex justify-start">
            <div className="max-w-[88%] rounded-2xl rounded-bl-md bg-muted px-4 py-3 text-sm leading-relaxed text-foreground">
              <div className="mb-1 text-[11px] font-bold text-accent-ink">
                {tr("Support", "Pagalba", "Поддержка")}
              </div>
              {tr(
                "Hello! How can we help you?",
                "Sveiki! Kaip galime jums padėti?",
                "Здравствуйте! Чем можем вам помочь?"
              )}
            </div>
          </div>

          {messages.map((message) => {
            const own = message.sender === "USER";
            return (
              <div
                key={message.id}
                className={`flex ${own ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[88%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    own
                      ? "rounded-br-md bg-accent text-accent-foreground"
                      : "rounded-bl-md bg-muted text-foreground"
                  }`}
                >
                  <div className="mb-1 text-[11px] font-bold opacity-70">
                    {own
                      ? tr("You", "Jūs", "Вы")
                      : tr("Support", "Pagalba", "Поддержка")}
                  </div>
                  <div className="whitespace-pre-wrap">{message.message}</div>
                </div>
              </div>
            );
          })}

          {loading && (
            <div className="text-center text-xs text-muted-foreground">
              {tr("Connecting…", "Jungiama…", "Подключаемся…")}
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        <form onSubmit={send} className="border-t border-border bg-card p-3">
          <div className="flex gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              maxLength={5000}
              disabled={!chat || loading}
              placeholder={tr(
                "Write a message…",
                "Rašykite žinutę…",
                "Напишите сообщение…"
              )}
              className="h-11 min-w-0 flex-1 rounded-xl border border-border bg-background px-3 text-sm text-foreground outline-none focus:ring-2 focus:ring-accent disabled:opacity-60"
            />
            <button
              type="submit"
              disabled={!chat || loading || !draft.trim()}
              aria-label={tr("Send", "Siųsti", "Отправить")}
              className="grid h-11 place-items-center rounded-xl bg-accent px-4 text-accent-foreground transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50"
            >
              <AssetIcon name="send" size={20} />
            </button>
          </div>

          {error && <div className="mt-2 text-xs text-red-500">{error}</div>}

          <Link
            href="/help"
            onClick={() => setOpen(false)}
            className="mt-2 block text-center text-xs font-semibold text-muted-foreground hover:text-accent-ink"
          >
            {tr(
              "Open Help center",
              "Atidaryti pagalbos centrą",
              "Открыть центр помощи"
            )}
          </Link>
        </form>
      </div>

      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="pointer-events-auto relative grid h-14 w-14 touch-manipulation place-items-center rounded-full bg-accent text-accent-foreground shadow-xl ring-1 ring-black/10 transition duration-200 hover:scale-105 sm:h-16 sm:w-16"
        aria-label={tr("Open support", "Atidaryti pagalbą", "Открыть поддержку")}
      >
        {open ? <AssetIcon name="close" size={28} /> : <AssetIcon name="support-chat" size={26} />}
        {unread > 0 && !open && (
          <span className="absolute -right-1 -top-1 grid h-6 min-w-6 place-items-center rounded-full bg-red-500 px-1 text-xs font-bold text-white ring-2 ring-background">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>
    </div>
  );
}
