"use client";

import { FormEvent, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  getLiveSupportMessages,
  liveSupportStreamUrl,
  sendLiveSupportMessage,
  sendSupportTicket,
  startLiveSupport,
  type LiveSupportMessage,
} from "@/lib/wheelioApi";

type SavedChat = { id: number; token?: string };

export default function HelpPage() {
  const { language } = useLanguage();
  const tr = (en: string, lt: string, ru: string) =>
    language === "LT" ? lt : language === "RU" ? ru : en;

  const [tab, setTab] = useState<"live" | "ticket">("live");

  return (
    <main className="container py-12 text-foreground">
      <div className="mx-auto max-w-4xl">
        <h1 className="mb-3 text-5xl font-bold">
          {tr("Help & support", "Pagalba", "Помощь и поддержка")}
        </h1>
        <p className="mb-7 text-muted-foreground">
          {tr(
            "Chat with support in real time or send a ticket if your question is not urgent.",
            "Kalbėkitės su pagalba realiuoju laiku arba išsiųskite užklausą, jei klausimas nėra skubus.",
            "Напишите поддержке в реальном времени или отправьте обращение, если вопрос не срочный."
          )}
        </p>

        <div className="mb-5 flex gap-2 rounded-xl bg-muted p-1">
          <button
            onClick={() => setTab("live")}
            className={`flex-1 rounded-lg px-4 py-3 font-bold transition ${tab === "live" ? "bg-accent text-black" : "hover:bg-background"}`}
          >
            {tr("Live chat", "Pokalbis gyvai", "Онлайн-чат")}
          </button>
          <button
            onClick={() => setTab("ticket")}
            className={`flex-1 rounded-lg px-4 py-3 font-bold transition ${tab === "ticket" ? "bg-accent text-black" : "hover:bg-background"}`}
          >
            {tr("Send a ticket", "Siųsti užklausą", "Отправить обращение")}
          </button>
        </div>

        {tab === "live" ? <LiveChat tr={tr} /> : <TicketForm tr={tr} />}
      </div>
    </main>
  );
}

