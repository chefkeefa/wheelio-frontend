"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { me } from "@/lib/pirkApi";
import { takeReturnPath } from "@/lib/safeReturn";
import { loadPhoneVerificationConfig, needsPhone } from "@/lib/usePhoneVerification";
import { useLanguage } from "@/context/LanguageContext";

export default function GoogleSuccessPage() {
  const router = useRouter();
  const { language } = useLanguage();
  const tr = (en:string,lt:string,ru:string)=>language==="LT"?lt:language==="RU"?ru:en;
  const [error,setError]=useState("");

  useEffect(()=>{
    Promise.all([me(),loadPhoneVerificationConfig()]).then(([user,config])=>{
      const target=takeReturnPath("/");
      if(needsPhone(user,config)){
        router.replace(`/verify-phone?return=${encodeURIComponent(target)}`);
      }else{
        router.replace(target);
      }
      router.refresh();
    }).catch(e=>setError(e instanceof Error?e.message:String(e)));
  },[router]);

  return <main className="flex min-h-[60vh] items-center justify-center px-4 text-foreground"><div className="rounded-2xl bg-card p-8 text-center ring-1 ring-border"><h1 className="text-2xl font-bold">{error?tr("Google sign-in failed","Prisijungti su Google nepavyko","Не удалось войти через Google"):tr("Signing you in…","Prisijungiama…","Выполняем вход…")}</h1>{error&&<p className="mt-3 text-red-500">{error}</p>}</div></main>;
}
