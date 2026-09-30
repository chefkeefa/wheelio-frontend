/* eslint-disable @next/next/no-img-element */
"use client";

import { FormEvent, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { googleLoginUrl, registerUser, requestPhoneCode, verifyPhoneCode, type VerificationChannel } from "@/lib/wheelioApi";

export default function RegisterPage() {
  const { language } = useLanguage();
  const tr = (en:string,lt:string,ru:string)=>language==="LT"?lt:language==="RU"?ru:en;
  const router=useRouter();
  const [form,setForm]=useState({email:"",name:"",surname:"",city:"",address:"",zip:"",phone:"",password:"",confirm:""});
  const [code,setCode]=useState(""); const [token,setToken]=useState(""); const [devCode,setDevCode]=useState("");
  const [message,setMessage]=useState(""); const [error,setError]=useState(""); const [loading,setLoading]=useState(false);
  const set=(key:string,value:string)=>setForm((f)=>({...f,[key]:value}));

  async function send(channel:VerificationChannel){ setError(""); setMessage(""); try{ const r=await requestPhoneCode(form.phone,channel); setDevCode(r.devCode||""); setMessage(channel==="SMS"?tr("Code sent by SMS","Kodas išsiųstas SMS","Код отправлен по SMS"):tr("You will receive a call with the code","Jums paskambins ir pasakys kodą","Вам позвонят и продиктуют код")); }catch(e){setError(e instanceof Error?e.message:String(e));}}
  async function verify(){setError("");try{const r=await verifyPhoneCode(form.phone,code);setToken(r.verificationToken);setMessage(tr("Phone verified ✓","Telefonas patvirtintas ✓","Телефон подтверждён ✓"));}catch(e){setError(e instanceof Error?e.message:String(e));}}

  async function submit(e:FormEvent){e.preventDefault();setError("");if(form.password!==form.confirm){setError(tr("Passwords do not match","Slaptažodžiai nesutampa","Пароли не совпадают"));return;}if(!token){setError(tr("Verify your phone first","Pirmiausia patvirtinkite telefoną","Сначала подтвердите телефон"));return;}setLoading(true);try{await registerUser({email:form.email,name:form.name,surname:form.surname,city:form.city,address:form.address,zip:form.zip,phone:form.phone,verificationToken:token,password:form.password});router.push("/auth/login?registered=1");}catch(e){setError(e instanceof Error?e.message:String(e));}finally{setLoading(false);}}

  const input="h-11 w-full rounded-lg bg-[#cecece] px-3 text-black outline-none focus:ring-2 focus:ring-accent";
  return <main className="min-h-[calc(100svh-86px)] bg-background px-4 py-10 text-foreground page-photo page-photo-auth"><div className="mx-auto max-w-3xl rounded-2xl border-2 border-accent bg-card p-7"><h1 className="mb-6 text-center text-5xl font-bold">{tr("Create account","Sukurti paskyrą","Создать аккаунт")}</h1><form onSubmit={submit} className="grid grid-cols-1 gap-4 md:grid-cols-2">
    <Field label="E-mail"><input className={input} type="email" required value={form.email} onChange={(e)=>set("email",e.target.value)}/></Field>
    <Field label={tr("First name","Vardas","Имя")}><input className={input} required value={form.name} onChange={(e)=>set("name",e.target.value)}/></Field>
    <Field label={tr("Last name","Pavardė","Фамилия")}><input className={input} required value={form.surname} onChange={(e)=>set("surname",e.target.value)}/></Field>
    <Field label={tr("City","Miestas","Город")}><input className={input} required value={form.city} onChange={(e)=>set("city",e.target.value)}/></Field>
    <Field label={tr("Address","Adresas","Адрес")}><input className={input} required value={form.address} onChange={(e)=>set("address",e.target.value)}/></Field>
    <Field label={tr("Post code","Pašto kodas","Почтовый индекс")}><input className={input} required value={form.zip} onChange={(e)=>set("zip",e.target.value)}/></Field>
    <div className="md:col-span-2 rounded-xl bg-muted p-4"><div className="grid gap-3 md:grid-cols-[1fr_auto_auto]"><input className={input} required placeholder="+3706XXXXXXX" value={form.phone} onChange={(e)=>{set("phone",e.target.value);setToken("");}}/><button type="button" onClick={()=>send("SMS")} className="rounded-lg border border-border px-4 font-bold hover:bg-background">SMS</button><button type="button" onClick={()=>send("CALL")} className="rounded-lg border border-border px-4 font-bold hover:bg-background">{tr("Call me","Paskambinti","Позвонить")}</button></div>
      <div className="mt-3 flex gap-2"><input className={input} inputMode="numeric" maxLength={6} placeholder={tr("6-digit code","6 skaitmenų kodas","6-значный код")} value={code} onChange={(e)=>setCode(e.target.value.replace(/\D/g,""))}/><button type="button" onClick={verify} className="rounded-lg bg-[#5f5f5f] px-5 font-bold text-white hover:bg-accent">{tr("Verify","Patvirtinti","Подтвердить")}</button></div>
      {devCode&&<div className="mt-2 text-sm text-amber-600">DEV code: <b>{devCode}</b></div>}{message&&<div className="mt-2 text-sm text-green-600">{message}</div>}</div>
    <Field label={tr("Password","Slaptažodis","Пароль")}><input className={input} type="password" required value={form.password} onChange={(e)=>set("password",e.target.value)}/></Field>
    <Field label={tr("Confirm password","Pakartokite slaptažodį","Повторите пароль")}><input className={input} type="password" required value={form.confirm} onChange={(e)=>set("confirm",e.target.value)}/></Field>
    {error&&<div className="md:col-span-2 rounded-lg bg-red-500/10 p-3 text-red-600">{error}</div>}
    <button disabled={loading||!token} className="md:col-span-2 h-12 rounded-lg bg-[#5f5f5f] font-bold text-white hover:bg-accent disabled:opacity-50">{loading?"…":tr("Create account","Sukurti paskyrą","Создать аккаунт")}</button>
  </form><div className="my-5 flex items-center gap-3"><div className="h-px flex-1 bg-border"/><span className="text-xs font-semibold text-muted-foreground">{tr("or","arba","или")}</span><div className="h-px flex-1 bg-border"/></div><a href={googleLoginUrl()} className="flex h-12 w-full items-center justify-center gap-3 rounded-lg border border-border bg-background font-bold transition hover:bg-muted"><img src="/icons/google.svg" alt="" className="h-6 w-6" />{tr("Continue with Google","Tęsti su Google","Продолжить с Google")}</a><Link href="/auth/login" className="mt-5 block text-center font-semibold hover:text-accent">{tr("Already have an account?","Jau turite paskyrą?","Уже есть аккаунт?")}</Link></div></main>;
}
function Field({label,children}:{label:string;children:React.ReactNode}){return <label className="block"><span className="mb-1 block font-bold">{label}</span>{children}</label>}
