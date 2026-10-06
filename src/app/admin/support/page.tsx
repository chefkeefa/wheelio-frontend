"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ApiError } from "@/lib/http";
import {
  isSupportUser,
  listSupportTicketReplies,
  me,
  replyToSupportTicket,
  type SupportReplyEmailError,
  type SupportTicketReply,
  listSupportConversations,
  listSupportTickets,
  pollLiveSupport,
  sendAgentSupportMessage,
  setSupportConversationClosed,
  setSupportTicketStatus,
  type LiveSupportConversation,
  type LiveSupportMessage,
  type SupportTicket,
} from "@/lib/pirkApi";
import { useLanguage } from "@/context/LanguageContext";

export default function SupportAgentPage() {
  const { tr } = useLanguage();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    me()
      .then((u) => setAllowed(isSupportUser(u)))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) router.replace("/auth/login?return=/admin/support");
        else setAllowed(false);
      });
  }, [router]);

  if (allowed === null) return <main className="container mx-auto min-h-[60vh] px-4 py-10">…</main>;
  if (!allowed)
    return (
      <main className="container mx-auto min-h-[60vh] px-4 py-10">
        <h1 className="text-3xl font-extrabold">{tr("Access denied", "Prieiga uždrausta", "Доступ запрещён")}</h1>
        <p className="mt-2 text-muted-foreground">{tr("This page is for support staff.", "Šis puslapis skirtas pagalbos komandai.", "Эта страница только для сотрудников поддержки.")}</p>
      </main>
    );
  return <SupportDesk />;
}

