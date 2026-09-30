"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getLiveSupportMessages,
  listSupportConversations,
  listSupportTickets,
  liveSupportStreamUrl,
  sendAgentSupportMessage,
  setSupportConversationClosed,
  setSupportTicketStatus,
  type LiveSupportConversation,
  type LiveSupportMessage,
  type SupportTicket,
} from "@/lib/pirkApi";
import { useLanguage } from "@/context/LanguageContext";

export default function SupportAgentPage() {
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
    let source:EventSource|null=null;
    getLiveSupportMessages(selected).then(setMessages).catch(e=>setError(e instanceof Error?e.message:String(e)));
    source=new EventSource(liveSupportStreamUrl(selected),{withCredentials:true});
    const handler=(event:MessageEvent)=>{try{const m=JSON.parse(event.data) as LiveSupportMessage;setMessages(cur=>cur.some(x=>x.id===m.id)?cur:[...cur,m]);}catch{}};
    source.addEventListener("message",handler as EventListener);
    return()=>{source?.removeEventListener("message",handler as EventListener);source?.close();};
  },[selected]);

  const current=useMemo(()=>conversations.find(c=>c.id===selected)||null,[conversations,selected]);
  const currentTicket=useMemo(()=>tickets.find(t=>t.id===selectedTicket)||null,[tickets,selectedTicket]);

  async function send(e:FormEvent){e.preventDefault();if(!selected||!draft.trim())return;const text=draft.trim();setDraft("");try{const m=await sendAgentSupportMessage(selected,text);setMessages(cur=>cur.some(x=>x.id===m.id)?cur:[...cur,m]);await refresh();}catch(e){setDraft(text);setError(e instanceof Error?e.message:String(e));}}

  async function toggleClosed(){if(!current)return;try{await setSupportConversationClosed(current.id,current.status!=="CLOSED");await refresh();}catch(e){setError(e instanceof Error?e.message:String(e));}}
  async function changeTicketStatus(status:SupportTicket["status"]){if(!currentTicket)return;try{const updated=await setSupportTicketStatus(currentTicket.id,status);setTickets(items=>items.map(ticket=>ticket.id===updated.id?updated:ticket));}catch(e){setError(e instanceof Error?e.message:String(e));}}

  return <main className="container py-8 text-foreground"><h1 className="mb-6 text-4xl font-bold">{tr("Support dashboard","Pagalbos valdymas","Панель поддержки")}</h1>{error&&<div className="mb-4 rounded-lg bg-red-500/10 p-3 text-red-500">{error}</div>}<div className="mb-4 flex gap-2"><button onClick={()=>setView("chat")} className={`rounded-xl px-4 py-3 font-bold ${view==="chat"?"bg-accent text-black":"bg-card ring-1 ring-border"}`}>{tr("Live chats","Pokalbiai gyvai","Онлайн-чаты")} ({conversations.length})</button><button onClick={()=>setView("tickets")} className={`rounded-xl px-4 py-3 font-bold ${view==="tickets"?"bg-accent text-black":"bg-card ring-1 ring-border"}`}>{tr("Support requests","Užklausos","Обращения")} ({tickets.length})</button></div>{view==="chat"?<div className="grid min-h-[650px] overflow-hidden rounded-2xl bg-card ring-1 ring-border lg:grid-cols-[320px_1fr]">
    <aside className="border-r border-border"><div className="p-4 font-bold">{tr("Conversations","Pokalbiai","Диалоги")}</div><div className="max-h-[600px] overflow-y-auto">{conversations.map(c=><button key={c.id} onClick={()=>setSelected(c.id)} className={`block w-full border-t border-border p-4 text-left ${selected===c.id?"bg-accent/15":"hover:bg-muted"}`}><div className="font-semibold">{c.name||c.email||`#${c.id}`}</div><div className="text-xs text-muted-foreground">#{c.id} · {c.status}</div></button>)}</div></aside>
    <section className="flex min-h-[650px] flex-col">{current?<><div className="flex items-center justify-between border-b border-border p-4"><div><div className="font-bold">{current.name||current.email||`#${current.id}`}</div><div className="text-xs text-muted-foreground">{current.email} {current.phone&&`· ${current.phone}`}</div></div><button onClick={toggleClosed} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">{current.status==="CLOSED"?tr("Reopen","Atidaryti","Открыть"):tr("Close","Uždaryti","Закрыть")}</button></div><div className="flex-1 space-y-3 overflow-y-auto bg-background/40 p-4">{messages.map(m=><div key={m.id} className={`flex ${m.sender==="AGENT"?"justify-end":m.sender==="SYSTEM"?"justify-center":"justify-start"}`}><div className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${m.sender==="AGENT"?"bg-accent text-black":m.sender==="SYSTEM"?"bg-muted text-muted-foreground":"bg-muted"}`}><div className="whitespace-pre-wrap">{m.message}</div></div></div>)}</div><form onSubmit={send} className="flex gap-2 border-t border-border p-4"><input value={draft} onChange={e=>setDraft(e.target.value)} className="h-12 flex-1 rounded-lg border border-border bg-background px-4" placeholder={tr("Reply…","Atsakyti…","Ответить…")}/><button className="rounded-lg bg-accent px-5 font-bold text-black">{tr("Send","Siųsti","Отправить")}</button></form></>:<div className="m-auto text-muted-foreground">{tr("Select a conversation","Pasirinkite pokalbį","Выберите диалог")}</div>}</section>
  </div>:<div className="grid min-h-[600px] overflow-hidden rounded-2xl bg-card ring-1 ring-border lg:grid-cols-[320px_1fr]"><aside className="border-r border-border"><div className="p-4 font-bold">{tr("Requests","Užklausos","Обращения")}</div><div className="max-h-[600px] overflow-y-auto">{tickets.map(ticket=><button key={ticket.id} onClick={()=>setSelectedTicket(ticket.id)} className={`block w-full border-t border-border p-4 text-left ${selectedTicket===ticket.id?"bg-accent/15":"hover:bg-muted"}`}><div className="font-semibold">{ticket.subject}</div><div className="text-xs text-muted-foreground">#{ticket.id} · {ticket.status} · {ticket.name||ticket.email||tr("Guest","Svečias","Гость")}</div></button>)}</div></aside><section className="p-5">{currentTicket?<><div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-4"><div><h2 className="text-xl font-bold">{currentTicket.subject}</h2><p className="mt-1 text-sm text-muted-foreground">{currentTicket.category} · #{currentTicket.id}</p><p className="mt-2 text-sm">{currentTicket.name||tr("Guest","Svečias","Гость")} · {currentTicket.email||tr("No email","Nėra el. pašto","Нет e-mail")} {currentTicket.phone&&`· ${currentTicket.phone}`}</p></div><select aria-label={tr("Request status","Užklausos būsena","Статус обращения")} value={currentTicket.status} onChange={e=>void changeTicketStatus(e.target.value as SupportTicket["status"])} className="h-11 rounded-lg border border-border bg-background px-3"><option value="OPEN">OPEN</option><option value="IN_PROGRESS">IN_PROGRESS</option><option value="CLOSED">CLOSED</option></select></div><p className="whitespace-pre-wrap py-5">{currentTicket.message}</p><div className="rounded-xl bg-muted p-4 text-sm text-muted-foreground">{tr("Reply to the customer using the email or phone above. Replies are not sent automatically from Wheelio yet.","Atsakykite klientui aukščiau nurodytu el. paštu arba telefonu. Atsakymai dar nesiunčiami automatiškai iš Wheelio.","Ответьте клиенту по указанным выше почте или телефону. Wheelio пока не отправляет ответы автоматически.")}</div></>:<div className="p-8 text-muted-foreground">{tr("No requests yet","Užklausų dar nėra","Обращений пока нет")}</div>}</section></div>}</main>;
}
