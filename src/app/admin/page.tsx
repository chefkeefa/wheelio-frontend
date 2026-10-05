"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/http";
import {
  ADMIN_LISTING_STATUSES,
  getAdminStats,
  getAdminConfigDiagnostics,
  getAdminRecentErrors,
  applyMigrations,
  runBackup,
  type AdminConfigDiagnostics,
  type AdminRecentErrors,
  type ModerationFlag,
  type ModerationSignals,
  isAdminUser,
  listAdminComplaints,
  listDsaNotices,
  decideDsaNotice,
  type DsaNotice,
  listAdminListings,
  listAdminUsers,
  me,
  setAdminListingStatus,
  setComplaintStatus,
  setUserDisabled,
  eraseUser,
  setUserSupportRole,
  type AdminComplaint,
  type AdminListing,
  type AdminStats,
  type AdminUser,
  type Paged,
} from "@/lib/pirkApi";
import AssetIcon from "@/components/ui/AssetIcon";

type Tab = "listings" | "dsa" | "complaints" | "users" | "diagnostics";
const PAGE_SIZE = 50;

export default function AdminPage() {
  const { tr } = useLanguage();
  const router = useRouter();
  const [allowed, setAllowed] = useState<boolean | null>(null);
  const [tab, setTab] = useState<Tab>("listings");
  const [page, setPage] = useState(0);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [listings, setListings] = useState<Paged<AdminListing> | null>(null);
  const [complaints, setComplaints] = useState<Paged<AdminComplaint> | null>(null);
  const [dsaNotices, setDsaNotices] = useState<Paged<DsaNotice> | null>(null);
  const [users, setUsers] = useState<Paged<AdminUser> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [diagnostics, setDiagnostics] = useState<AdminConfigDiagnostics | null>(null);
  const [recentErrors, setRecentErrors] = useState<AdminRecentErrors | null>(null);
  const [statusFilter, setStatusFilter] = useState("");
  const [notice, setNotice] = useState("");

  useEffect(() => {
    me()
      .then((u) => setAllowed(isAdminUser(u)))
      .catch((e) => {
        if (e instanceof ApiError && e.status === 401) router.replace("/auth/login?return=/admin");
        else setAllowed(false);
      });
  }, [router]);

  const load = useCallback(async () => {
    setBusy(true);
    setError("");
    try {
      setStats(await getAdminStats());
      if (tab === "listings") setListings(await listAdminListings(page, PAGE_SIZE, statusFilter));
      if (tab === "complaints") setComplaints(await listAdminComplaints(page, PAGE_SIZE));
      if (tab === "dsa") setDsaNotices(await listDsaNotices(page, PAGE_SIZE));
      if (tab === "users") setUsers(await listAdminUsers(page, PAGE_SIZE));
      if (tab === "diagnostics") {
        setDiagnostics(await getAdminConfigDiagnostics().catch(() => null));
        setRecentErrors(await getAdminRecentErrors().catch(() => null));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }, [tab, page, statusFilter]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  // Older backends have no diagnostics endpoint: the warning block is simply not shown.
  useEffect(() => {
    if (allowed) getAdminConfigDiagnostics().then(setDiagnostics).catch(() => setDiagnostics(null));
  }, [allowed]);

  const run = async (action: () => Promise<unknown>, done?: string) => {
    setBusy(true);
    setError("");
    setNotice("");
    try {
      await action();
      if (done) setNotice(done);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setBusy(false);
    }
  };

  /**
   * DSA Art. 17: every rejection, takedown or block is e-mailed to the user with a reason.
   * Returns null when the admin cancels.
   */
  const askReason = (what: string) => {
    const reason = window.prompt(
      `${what}\n\n${tr(
        "Reason for the user (facts and which rule is broken). It is e-mailed to them.",
        "Priežastis naudotojui (faktai ir kuri taisyklė pažeista). Ji bus išsiųsta el. paštu.",
        "Причина для пользователя (факты и какое правило нарушено). Она будет отправлена по e-mail."
      )}`
    );
    if (reason === null) return null;
    return reason.trim();
  };
  const rejectListing = (id: number) => {
    const reason = askReason(tr("Reject this listing?", "Atmesti šį skelbimą?", "Отклонить объявление?"));
    if (reason !== null) run(() => setAdminListingStatus(id, "REJECTED", reason));
  };
  const decideNotice = (n: DsaNotice, action: "REMOVE" | "NO_ACTION", ground: "TERMS" | "ILLEGAL" = "TERMS") => {
    const what =
      action === "NO_ACTION"
        ? tr("Keep the content (no violation)?", "Palikti turinį (pažeidimo nėra)?", "Оставить контент (нарушения нет)?")
        : ground === "ILLEGAL"
          ? tr("Take the listing down as illegal?", "Pašalinti skelbimą kaip neteisėtą?", "Снять объявление как незаконное?")
          : tr("Take the listing down for breaking the rules?", "Pašalinti skelbimą dėl taisyklių pažeidimo?", "Снять объявление за нарушение правил?");
    const reason = window.prompt(
      `${what}\n\n${tr(
        "Explanation (at least 10 characters). The reporter and, if removed, the seller receive it by e-mail.",
        "Paaiškinimas (ne trumpesnis nei 10 simbolių). Jį el. paštu gaus pranešėjas, o pašalinus ir pardavėjas.",
        "Пояснение (не короче 10 символов). Его получит заявитель, а при снятии и продавец."
      )}`
    );
    if (reason === null) return;
    run(() => decideDsaNotice(n.id, action, reason.trim(), ground));
  };

  if (allowed === null) return <main className="container mx-auto min-h-[60vh] px-4 py-10">…</main>;
  if (!allowed)
    return (
      <main className="container mx-auto min-h-[60vh] px-4 py-10">
        <h1 className="text-3xl font-extrabold">{tr("Access denied", "Prieiga uždrausta", "Доступ запрещён")}</h1>
        <p className="mt-2 text-muted-foreground">{tr("This page is for administrators.", "Šis puslapis skirtas administratoriams.", "Эта страница только для администраторов.")}</p>
      </main>
    );

  const current = tab === "listings" ? listings : tab === "dsa" ? dsaNotices : tab === "complaints" ? complaints : tab === "users" ? users : null;
  const tabs: [Tab, string][] = [
    ["listings", tr("Listings", "Skelbimai", "Объявления")],
    ["dsa", tr("Illegal content reports", "Pranešimai (SPA)", "Жалобы (DSA)")],
    ["complaints", tr("Complaints", "Skundai", "Жалобы")],
    ["users", tr("Users", "Naudotojai", "Пользователи")],
    ["diagnostics", tr("Diagnostics", "Diagnostika", "Диагностика")],
  ];

  return (
    <main className="min-h-[70vh] bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-extrabold">{tr("Administration", "Administravimas", "Администрирование")}</h1>
          <Link href="/admin/support" className="rounded-lg border border-border px-4 py-2 font-semibold hover:border-accent">{tr("Support desk", "Pagalbos centras", "Поддержка")}</Link>
        </div>

        {diagnostics && diagnostics.warnings.length > 0 && (
          <div className="mt-6 rounded-xl border border-amber-500/40 bg-amber-500/10 p-4" role="status">
            <div className="font-bold text-amber-700 dark:text-amber-400">
              {tr("Site protection settings need attention", "Svetainės apsaugos nustatymus reikia patikrinti", "Проверьте настройки защиты сайта")}
            </div>
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {diagnostics.warnings.map((w) => (
                <li key={w}>{w}</li>
              ))}
            </ul>
          </div>
        )}

        {stats && (
          <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
            <Stat label={tr("Users", "Naudotojai", "Пользователи")} value={stats.users} />
            <Stat label={tr("Listings", "Skelbimai", "Объявления")} value={stats.listings} />
            <Stat label={tr("Payments", "Mokėjimai", "Платежи")} value={stats.payments} />
            <Stat label={tr("Open tickets", "Atviros užklausos", "Открытые обращения")} value={stats.openTickets} />
          </div>
        )}

        <div className="mt-8 flex gap-2 border-b border-border">
          {tabs.map(([key, label]) => (
            <button
              key={key}
              onClick={() => { setTab(key); setPage(0); }}
              className={`-mb-px border-b-2 px-4 py-2 font-semibold ${tab === key ? "border-accent text-foreground" : "border-transparent text-muted-foreground"}`}
            >
              {label}
            </button>
          ))}
        </div>

        {error && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-500">{error}</div>}
        {notice && <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-emerald-700 dark:text-emerald-400">{notice}</div>}

        {tab === "listings" && (
          <label className="mt-4 flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">{tr("Show", "Rodyti", "Показать")}</span>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="rounded border border-border bg-background px-2 py-1"
            >
              <option value="">{tr("All listings", "Visi skelbimai", "Все объявления")}</option>
              <option value="PENDING_REVIEW">{tr("Waiting for review", "Laukia patikros", "Ждут проверки")}</option>
              {ADMIN_LISTING_STATUSES.filter((x) => x !== "PENDING_REVIEW").map((x) => <option key={x} value={x}>{x}</option>)}
            </select>
          </label>
        )}

        <div className={`mt-4 overflow-x-auto ${busy ? "opacity-60" : ""}`}>
          {tab === "listings" && listings && (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="p-2">ID</th><th className="p-2">{tr("Car", "Automobilis", "Авто")}</th><th className="p-2">{tr("Seller", "Pardavėjas", "Продавец")}</th><th className="p-2">{tr("Price", "Kaina", "Цена")}</th><th className="p-2">{tr("Checks", "Patikra", "Проверка")}</th><th className="p-2">{tr("Status", "Būsena", "Статус")}</th></tr></thead>
              <tbody>
                {listings.content.length === 0 && (
                  <tr><td colSpan={6} className="p-4 text-muted-foreground">{tr("Nothing here.", "Nieko nėra.", "Здесь пусто.")}</td></tr>
                )}
                {listings.content.map((l) => (
                  <tr key={l.id} className="border-t border-border align-top">
                    <td className="p-2"><Link href={`/listing/${l.id}`} className="underline">{l.id}</Link></td>
                    <td className="p-2">{[l.car?.mark?.name, l.car?.model?.name].filter(Boolean).join(" ") || "—"}</td>
                    <td className="p-2">{l.user ? `${l.user.name || ""} ${l.user.surname || ""}`.trim() || `#${l.user.id}` : "—"}</td>
                    <td className="p-2">{l.price} €</td>
                    <td className="p-2"><ModerationCell m={l.moderation} /></td>
                    <td className="p-2">
                      {l.status === "PENDING_REVIEW" && (
                        <div className="mb-2 flex gap-2">
                          <button disabled={busy} onClick={() => run(() => setAdminListingStatus(l.id, "ACTIVE"))} className="rounded bg-emerald-600 px-3 py-1 font-semibold text-white">
                            {tr("Approve", "Patvirtinti", "Одобрить")}
                          </button>
                          <button
                            disabled={busy}
                            onClick={() => rejectListing(l.id)}
                            className="rounded border border-red-500/50 px-3 py-1 font-semibold text-red-600"
                          >
                            {tr("Reject", "Atmesti", "Отклонить")}
                          </button>
                        </div>
                      )}
                      <select
                        value={l.status}
                        disabled={busy}
                        onChange={(e) => (e.target.value === "REJECTED" ? rejectListing(l.id) : run(() => setAdminListingStatus(l.id, e.target.value)))}
                        className="rounded border border-border bg-background px-2 py-1"
                      >
                        {ADMIN_LISTING_STATUSES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "dsa" && dsaNotices && (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="p-2">ID</th><th className="p-2">{tr("Content", "Turinys", "Контент")}</th><th className="p-2">{tr("Reporter", "Pranešėjas", "Заявитель")}</th><th className="p-2">{tr("Explanation", "Paaiškinimas", "Пояснение")}</th><th className="p-2">{tr("Decision", "Sprendimas", "Решение")}</th></tr></thead>
              <tbody>
                {dsaNotices.content.length === 0 && (
                  <tr><td colSpan={5} className="p-4 text-muted-foreground">{tr("No reports.", "Pranešimų nėra.", "Жалоб нет.")}</td></tr>
                )}
                {dsaNotices.content.map((n) => (
                  <tr key={n.id} className="border-t border-border align-top">
                    <td className="p-2">{n.id}<div className="text-xs text-muted-foreground">{new Date(n.createdAt).toLocaleString()}</div></td>
                    <td className="p-2">
                      {n.listingId ? <Link href={`/listing/${n.listingId}`} className="underline">{tr("Listing", "Skelbimas", "Объявление")} #{n.listingId}</Link> : <span className="break-all">{n.contentUrl}</span>}
                      <div className="text-xs font-semibold">{n.category}</div>
                    </td>
                    <td className="p-2">{n.reporterName || "—"}<div className="text-xs text-muted-foreground">{n.reporterEmail || tr("anonymous", "anonimiškai", "анонимно")}</div></td>
                    <td className="max-w-md whitespace-pre-line p-2">{n.explanation}</td>
                    <td className="p-2">
                      {n.status === "RECEIVED" ? (
                        <div className="flex flex-col gap-2">
                          {n.listingId && (
                            <>
                              <button disabled={busy} onClick={() => decideNotice(n, "REMOVE", "TERMS")} className="rounded border border-red-500/50 px-3 py-1 font-semibold text-red-600">
                                {tr("Remove: breaks rules", "Pašalinti: pažeidžia taisykles", "Снять: нарушает правила")}
                              </button>
                              <button disabled={busy} onClick={() => decideNotice(n, "REMOVE", "ILLEGAL")} className="rounded border border-red-500/50 px-3 py-1 font-semibold text-red-600">
                                {tr("Remove: illegal", "Pašalinti: neteisėta", "Снять: незаконно")}
                              </button>
                            </>
                          )}
                          <button disabled={busy} onClick={() => decideNotice(n, "NO_ACTION")} className="rounded border border-border px-3 py-1 font-semibold">
                            {tr("No action", "Nesiimti veiksmų", "Без действий")}
                          </button>
                        </div>
                      ) : (
                        <div>
                          <span className={`font-semibold ${n.status === "ACTION_TAKEN" ? "text-red-600" : "text-muted-foreground"}`}>
                            {n.status === "ACTION_TAKEN" ? tr("Removed", "Pašalinta", "Снято") : tr("No action", "Veiksmų nesiimta", "Без действий")}
                          </span>
                          {n.decisionNote && <div className="mt-1 max-w-xs whitespace-pre-line text-xs text-muted-foreground">{n.decisionNote}</div>}
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "complaints" && complaints && (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="p-2">ID</th><th className="p-2">{tr("Target", "Objektas", "Объект")}</th><th className="p-2">{tr("From", "Nuo", "От")}</th><th className="p-2">{tr("Text", "Tekstas", "Текст")}</th><th className="p-2">{tr("Status", "Būsena", "Статус")}</th></tr></thead>
              <tbody>
                {complaints.content.map((c) => (
                  <tr key={c.id} className="border-t border-border align-top">
                    <td className="p-2">{c.id}</td>
                    <td className="p-2">
                      {c.listingTargetId ? <Link href={`/listing/${c.listingTargetId}`} className="underline">{tr("Listing", "Skelbimas", "Объявление")} #{c.listingTargetId}</Link> : c.userTargetId ? `${tr("User", "Naudotojas", "Пользователь")} #${c.userTargetId}` : "—"}
                    </td>
                    <td className="p-2">{c.userEmail || `#${c.userId}`}</td>
                    <td className="max-w-md whitespace-pre-line p-2">{c.description}</td>
                    <td className="p-2">
                      <select
                        value={c.status}
                        disabled={busy}
                        onChange={(e) => run(() => setComplaintStatus(c.id, e.target.value as "WAITING" | "DENIED" | "ACCEPTED"))}
                        className="rounded border border-border bg-background px-2 py-1"
                      >
                        <option value="WAITING">{tr("Waiting", "Laukia", "Ожидает")}</option>
                        <option value="ACCEPTED">{tr("Accepted", "Priimta", "Принята")}</option>
                        <option value="DENIED">{tr("Denied", "Atmesta", "Отклонена")}</option>
                      </select>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}

          {tab === "users" && users && (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="p-2">ID</th><th className="p-2">E-mail</th><th className="p-2">{tr("Name", "Vardas", "Имя")}</th><th className="p-2">{tr("Phone", "Telefonas", "Телефон")}</th><th className="p-2"></th></tr></thead>
              <tbody>
                {users.content.map((u) => (
                  <tr key={u.id} className="border-t border-border">
                    <td className="p-2">{u.id}</td>
                    <td className="p-2">{u.email}</td>
                    <td className="p-2">{`${u.name || ""} ${u.surname || ""}`.trim() || "—"}</td>
                    <td className="p-2">{u.phone || "—"}{u.phone && Number(u.phoneVerified) ? <AssetIcon name="check" size={14} className="ml-1 text-emerald-600" /> : null}</td>
                    <td className="p-2">
                      <button
                        disabled={busy}
                        onClick={() => {
                          const disable = !Number(u.disabled);
                          const q = disable
                            ? tr(
                                "Block this user? Their listings will be taken down and they will be signed out. Unblocking brings the listings back.",
                                "Užblokuoti naudotoją? Jo skelbimai bus pašalinti, o jis atjungtas. Atblokavus skelbimai grįš.",
                                "Заблокировать пользователя? Его объявления будут сняты, а сессии завершены. После разблокировки объявления вернутся."
                              )
                            : tr("Unblock this user?", "Atblokuoti naudotoją?", "Разблокировать пользователя?");
                          if (!disable) {
                            if (window.confirm(q)) run(() => setUserDisabled(u.id, false));
                            return;
                          }
                          const reason = askReason(q);
                          if (reason !== null) run(() => setUserDisabled(u.id, true, reason));
                        }}
                        className="rounded border border-border px-3 py-1 font-semibold"
                      >
                        {Number(u.disabled) ? tr("Unblock", "Atblokuoti", "Разблокировать") : tr("Block", "Blokuoti", "Заблокировать")}
                      </button>
                      {(() => {
                        const support = !!u.roles?.some((r) => r.toUpperCase() === "SUPPORT");
                        return (
                          <button
                            disabled={busy}
                            title={tr("Access to the support desk without admin rights", "Prieiga prie pagalbos centro be administratoriaus teisių", "Доступ к панели поддержки без прав администратора")}
                            onClick={() => {
                              const q = support
                                ? tr("Remove support desk access?", "Atimti prieigą prie pagalbos centro?", "Убрать доступ к поддержке?")
                                : tr("Give this user support desk access?", "Suteikti prieigą prie pagalbos centro?", "Дать доступ к панели поддержки?");
                              if (window.confirm(q)) run(() => setUserSupportRole(u.id, !support));
                            }}
                            className={`ml-2 rounded border px-3 py-1 font-semibold ${support ? "border-accent bg-accent/15" : "border-border"}`}
                          >
                            {support ? tr("Support ✓", "Pagalba ✓", "Поддержка ✓") : tr("Make support", "Skirti pagalbai", "Сделать поддержкой")}
                          </button>
                        );
                      })()}
                      {!String(u.email || "").endsWith("@deleted.invalid") && (
                        <button
                          disabled={busy}
                          title={tr("GDPR request: delete personal data and listings", "BDAR prašymas: ištrinti asmens duomenis ir skelbimus", "Запрос по GDPR: удалить личные данные и объявления")}
                          onClick={() => {
                            const typed = window.prompt(
                              tr(
                                `This permanently deletes the personal data and listings of ${u.email}. Type the e-mail to confirm.`,
                                `Tai negrįžtamai ištrins ${u.email} asmens duomenis ir skelbimus. Įveskite el. paštą patvirtinimui.`,
                                `Это навсегда удалит личные данные и объявления ${u.email}. Введите e-mail для подтверждения.`
                              )
                            );
                            if (typed !== null && typed.trim().toLowerCase() === String(u.email).toLowerCase()) run(() => eraseUser(u.id));
                          }}
                          className="ml-2 rounded border border-red-500/50 px-3 py-1 font-semibold text-red-600"
                        >
                          {tr("Erase data", "Ištrinti duomenis", "Удалить данные")}
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {tab === "diagnostics" && (
          <DiagnosticsPanel
            diagnostics={diagnostics}
            errors={recentErrors}
            busy={busy}
            onApplyMigrations={() =>
              run(async () => {
                const r = await applyMigrations();
                if (r.failed) throw new Error(r.failed);
              }, tr("Migrations applied.", "Migracijos pritaikytos.", "Миграции применены."))
            }
            onBackup={() =>
              run(() => runBackup(), tr("Backup created.", "Atsarginė kopija sukurta.", "Резервная копия создана."))
            }
          />
        )}

        {current && tab !== "diagnostics" && current.totalPages > 1 && (
          <div className="mt-4 flex items-center gap-3">
            <button disabled={page === 0 || busy} onClick={() => setPage(page - 1)} aria-label="Previous page" className="rounded border border-border px-3 py-1 disabled:opacity-40"><AssetIcon name="chevron-left" size={16} /></button>
            <span className="text-sm">{page + 1} / {current.totalPages}</span>
            <button disabled={page + 1 >= current.totalPages || busy} onClick={() => setPage(page + 1)} aria-label="Next page" className="rounded border border-border px-3 py-1 disabled:opacity-40"><AssetIcon name="chevron-right" size={16} /></button>
          </div>
        )}
      </div>
    </main>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-xl bg-card p-4 ring-1 ring-border">
      <div className="text-xs text-muted-foreground">{label}</div>
      <div className="mt-1 text-2xl font-extrabold">{value}</div>
    </div>
  );
}

const FLAG_LABELS: Record<ModerationFlag, [string, string, string]> = {
  NEW_ACCOUNT: ["New account", "Nauja paskyra", "Новый аккаунт"],
  EMAIL_NOT_VERIFIED: ["E-mail not confirmed", "El. paštas nepatvirtintas", "E-mail не подтверждён"],
  PHONE_NOT_VERIFIED: ["Phone not confirmed", "Telefonas nepatvirtintas", "Телефон не подтверждён"],
  PHONE_SHARED: ["Phone used by another account", "Telefonas naudojamas kitoje paskyroje", "Телефон есть у другого аккаунта"],
  PREVIOUSLY_REJECTED: ["Had rejected listings", "Buvo atmestų skelbimų", "Были отклонённые объявления"],
  OPEN_COMPLAINTS: ["Open complaints", "Neišspręsti skundai", "Открытые жалобы"],
  NO_PHOTOS: ["No photos", "Nėra nuotraukų", "Нет фото"],
  CONTACTS_IN_TEXT: ["Contacts or links in text", "Kontaktai ar nuorodos tekste", "Контакты или ссылки в тексте"],
  MANY_NEW_LISTINGS: ["Many listings in a day", "Daug skelbimų per dieną", "Много объявлений за день"],
  OWNER_BLOCKED: ["Seller blocked", "Pardavėjas užblokuotas", "Продавец заблокирован"],
};

function ModerationCell({ m }: { m?: ModerationSignals | null }) {
  const { tr } = useLanguage();
  if (!m) return <span className="text-muted-foreground">—</span>;
  const age =
    m.accountAgeDays === null
      ? null
      : m.accountAgeDays === 0
        ? tr("registered today", "užsiregistravo šiandien", "зарегистрирован сегодня")
        : tr(`account ${m.accountAgeDays} d.`, `paskyrai ${m.accountAgeDays} d.`, `аккаунту ${m.accountAgeDays} дн.`);
  return (
    <div className="min-w-[180px] space-y-1">
      {m.flags.length === 0 ? (
        <span className="inline-flex items-center gap-1 text-emerald-700 dark:text-emerald-400">
          <AssetIcon name="check" size={14} />
          {tr("No warning signs", "Įspėjimų nėra", "Тревожных признаков нет")}
        </span>
      ) : (
        <div className="flex flex-wrap gap-1">
          {m.flags.map((f) => (
            <span key={f} className="rounded bg-amber-500/15 px-1.5 py-0.5 text-xs font-semibold text-amber-800 dark:text-amber-300">
              {FLAG_LABELS[f] ? tr(...FLAG_LABELS[f]) : f}
            </span>
          ))}
        </div>
      )}
      <div className="text-xs text-muted-foreground">
        {[m.ownerEmail, age, tr(`${m.photos} photos`, `${m.photos} nuotr.`, `${m.photos} фото`), tr(`${m.ownerListings} listings`, `${m.ownerListings} skelb.`, `${m.ownerListings} объявл.`)]
          .filter(Boolean)
          .join(" · ")}
      </div>
    </div>
  );
}

function formatSize(bytes: number) {
  return bytes >= 1024 * 1024 ? `${(bytes / 1024 / 1024).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

function DiagnosticsPanel({
  diagnostics,
  errors,
  busy,
  onApplyMigrations,
  onBackup,
}: {
  diagnostics: AdminConfigDiagnostics | null;
  errors: AdminRecentErrors | null;
  busy: boolean;
  onApplyMigrations: () => void;
  onBackup: () => void;
}) {
  const { tr } = useLanguage();
  if (!diagnostics) return <p className="mt-4 text-muted-foreground">{tr("Diagnostics are not available on this API version.", "Šioje API versijoje diagnostikos nėra.", "В этой версии API нет диагностики.")}</p>;
  const schema = diagnostics.schema;
  const backups = diagnostics.backups;
  const yesNo = (v: boolean) => (v ? tr("on", "įjungta", "вкл.") : tr("off", "išjungta", "выкл."));
  return (
    <div className="mt-4 grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl bg-card p-4 ring-1 ring-border">
        <h2 className="text-lg font-bold">{tr("Protection", "Apsauga", "Защита")}</h2>
        <ul className="mt-2 space-y-1 text-sm">
          <li>{tr("Listing moderation", "Skelbimų moderavimas", "Модерация объявлений")}: <b>{yesNo(diagnostics.listingModeration)}</b></li>
          <li>{tr("E-mail confirmation", "El. pašto patvirtinimas", "Подтверждение e-mail")}: <b>{yesNo(diagnostics.emailVerification.enabled)}</b></li>
          <li>{tr("SMS phone confirmation", "Telefono patvirtinimas SMS", "Подтверждение телефона по SMS")}: <b>{yesNo(diagnostics.phoneVerification)}</b></li>
          <li>{tr("Photo processing", "Nuotraukų apdorojimas", "Обработка фото")}: <b>{yesNo(diagnostics.photoProcessing)}</b></li>
          {diagnostics.errorAlerts !== undefined && (
            <li>{tr("Error alerts by e-mail", "Klaidų pranešimai el. paštu", "Оповещения об ошибках на e-mail")}: <b>{yesNo(diagnostics.errorAlerts)}</b></li>
          )}
        </ul>
      </section>

      {schema && (
        <section className="rounded-xl bg-card p-4 ring-1 ring-border">
          <h2 className="text-lg font-bold">{tr("Database", "Duomenų bazė", "База данных")}</h2>
          {!schema.checked ? (
            <p className="mt-2 text-sm text-red-600">{schema.error}</p>
          ) : schema.pending.length === 0 && schema.problems.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">{tr("All migrations are applied.", "Visos migracijos pritaikytos.", "Все миграции применены.")}</p>
          ) : (
            <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
              {schema.pending.map((p) => <li key={p.version}><b>{p.version}</b>: {p.missing.join(", ")}</li>)}
              {schema.problems.map((p) => <li key={p} className="text-red-600">{p}</li>)}
            </ul>
          )}
          <p className="mt-2 text-xs text-muted-foreground">
            {schema.autoApply
              ? tr("Missing tables are added automatically when the API starts.", "Trūkstamos lentelės pridedamos automatiškai paleidžiant API.", "Недостающие таблицы добавляются автоматически при запуске API.")
              : tr("Automatic migrations are off (MIGRATIONS_AUTO_APPLY).", "Automatinės migracijos išjungtos (MIGRATIONS_AUTO_APPLY).", "Автоматические миграции выключены (MIGRATIONS_AUTO_APPLY).")}
          </p>
          {schema.pending.length > 0 && (
            <button
              disabled={busy}
              onClick={() => {
                if (window.confirm(tr("Add the missing tables and indexes? Existing data is not changed.", "Pridėti trūkstamas lenteles ir indeksus? Esami duomenys nekeičiami.", "Добавить недостающие таблицы и индексы? Существующие данные не меняются.")))
                  onApplyMigrations();
              }}
              className="mt-3 rounded-lg bg-accent px-4 py-2 font-semibold text-accent-foreground"
            >
              {tr("Apply migrations", "Pritaikyti migracijas", "Применить миграции")}
            </button>
          )}
        </section>
      )}

      {backups && (
        <section className="rounded-xl bg-card p-4 ring-1 ring-border">
          <h2 className="text-lg font-bold">{tr("Backups", "Atsarginės kopijos", "Резервные копии")}</h2>
          {!backups.enabled ? (
            <p className="mt-2 text-sm">{tr("Off: set BACKUP_DIR on the server (a folder outside public_html).", "Išjungta: serveryje nustatykite BACKUP_DIR (aplanką už public_html ribų).", "Выключены: задайте BACKUP_DIR на сервере (папку вне public_html).")}</p>
          ) : (
            <ul className="mt-2 space-y-1 text-sm">
              <li>
                {tr("Latest", "Naujausia", "Последняя")}:{" "}
                <b>{backups.latest ? `${new Date(backups.latest.createdAt).toLocaleString()} (${formatSize(backups.latest.size)})` : tr("none yet", "dar nėra", "пока нет")}</b>
              </li>
              <li>{tr("Files kept", "Saugoma failų", "Хранится файлов")}: {backups.files} ({tr(`${backups.keepDays} days`, `${backups.keepDays} d.`, `${backups.keepDays} дн.`)})</li>
              <li className="break-all text-xs text-muted-foreground">{backups.dir}</li>
              {backups.lastError && <li className="text-red-600">{backups.lastError}</li>}
            </ul>
          )}
          {backups.enabled && (
            <button disabled={busy || backups.running} onClick={onBackup} className="mt-3 rounded-lg border border-border px-4 py-2 font-semibold hover:border-accent">
              {tr("Back up now", "Sukurti kopiją dabar", "Сделать копию сейчас")}
            </button>
          )}
        </section>
      )}

      {errors && (
        <section className="rounded-xl bg-card p-4 ring-1 ring-border lg:col-span-2">
          <h2 className="text-lg font-bold">
            {tr("Recent errors", "Naujausios klaidos", "Последние ошибки")} <span className="text-sm font-normal text-muted-foreground">({tr("since", "nuo", "с")} {new Date(errors.since).toLocaleString()}: {errors.total})</span>
          </h2>
          {errors.recent.length === 0 ? (
            <p className="mt-2 text-sm text-emerald-700 dark:text-emerald-400">{tr("No errors.", "Klaidų nėra.", "Ошибок нет.")}</p>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              {errors.recent.map((e) => (
                <li key={`${e.source}${e.where}${e.message}`} className="rounded-lg border border-border p-2">
                  <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                    <span>{new Date(e.at).toLocaleString()}</span>
                    <span className="font-semibold">{e.source === "frontend" ? tr("website", "svetainė", "сайт") : "API"}</span>
                    <span>{e.where}</span>
                    {e.count > 1 && <span>×{e.count}</span>}
                  </div>
                  <div className="mt-1 break-words font-mono text-xs">{e.message}</div>
                  {e.stack && (
                    <details className="mt-1">
                      <summary className="cursor-pointer text-xs text-muted-foreground">{tr("Details", "Daugiau", "Подробнее")}</summary>
                      <pre className="mt-1 overflow-x-auto whitespace-pre-wrap text-xs">{e.stack}</pre>
                    </details>
                  )}
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