function SupportDesk() {
  const { language } = useLanguage();
  const tr = (en:string,lt:string,ru:string)=>language==="LT"?lt:language==="RU"?ru:en;
  const [conversations,setConversations]=useState<LiveSupportConversation[]>([]);
  const [selected,setSelected]=useState<number|null>(null);
  const [messages,setMessages]=useState<LiveSupportMessage[]>([]);
  const [draft,setDraft]=useState("");
  const [error,setError]=useState("");
  const [view,setView]=useState<"chat"|"tickets">("chat");
  const [tickets,setTickets]=useState<SupportTicket[]>([]);
  const [selectedTicket,setSelectedTicket]=useState<number|null>(null);

  async function refresh(){
    try{const r=await listSupportConversations();setConversations(r.content||[]);setSelected(current=>current??(r.content?.[0]?.id??null));}catch(e){setError(e instanceof Error?e.message:String(e));}
  }

  async function refreshTickets(){
    try{const r=await listSupportTickets();setTickets(r.content||[]);setSelectedTicket(current=>current??(r.content?.[0]?.id??null));}catch(e){setError(e instanceof Error?e.message:String(e));}
  }

  useEffect(()=>{void refresh();void refreshTickets();const timer=setInterval(()=>{void refresh();void refreshTickets();},10000);return()=>clearInterval(timer);},[]);

  useEffect(()=>{
    if(!selected)return;
    // Clear the previous chat at once, so its messages never show under another customer's name.
    setMessages([]);
    return pollLiveSupport(selected,undefined,{
      onHistory:setMessages,
      onNew:fresh=>setMessages(cur=>[...cur,...fresh.filter(m=>!cur.some(x=>x.id===m.id))]),
      onHistoryError:e=>setError(e instanceof Error?e.message:String(e)),
    });
  },[selected]);

  const current=useMemo(()=>conversations.find(c=>c.id===selected)||null,[conversations,selected]);
  const currentTicket=useMemo(()=>tickets.find(t=>t.id===selectedTicket)||null,[tickets,selectedTicket]);

  async function send(e:FormEvent){e.preventDefault();if(!selected||!draft.trim())return;const text=draft.trim();setDraft("");try{const m=await sendAgentSupportMessage(selected,text);setMessages(cur=>cur.some(x=>x.id===m.id)?cur:[...cur,m]);await refresh();}catch(e){setDraft(text);setError(e instanceof Error?e.message:String(e));}}

  async function toggleClosed(){if(!current)return;try{await setSupportConversationClosed(current.id,current.status!=="CLOSED");await refresh();}catch(e){setError(e instanceof Error?e.message:String(e));}}
  async function changeTicketStatus(status:SupportTicket["status"]){if(!currentTicket)return;try{const updated=await setSupportTicketStatus(currentTicket.id,status);setTickets(items=>items.map(ticket=>ticket.id===updated.id?updated:ticket));}catch(e){setError(e instanceof Error?e.message:String(e));}}

  return <main className="container py-8 text-foreground"><h1 className="mb-6 text-4xl font-bold">{tr("Support dashboard","Pagalbos valdymas","Панель поддержки")}</h1>{error&&<div className="mb-4 rounded-lg bg-red-500/10 p-3 text-red-500">{error}</div>}<div className="mb-4 flex gap-2"><button onClick={()=>setView("chat")} className={`rounded-xl px-4 py-3 font-bold ${view==="chat"?"bg-accent text-accent-foreground":"bg-card ring-1 ring-border"}`}>{tr("Live chats","Pokalbiai gyvai","Онлайн-чаты")} ({conversations.length})</button><button onClick={()=>setView("tickets")} className={`rounded-xl px-4 py-3 font-bold ${view==="tickets"?"bg-accent text-accent-foreground":"bg-card ring-1 ring-border"}`}>{tr("Support requests","Užklausos","Обращения")} ({tickets.length})</button></div>{view==="chat"?<div className="grid min-h-[650px] overflow-hidden rounded-2xl bg-card ring-1 ring-border lg:grid-cols-[320px_1fr]">
    <aside className="border-r border-border"><div className="p-4 font-bold">{tr("Conversations","Pokalbiai","Диалоги")}</div><div className="max-h-[600px] overflow-y-auto">{conversations.map(c=><button key={c.id} onClick={()=>setSelected(c.id)} className={`block w-full border-t border-border p-4 text-left ${selected===c.id?"bg-accent/15":"hover:bg-muted"}`}><div className="font-semibold">{c.name||c.email||`#${c.id}`}</div><div className="text-xs text-muted-foreground">#{c.id} · {c.status}</div></button>)}</div></aside>
    <section className="flex min-h-[650px] flex-col">{current?<><div className="flex items-center justify-between border-b border-border p-4"><div><div className="font-bold">{current.name||current.email||`#${current.id}`}</div><div className="text-xs text-muted-foreground">{current.email} {current.phone&&`· ${current.phone}`}</div></div><button onClick={toggleClosed} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">{current.status==="CLOSED"?tr("Reopen","Atidaryti","Открыть"):tr("Close","Uždaryti","Закрыть")}</button></div><div className="flex-1 space-y-3 overflow-y-auto bg-background/40 p-4">{messages.map(m=><div key={m.id} className={`flex ${m.sender==="AGENT"?"justify-end":m.sender==="SYSTEM"?"justify-center":"justify-start"}`}><div className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${m.sender==="AGENT"?"bg-accent text-accent-foreground":m.sender==="SYSTEM"?"bg-muted text-muted-foreground":"bg-muted"}`}><div className="whitespace-pre-wrap">{m.message}</div></div></div>)}</div><form onSubmit={send} className="flex gap-2 border-t border-border p-4"><input value={draft} onChange={e=>setDraft(e.target.value)} className="h-12 flex-1 rounded-lg border border-border bg-background px-4" placeholder={tr("Reply…","Atsakyti…","Ответить…")}/><button className="rounded-lg bg-accent px-5 font-bold text-accent-foreground">{tr("Send","Siųsti","Отправить")}</button></form></>:<div className="m-auto text-muted-foreground">{tr("Select a conversation","Pasirinkite pokalbį","Выберите диалог")}</div>}</section>
  </div>:<div className="grid min-h-[600px] overflow-hidden rounded-2xl bg-card ring-1 ring-border lg:grid-cols-[320px_1fr]"><aside className="border-r border-border"><div className="p-4 font-bold">{tr("Requests","Užklausos","Обращения")}</div><div className="max-h-[600px] overflow-y-auto">{tickets.map(ticket=><button key={ticket.id} onClick={()=>setSelectedTicket(ticket.id)} className={`block w-full border-t border-border p-4 text-left ${selectedTicket===ticket.id?"bg-accent/15":"hover:bg-muted"}`}><div className="font-semibold">{ticket.subject}</div><div className="text-xs text-muted-foreground">#{ticket.id} · {ticket.status} · {ticket.name||ticket.email||tr("Guest","Svečias","Гость")}</div></button>)}</div></aside><section className="p-5">{currentTicket?<><div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4"><div><h2 className="text-xl font-bold">{currentTicket.subject}</h2><p className="mt-1 text-sm text-muted-foreground">{currentTicket.category} · #{currentTicket.id}</p><p className="mt-2 text-sm">{currentTicket.name||tr("Guest","Svečias","Гость")} · {currentTicket.email||tr("No email","Nėra el. pašto","Нет e-mail")} {currentTicket.phone&&`· ${currentTicket.phone}`}</p></div><select aria-label={tr("Request status","Užklausos būsena","Статус обращения")} value={currentTicket.status} onChange={e=>void changeTicketStatus(e.target.value as SupportTicket["status"])} className="h-11 rounded-lg border border-border bg-background px-3"><option value="OPEN">OPEN</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="CLOSED">CLOSED</option></select></div><p className="whitespace-pre-wrap py-5">{currentTicket.message}</p><TicketReplies key={currentTicket.id} ticket={currentTicket} onTicket={updated=>setTickets(items=>items.map(ticket=>ticket.id===updated.id?updated:ticket))}/></>:<div className="p-8 text-muted-foreground">{tr("No requests yet","Užklausų dar nėra","Обращений пока нет")}</div>}</section></div>}</main>;
}

function TicketReplies({ ticket, onTicket }: { ticket: SupportTicket; onTicket: (t: SupportTicket) => void }) {
  const { tr } = useLanguage();
  const [replies, setReplies] = useState<SupportTicketReply[]>([]);
  const [draft, setDraft] = useState("");
  const [sendEmail, setSendEmail] = useState(!!ticket.email);
  const [busy, setBusy] = useState(false);
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    listSupportTicketReplies(ticket.id).then(setReplies).catch((e) => setError(e instanceof Error ? e.message : String(e)));
  }, [ticket.id]);

  const emailProblem = (code: SupportReplyEmailError) =>
    code === "MAIL_NOT_CONFIGURED"
      ? tr("Saved, but not e-mailed: the site mailbox (SMTP) is not configured.", "Išsaugota, bet neišsiųsta: svetainės pašto dėžutė (SMTP) nesukonfigūruota.", "Сохранено, но не отправлено: почта сайта (SMTP) не настроена.")
      : code === "NO_CUSTOMER_EMAIL"
        ? tr("Saved, but the customer left no valid e-mail. Contact them by phone.", "Išsaugota, bet klientas nenurodė tinkamo el. pašto. Susisiekite telefonu.", "Сохранено, но у клиента нет корректного e-mail. Свяжитесь по телефону.")
        : tr("Saved, but the e-mail could not be sent. Try again later.", "Išsaugota, bet el. laiško išsiųsti nepavyko. Bandykite vėliau.", "Сохранено, но письмо не отправилось. Попробуйте позже.");

  async function send(e: FormEvent) {
    e.preventDefault();
    const text = draft.trim();
    if (!text) return;
    setBusy(true);
    setError("");
    setNotice("");
    try {
      const r = await replyToSupportTicket(ticket.id, text, sendEmail);
      setReplies((cur) => [...cur, r.reply]);
      setDraft("");
      if (r.ticket) onTicket(r.ticket);
      setNotice(r.emailed ? tr("Reply e-mailed to the customer.", "Atsakymas išsiųstas klientui el. paštu.", "Ответ отправлен клиенту на e-mail.") : r.emailError ? emailProblem(r.emailError) : tr("Internal note saved.", "Vidinė pastaba išsaugota.", "Внутренняя заметка сохранена."));
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="space-y-4">
      {replies.map((r) => (
        <div key={r.id} className="rounded-xl bg-accent/10 p-4 text-sm ring-1 ring-border">
          <div className="mb-1 text-xs text-muted-foreground">
            {r.authorEmail || tr("Support", "Pagalba", "Поддержка")} · {new Date(r.createdAt).toLocaleString()} ·{" "}
            {r.emailed ? tr("e-mailed", "išsiųsta el. paštu", "отправлено на e-mail") : tr("not e-mailed", "neišsiųsta", "не отправлено")}
          </div>
          <div className="whitespace-pre-wrap">{r.message}</div>
        </div>
      ))}
      {error && <div className="rounded-lg bg-red-500/10 p-3 text-sm text-red-500">{error}</div>}
      {notice && <div className="rounded-lg bg-muted p-3 text-sm">{notice}</div>}
      <form onSubmit={send} className="space-y-3">
        <textarea
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          maxLength={5000}
          rows={5}
          className="w-full rounded-lg border border-border bg-background p-3"
          placeholder={tr("Write a reply to the customer…", "Parašykite atsakymą klientui…", "Напишите ответ клиенту…")}
        />
        <div className="flex flex-wrap items-center justify-between gap-3">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={sendEmail} disabled={!ticket.email} onChange={(e) => setSendEmail(e.target.checked)} />
            {ticket.email
              ? tr(`E-mail to ${ticket.email}`, `Siųsti į ${ticket.email}`, `Отправить на ${ticket.email}`)
              : tr("No customer e-mail: saved as an internal note", "Kliento el. pašto nėra: išsaugoma kaip vidinė pastaba", "Нет e-mail клиента: сохранится как заметка")}
          </label>
          <button disabled={busy || !draft.trim()} className="rounded-lg bg-accent px-5 py-3 font-bold text-accent-foreground disabled:opacity-60">
            {busy ? "…" : sendEmail ? tr("Send reply", "Siųsti atsakymą", "Отправить ответ") : tr("Save note", "Išsaugoti pastabą", "Сохранить заметку")}
          </button>
        </div>
      </form>
    </div>
  );
}
