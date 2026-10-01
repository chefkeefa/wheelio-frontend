"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/http";
import {
  ADMIN_LISTING_STATUSES,
  getAdminStats,
  isAdminUser,
  listAdminComplaints,
  listAdminListings,
  listAdminUsers,
  me,
  setAdminListingStatus,
  setComplaintStatus,
  setUserDisabled,
  setUserSupportRole,
  type AdminComplaint,
  type AdminListing,
  type AdminStats,
  type AdminUser,
  type Paged,
} from "@/lib/pirkApi";
import AssetIcon from "@/components/ui/AssetIcon";

type Tab = "listings" | "complaints" | "users";
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
  const [users, setUsers] = useState<Paged<AdminUser> | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

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
      if (tab === "listings") setListings(await listAdminListings(page, PAGE_SIZE));
      if (tab === "complaints") setComplaints(await listAdminComplaints(page, PAGE_SIZE));
      if (tab === "users") setUsers(await listAdminUsers(page, PAGE_SIZE));
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
    } finally {
      setBusy(false);
    }
  }, [tab, page]);

  useEffect(() => {
    if (allowed) load();
  }, [allowed, load]);

  const run = async (action: () => Promise<unknown>) => {
    setBusy(true);
    setError("");
    try {
      await action();
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error");
      setBusy(false);
    }
  };

  if (allowed === null) return <main className="container mx-auto min-h-[60vh] px-4 py-10">…</main>;
  if (!allowed)
    return (
      <main className="container mx-auto min-h-[60vh] px-4 py-10">
        <h1 className="text-3xl font-extrabold">{tr("Access denied", "Prieiga uždrausta", "Доступ запрещён")}</h1>
        <p className="mt-2 text-muted-foreground">{tr("This page is for administrators.", "Šis puslapis skirtas administratoriams.", "Эта страница только для администраторов.")}</p>
      </main>
    );

  const current = tab === "listings" ? listings : tab === "complaints" ? complaints : users;
  const tabs: [Tab, string][] = [
    ["listings", tr("Listings", "Skelbimai", "Объявления")],
    ["complaints", tr("Complaints", "Skundai", "Жалобы")],
    ["users", tr("Users", "Naudotojai", "Пользователи")],
  ];

  return (
    <main className="min-h-[70vh] bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <h1 className="text-4xl font-extrabold">{tr("Administration", "Administravimas", "Администрирование")}</h1>
          <Link href="/admin/support" className="rounded-lg border border-border px-4 py-2 font-semibold hover:border-accent">{tr("Support desk", "Pagalbos centras", "Поддержка")}</Link>
        </div>

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

        <div className={`mt-4 overflow-x-auto ${busy ? "opacity-60" : ""}`}>
          {tab === "listings" && listings && (
            <table className="w-full text-sm">
              <thead><tr className="text-left text-muted-foreground"><th className="p-2">ID</th><th className="p-2">{tr("Car", "Automobilis", "Авто")}</th><th className="p-2">{tr("Seller", "Pardavėjas", "Продавец")}</th><th className="p-2">{tr("Price", "Kaina", "Цена")}</th><th className="p-2">{tr("Status", "Būsena", "Статус")}</th></tr></thead>
              <tbody>
                {listings.content.map((l) => (
                  <tr key={l.id} className="border-t border-border">
                    <td className="p-2"><Link href={`/listing/${l.id}`} className="underline">{l.id}</Link></td>
                    <td className="p-2">{[l.car?.mark?.name, l.car?.model?.name].filter(Boolean).join(" ") || "—"}</td>
                    <td className="p-2">{l.user ? `${l.user.name || ""} ${l.user.surname || ""}`.trim() || `#${l.user.id}` : "—"}</td>
                    <td className="p-2">{l.price} €</td>
                    <td className="p-2">
                      <select
                        value={l.status}
                        disabled={busy}
                        onChange={(e) => run(() => setAdminListingStatus(l.id, e.target.value))}
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
                            ? tr("Block this user?", "Užblokuoti naudotoją?", "Заблокировать пользователя?")
                            : tr("Unblock this user?", "Atblokuoti naudotoją?", "Разблокировать пользователя?");
                          if (window.confirm(q)) run(() => setUserDisabled(u.id, disable));
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
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {current && current.totalPages > 1 && (
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
