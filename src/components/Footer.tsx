/* eslint-disable @next/next/no-img-element */
"use client";
import Link from "next/link";
import { useLanguage } from "@/context/LanguageContext";

const socials = [
  ["instagram", process.env.NEXT_PUBLIC_INSTAGRAM_URL],
  ["youtube", process.env.NEXT_PUBLIC_YOUTUBE_URL],
  ["telegram", process.env.NEXT_PUBLIC_TELEGRAM_URL],
  ["facebook", process.env.NEXT_PUBLIC_FACEBOOK_URL],
] as const;

export default function Footer() {
  const { language } = useLanguage();
  const c = { EN:{about:"About",help:"Help",rules:"Rules",buy:"Buy",sell:"Sell"}, LT:{about:"Apie mus",help:"Pagalba",rules:"Taisyklės",buy:"Pirkti",sell:"Parduoti"}, RU:{about:"О нас",help:"Помощь",rules:"Правила",buy:"Купить",sell:"Продать"} }[language];
  return <footer className="border-t border-black/10 bg-[#0c0d0f] text-white">
    <div className="container flex flex-col gap-7 py-8 md:flex-row md:items-center md:justify-between">
      <Link href="/" aria-label="Wheelio"><img src="/brand/logo.svg" alt="Wheelio" className="h-8 w-auto brightness-0 invert" /></Link>
      <nav className="flex flex-wrap gap-x-6 gap-y-3 text-sm text-white/70">
        <Link href="/">{c.buy}</Link><Link href="/sell">{c.sell}</Link><Link href="/about">{c.about}</Link><Link href="/help">{c.help}</Link><Link href="/rules">{c.rules}</Link>
      </nav>
      <div className="flex gap-2">{socials.filter(([,url])=>Boolean(url)).map(([name,url])=><a key={name} href={url!} target="_blank" rel="noreferrer" aria-label={name} className="grid h-11 w-11 place-items-center rounded-full border border-white/20"><img src={`/icons/${name}.svg`} alt="" className="h-5 w-5 invert" /></a>)}</div>
    </div>
  </footer>;
}
