"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  getLiveSupportMessages,
  listSupportConversations,
  liveSupportStreamUrl,
  sendAgentSupportMessage,
  setSupportConversationClosed,
  type LiveSupportConversation,
  type LiveSupportMessage,
} from "@/lib/wheelioApi";
import { useLanguage } from "@/context/LanguageContext";

export default function SupportAgentPage() {
  const { language } = useLanguage();
  const tr = (en:string,lt:string,ru:string)=>language==="LT"?lt:language==="RU"?ru:en;
  const [conversations,setConversations]=useState<LiveSupportConversation[]>([]);
  const [selected,setSelected]=useState<number|null>(null);
  const [messages,setMessages]=useState<LiveSupportMessage[]>([]);
  const [draft,setDraft]=useState("");
  const [error,setError]=useState("");

  async function refresh(){
    try{const r=await listSupportConversations();setConversations(r.content||[]);setSelected(current=>current??(r.content?.[0]?.id??null));}catch(e){setError(e instanceof Error?e.message:String(e));}
  }

  useEffect(()=>{void refresh();const timer=setInterval(()=>void refresh(),10000);return()=>clearInterval(timer);},[]);

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

  async function send(e:FormEvent){e.preventDefault();if(!selected||!draft.trim())return;const text=draft.trim();setDraft("");try{const m=await sendAgentSupportMessage(selected,text);setMessages(cur=>cur.some(x=>x.id===m.id)?cur:[...cur,m]);await refresh();}catch(e){setDraft(text);setError(e instanceof Error?e.message:String(e));}}

  async function toggleClosed(){if(!current)return;try{await setSupportConversationClosed(current.id,current.status!=="CLOSED");await refresh();}catch(e){setError(e instanceof Error?e.message:String(e));}}

  return <main className="container py-8 text-foreground"><h1 className="mb-6 text-4xl font-bold">{tr("Support dashboard","Pagalbos valdymas","Панель поддержки")}</h1>{error&&<div className="mb-4 rounded-lg bg-red-500/10 p-3 text-red-500">{error}</div>}<div className="grid min-h-[650px] overflow-hidden rounded-2xl bg-card ring-1 ring-border lg:grid-cols-[320px_1fr]">
    <aside className="border-r border-border"><div className="p-4 font-bold">{tr("Conversations","Pokalbiai","Диалоги")}</div><div className="max-h-[600px] overflow-y-auto">{conversations.map(c=><button key={c.id} onClick={()=>setSelected(c.id)} className={`block w-full border-t border-border p-4 text-left ${selected===c.id?"bg-accent/15":"hover:bg-muted"}`}><div className="font-semibold">{c.name||c.email||`#${c.id}`}</div><div className="text-xs text-muted-foreground">#{c.id} · {c.status}</div></button>)}</div></aside>
    <section className="flex min-h-[650px] flex-col">{current?<><div className="flex items-center justify-between border-b border-border p-4"><div><div className="font-bold">{current.name||current.email||`#${current.id}`}</div><div className="text-xs text-muted-foreground">{current.email} {current.phone&&`· ${current.phone}`}</div></div><button onClick={toggleClosed} className="rounded-lg border border-border px-3 py-2 text-sm font-semibold hover:bg-muted">{current.status==="CLOSED"?tr("Reopen","Atidaryti","Открыть"):tr("Close","Uždaryti","Закрыть")}</button></div><div className="flex-1 space-y-3 overflow-y-auto bg-background/40 p-4">{messages.map(m=><div key={m.id} className={`flex ${m.sender==="AGENT"?"justify-end":m.sender==="SYSTEM"?"justify-center":"justify-start"}`}><div className={`max-w-[78%] rounded-2xl px-4 py-2 text-sm ${m.sender==="AGENT"?"bg-accent text-black":m.sender==="SYSTEM"?"bg-muted text-muted-foreground":"bg-muted"}`}><div className="whitespace-pre-wrap">{m.message}</div></div></div>)}</div><form onSubmit={send} className="flex gap-2 border-t border-border p-4"><input value={draft} onChange={e=>setDraft(e.target.value)} className="h-12 flex-1 rounded-lg border border-border bg-background px-4" placeholder={tr("Reply…","Atsakyti…","Ответить…")}/><button className="rounded-lg bg-accent px-5 font-bold text-black">{tr("Send","Siųsti","Отправить")}</button></form></>:<div className="m-auto text-muted-foreground">{tr("Select a conversation","Pasirinkite pokalbį","Выберите диалог")}</div>}</section>
  </div></main>;
}
