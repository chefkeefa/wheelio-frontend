"use client";

import Link from "next/link";
import { FormEvent, Suspense, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/http";
import { DSA_NOTICE_CATEGORIES, me, sendDsaNotice, type DsaNoticeCategory } from "@/lib/pirkApi";

const input =
  "h-11 w-full rounded-lg bg-muted px-3 text-foreground ring-1 ring-inset ring-border placeholder:text-muted-foreground outline-none focus:ring-2 focus:ring-accent";

/** Notice of illegal content under the EU Digital Services Act, Art. 16. Works without signing in. */
function ReportInner() {
  const { tr } = useLanguage();
  const params = useSearchParams();
  const listingParam = Number(params.get("listing")) || 0;
  const userParam = Number(params.get("user")) || 0;
  const [url, setUrl] = useState("");
  const [category, setCategory] = useState<DsaNoticeCategory | "">("");
  const [explanation, setExplanation] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [goodFaith, setGoodFaith] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState<number | null>(null);

  useEffect(() => {
    if (listingParam > 0) setUrl(`${window.location.origin}/listing/${listingParam}`);
    else if (userParam > 0) setUrl(`${window.location.origin}/user/${userParam}`);
  }, [listingParam, userParam]);

  useEffect(() => {
    me()
      .then((u) => {
        if (!u) return;
        setName((v) => v || `${u.name || ""} ${u.surname || ""}`.trim());
        setEmail((v) => v || u.email || "");
      })
      .catch(() => undefined);
  }, []);

  const labels: Record<DsaNoticeCategory, string> = {
    SCAM_FRAUD: tr("Scam or fraud", "Sukčiavimas ar apgaulė", "Мошенничество"),
    STOLEN_VEHICLE: tr("Stolen vehicle or forged documents", "Vogtas automobilis ar suklastoti dokumentai", "Угнанный автомобиль или поддельные документы"),
    MISLEADING_INFO: tr("Misleading information (mileage, damage, price)", "Klaidinanti informacija (rida, žala, kaina)", "Вводящая в заблуждение информация (пробег, повреждения, цена)"),
    INTELLECTUAL_PROPERTY: tr("Copyright or trademark (e.g. copied photos)", "Autorių teisės ar prekių ženklai (pvz. nukopijuotos nuotraukos)", "Авторские права или товарный знак (например, чужие фото)"),
    PERSONAL_DATA: tr("Personal data or privacy", "Asmens duomenys ar privatumas", "Персональные данные или приватность"),
    ILLEGAL_GOODS: tr("Illegal goods or services", "Neteisėtos prekės ar paslaugos", "Незаконные товары или услуги"),
    HATE_OR_VIOLENCE: tr("Hate speech, threats or violence", "Neapykantos kalba, grasinimai ar smurtas", "Язык вражды, угрозы или насилие"),
    CHILD_ABUSE: tr("Child sexual abuse material", "Vaikų seksualinio išnaudojimo medžiaga", "Материалы сексуального насилия над детьми"),
    OTHER: tr("Other illegal content", "Kitas neteisėtas turinys", "Другой незаконный контент"),
  };
  const anonymous = category === "CHILD_ABUSE";

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    if (!category) return setError(tr("Choose what is wrong.", "Pasirinkite pažeidimo tipą.", "Выберите тип нарушения."));
    if (!goodFaith) return setError(tr("Please confirm the statement below.", "Patvirtinkite pareiškimą žemiau.", "Подтвердите заявление ниже."));
    setBusy(true);
    setError("");
    try {
      const res = await sendDsaNotice({
        url: url.trim(),
        ...(listingParam > 0 ? { listingId: listingParam } : {}),
        category,
        explanation: explanation.trim(),
        name: name.trim(),
        email: email.trim(),
        goodFaith,
      });
      setSent(res.id);
    } catch (err) {
      if (err instanceof ApiError && err.status === 429)
        setError(tr("Too many reports. Please try again later.", "Per daug pranešimų. Bandykite vėliau.", "Слишком много жалоб. Попробуйте позже."));
      else if (err instanceof ApiError && err.status === 404)
        setError(tr("This listing was not found.", "Skelbimas nerastas.", "Объявление не найдено."));
      else setError(err instanceof Error ? err.message : tr("Could not send.", "Nepavyko išsiųsti.", "Не удалось отправить."));
    } finally {
      setBusy(false);
    }
  };

  if (sent)
    return (
      <div className="text-foreground">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card">
          <h1 className="text-2xl font-extrabold">{tr("Thank you, we received your report", "Ačiū, pranešimą gavome", "Спасибо, жалоба получена")}</h1>
          <p className="mt-3 leading-7 text-muted-foreground">
            {tr(
              `Report #${sent}. A person will review it and we will e-mail you the decision.`,
              `Pranešimas #${sent}. Jį peržiūrės žmogus, o apie sprendimą informuosime el. paštu.`,
              `Жалоба #${sent}. Её рассмотрит человек, а о решении мы сообщим по почте.`
            )}
          </p>
          <Link href="/" className="mt-6 inline-block font-semibold text-accent-ink underline">
            {tr("Back to Wheelio", "Grįžti į Wheelio", "Вернуться на Wheelio")}
          </Link>
        </div>
      </div>
    );

  return (
    <div className="text-foreground">
      <div>
        <h1 className="page-title">{tr("Report illegal content", "Pranešti apie neteisėtą turinį", "Сообщить о незаконном контенте")}</h1>
        <p className="mt-3 leading-7 text-muted-foreground">
          {tr(
            "Use this form to tell us about a listing or other content on Wheelio that you believe is illegal. You do not need an account. A person reviews every report.",
            "Šia forma praneškite apie skelbimą ar kitą Wheelio turinį, kuris, jūsų manymu, yra neteisėtas. Paskyros nereikia. Kiekvieną pranešimą peržiūri žmogus.",
            "Через эту форму сообщите об объявлении или другом контенте на Wheelio, который вы считаете незаконным. Аккаунт не нужен. Каждую жалобу рассматривает человек."
          )}{" "}
          <Link href="/dsa" className="underline">
            {tr("How we handle reports", "Kaip nagrinėjame pranešimus", "Как мы рассматриваем жалобы")}
          </Link>
        </p>

        <form onSubmit={submit} className="mt-8 space-y-5 rounded-2xl border border-border bg-card p-6 shadow-card">
          <label className="block">
            <span className="text-sm font-semibold">{tr("Exact link to the content", "Tiksli turinio nuoroda", "Точная ссылка на контент")} *</span>
            <input className={`${input} mt-2`} value={url} onChange={(e) => setUrl(e.target.value)} required maxLength={500} placeholder="https://wheelio.lt/listing/…" />
          </label>

          <label className="block">
            <span className="text-sm font-semibold">{tr("What is wrong", "Kas negerai", "Что не так")} *</span>
            <select className={`${input} mt-2`} value={category} onChange={(e) => setCategory(e.target.value as DsaNoticeCategory)} required>
              <option value="">{tr("Choose…", "Pasirinkite…", "Выберите…")}</option>
              {DSA_NOTICE_CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {labels[c]}
                </option>
              ))}
            </select>
          </label>

          <label className="block">
            <span className="text-sm font-semibold">{tr("Why is it illegal", "Kodėl tai neteisėta", "Почему это незаконно")} *</span>
            <textarea
              className="mt-2 w-full rounded-lg bg-muted p-3 text-foreground ring-1 ring-inset ring-border outline-none focus:ring-2 focus:ring-accent"
              rows={6}
              minLength={20}
              maxLength={5000}
              required
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder={tr(
                "Describe the facts as precisely as you can, e.g. which law or right is breached and how you know.",
                "Kuo tiksliau aprašykite faktus, pvz. koks įstatymas ar teisė pažeidžiami ir iš kur tai žinote.",
                "Опишите факты как можно точнее: какой закон или право нарушено и откуда вы это знаете."
              )}
            />
          </label>

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="block">
              <span className="text-sm font-semibold">
                {tr("Your name", "Jūsų vardas", "Ваше имя")} {anonymous ? "" : "*"}
              </span>
              <input className={`${input} mt-2`} value={name} onChange={(e) => setName(e.target.value)} required={!anonymous} maxLength={120} autoComplete="name" />
            </label>
            <label className="block">
              <span className="text-sm font-semibold">
                {tr("Your e-mail", "Jūsų el. paštas", "Ваш e-mail")} {anonymous ? "" : "*"}
              </span>
              <input className={`${input} mt-2`} type="email" value={email} onChange={(e) => setEmail(e.target.value)} required={!anonymous} maxLength={190} autoComplete="email" />
            </label>
          </div>
          {anonymous && (
            <p className="text-sm text-muted-foreground">
              {tr(
                "For this kind of content you may report anonymously. Without an e-mail we cannot tell you the decision.",
                "Apie tokį turinį galite pranešti anonimiškai. Be el. pašto negalėsime pranešti apie sprendimą.",
                "О таком контенте можно сообщить анонимно. Без e-mail мы не сможем сообщить о решении."
              )}
            </p>
          )}

          <label className="flex gap-3 text-sm leading-6">
            <input type="checkbox" checked={goodFaith} onChange={(e) => setGoodFaith(e.target.checked)} className="mt-1 h-4 w-4 shrink-0" />
            <span>
              {tr(
                "I confirm in good faith that the information and allegations in this report are accurate and complete.",
                "Sąžiningai patvirtinu, kad šiame pranešime pateikta informacija ir teiginiai yra tikslūs ir išsamūs.",
                "Добросовестно подтверждаю, что информация и утверждения в этой жалобе точны и полны."
              )}
            </span>
          </label>

          <p className="text-xs leading-5 text-muted-foreground">
            {tr(
              "We use your name and e-mail only to handle this report and do not show them to the seller. Knowingly false reports are not allowed.",
              "Jūsų vardą ir el. paštą naudojame tik šiam pranešimui nagrinėti ir pardavėjui jų nerodome. Sąmoningai melagingi pranešimai draudžiami.",
              "Ваше имя и e-mail мы используем только для рассмотрения жалобы и не показываем продавцу. Заведомо ложные жалобы запрещены."
            )}
          </p>

          {error && <p className="text-sm text-red-600">{error}</p>}
          <button disabled={busy} className="h-12 w-full rounded-lg bg-accent font-bold text-accent-foreground disabled:opacity-60">
            {busy ? "…" : tr("Send report", "Siųsti pranešimą", "Отправить жалобу")}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <ReportInner />
    </Suspense>
  );
}