function LiveChat({ tr }: { tr: (en: string, lt: string, ru: string) => string }) {
  const [identity, setIdentity] = useState({ name: "", email: "", phone: "" });
  const [chat, setChat] = useState<SavedChat | null>(null);
  const [messages, setMessages] = useState<LiveSupportMessage[]>([]);
  const [draft, setDraft] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const bottomRef = useRef<HTMLDivElement | null>(null);

  const input = "h-11 w-full rounded-lg bg-[#cecece] px-3 text-black outline-none focus:ring-2 focus:ring-accent";

  useEffect(() => {
    try {
      const saved = localStorage.getItem("wheelio-live-support");
      if (saved) setChat(JSON.parse(saved));
    } catch {}
  }, []);

  useEffect(() => {
    if (!chat) return;
    let source: EventSource | null = null;
    let cancelled = false;

    getLiveSupportMessages(chat.id, chat.token)
      .then((history) => {
        if (!cancelled) setMessages(history);
      })
      .catch(() => {
        if (!cancelled) {
          localStorage.removeItem("wheelio-live-support");
          setChat(null);
        }
      });

    source = new EventSource(liveSupportStreamUrl(chat.id, chat.token), {
      withCredentials: true,
    });
    const onMessage = (event: MessageEvent) => {
      try {
        const incoming = JSON.parse(event.data) as LiveSupportMessage;
        setMessages((current) =>
          current.some((item) => item.id === incoming.id)
            ? current
            : [...current, incoming]
        );
      } catch {}
    };
    source.addEventListener("message", onMessage as EventListener);
    source.onerror = () => {
      // Browser automatically reconnects SSE. Do not replace the chat with an error screen.
    };

    return () => {
      cancelled = true;
      source?.removeEventListener("message", onMessage as EventListener);
      source?.close();
    };
  }, [chat]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function start(e: FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const created = await startLiveSupport(identity);
      const saved = { id: created.id, token: created.accessToken || undefined };
      localStorage.setItem("wheelio-live-support", JSON.stringify(saved));
      setChat(saved);
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setLoading(false);
    }
  }

  async function send(e: FormEvent) {
    e.preventDefault();
    if (!chat || !draft.trim()) return;
    const text = draft.trim();
    setDraft("");
    setError("");
    try {
      const sent = await sendLiveSupportMessage(chat.id, text, chat.token);
      setMessages((current) =>
        current.some((item) => item.id === sent.id) ? current : [...current, sent]
      );
    } catch (e) {
      setDraft(text);
      setError(e instanceof Error ? e.message : String(e));
    }
  }

  function newChat() {
    localStorage.removeItem("wheelio-live-support");
    setChat(null);
    setMessages([]);
    setDraft("");
  }

  if (!chat) {
    return (
      <form onSubmit={start} className="grid gap-4 rounded-2xl bg-card p-7 ring-1 ring-border md:grid-cols-2">
        <div className="md:col-span-2 rounded-xl bg-emerald-500/10 p-4 text-sm text-emerald-500">
          <span className="mr-2 inline-block h-2.5 w-2.5 rounded-full bg-emerald-500" />
          {tr("Real-time support chat", "Pagalbos pokalbis realiuoju laiku", "Поддержка в реальном времени")}
        </div>
        <input className={input} placeholder={tr("Name", "Vardas", "Имя")} value={identity.name} onChange={(e) => setIdentity({ ...identity, name: e.target.value })} />
        <input className={input} type="email" placeholder="E-mail" value={identity.email} onChange={(e) => setIdentity({ ...identity, email: e.target.value })} />
        <input className={`${input} md:col-span-2`} placeholder={tr("Phone (optional)", "Telefonas (nebūtina)", "Телефон (необязательно)")} value={identity.phone} onChange={(e) => setIdentity({ ...identity, phone: e.target.value })} />
        {error && <div className="md:col-span-2 text-red-500">{error}</div>}
        <button disabled={loading} className="md:col-span-2 h-12 rounded-lg bg-[#5f5f5f] font-bold text-white hover:bg-accent disabled:opacity-60">
          {loading ? "…" : tr("Start live chat", "Pradėti pokalbį", "Начать онлайн-чат")}
        </button>
      </form>
    );
  }

  return (
    <div className="overflow-hidden rounded-2xl bg-card ring-1 ring-border">
      <div className="flex items-center justify-between border-b border-border p-4">
        <div>
          <div className="font-bold">{tr("Live support", "Pagalba gyvai", "Онлайн-поддержка")}</div>
          <div className="text-xs text-muted-foreground">#{chat.id}</div>
        </div>
        <button onClick={newChat} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">
          {tr("New chat", "Naujas pokalbis", "Новый чат")}
        </button>
      </div>

      <div className="h-[420px] space-y-3 overflow-y-auto bg-background/40 p-4">
        {messages.map((message) => {
          const own = message.sender === "USER";
          const system = message.sender === "SYSTEM";
          return (
            <div key={message.id} className={`flex ${system ? "justify-center" : own ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] rounded-2xl px-4 py-2 text-sm ${system ? "bg-muted text-muted-foreground" : own ? "bg-accent text-black" : "bg-muted text-foreground"}`}>
                {!system && <div className="mb-1 text-[11px] font-bold opacity-70">{own ? tr("You", "Jūs", "Вы") : tr("Support", "Pagalba", "Поддержка")}</div>}
                <div className="whitespace-pre-wrap">{message.message}</div>
              </div>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={send} className="flex gap-2 border-t border-border p-4">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={5000}
          placeholder={tr("Write a message…", "Rašykite žinutę…", "Напишите сообщение…")}
          className="h-12 flex-1 rounded-lg border border-border bg-background px-4 outline-none focus:ring-2 focus:ring-accent"
        />
        <button className="rounded-lg bg-accent px-5 font-bold text-black">{tr("Send", "Siųsti", "Отправить")}</button>
      </form>
      {error && <div className="px-4 pb-4 text-sm text-red-500">{error}</div>}
    </div>
  );
}

function TicketForm({ tr }: { tr: (en: string, lt: string, ru: string) => string }) {
  const [f, setF] = useState({ name: "", email: "", phone: "", category: "general", subject: "", message: "" });
  const [loading, setLoading] = useState(false);
  const [ticket, setTicket] = useState<number | null>(null);
  const [error, setError] = useState("");
  const set = (k: string, v: string) => setF((x) => ({ ...x, [k]: v }));
  const input = "h-11 w-full rounded-lg bg-[#cecece] px-3 text-black outline-none focus:ring-2 focus:ring-accent";

  async function submit(e: FormEvent) {
    e.preventDefault(); setError(""); setLoading(true);
    try {
      const r = await sendSupportTicket(f);
      setTicket(r.id);
      setF({ name: "", email: "", phone: "", category: "general", subject: "", message: "" });
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally { setLoading(false); }
  }

  return (
    <form onSubmit={submit} className="grid gap-4 rounded-2xl bg-card p-7 ring-1 ring-border md:grid-cols-2">
      <input className={input} placeholder={tr("Name", "Vardas", "Имя")} value={f.name} onChange={(e) => set("name", e.target.value)} />
      <input className={input} type="email" placeholder="E-mail" value={f.email} onChange={(e) => set("email", e.target.value)} />
      <input className={input} placeholder={tr("Phone (optional)", "Telefonas (nebūtina)", "Телефон (необязательно)")} value={f.phone} onChange={(e) => set("phone", e.target.value)} />
      <select className={input} value={f.category} onChange={(e) => set("category", e.target.value)}>
        <option value="general">{tr("General", "Bendra", "Общий вопрос")}</option>
        <option value="listing">{tr("Listing", "Skelbimas", "Объявление")}</option>
        <option value="payment">{tr("Payment", "Mokėjimas", "Оплата")}</option>
        <option value="account">{tr("Account", "Paskyra", "Аккаунт")}</option>
        <option value="technical">{tr("Technical problem", "Techninė problema", "Техническая проблема")}</option>
      </select>
      <input className={`${input} md:col-span-2`} required placeholder={tr("Subject", "Tema", "Тема")} value={f.subject} onChange={(e) => set("subject", e.target.value)} />
      <textarea className="min-h-40 rounded-lg bg-[#cecece] p-3 text-black md:col-span-2" required maxLength={5000} placeholder={tr("Describe the problem", "Aprašykite problemą", "Опишите проблему")} value={f.message} onChange={(e) => set("message", e.target.value)} />
      {error && <div className="md:col-span-2 text-red-600">{error}</div>}
      {ticket && <div className="md:col-span-2 rounded-lg bg-green-500/10 p-3 text-green-600">{tr("Message sent. Ticket", "Žinutė išsiųsta. Užklausa", "Сообщение отправлено. Обращение")} #{ticket}</div>}
      <button disabled={loading} className="md:col-span-2 h-12 rounded-lg bg-[#5f5f5f] font-bold text-white hover:bg-accent disabled:opacity-60">{loading ? "…" : tr("Send to support", "Siųsti pagalbai", "Отправить в поддержку")}</button>
    </form>
  );
}
