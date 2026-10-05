"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { isAdminUser, me, setAdminListingStatus } from "@/lib/pirkApi";
import type { ListingStatus } from "@/lib/listings";

/**
 * Shown above a listing that is not published (only its owner and admins can open it).
 * Admins also get buttons to approve or reject it right here.
 */
export default function ListingReviewBar({
  listingId,
  status,
  onStatusChange,
}: {
  listingId: string;
  status: ListingStatus;
  onStatusChange: (status: ListingStatus) => void;
}) {
  const { tr } = useLanguage();
  const [admin, setAdmin] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    me()
      .then((u) => alive && setAdmin(isAdminUser(u)))
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, []);

  if (status === "ACTIVE") return null;

  const labels: Record<string, string> = {
    PENDING_REVIEW: tr("Waiting for review: only you and administrators can see it.", "Laukia patikrinimo: matote tik jūs ir administratoriai.", "На проверке: видите только вы и администраторы."),
    REJECTED: tr("Rejected: the listing is not published.", "Atmestas: skelbimas nepaskelbtas.", "Отклонено: объявление не опубликовано."),
    PENDING_PAYMENT: tr("Not published yet: waiting for payment.", "Dar nepaskelbtas: laukiama apmokėjimo.", "Ещё не опубликовано: ожидает оплаты."),
    SOLD: tr("Sold: the listing is no longer public.", "Parduota: skelbimas nebėra viešas.", "Продано: объявление скрыто."),
    CLOSED: tr("Closed: the listing is no longer public.", "Uždarytas: skelbimas nebėra viešas.", "Снято: объявление скрыто."),
  };

  const change = async (next: ListingStatus) => {
    let reason: string | undefined;
    if (next === "REJECTED") {
      // DSA Art. 17: the seller is e-mailed the reason for the rejection.
      const answer = window.prompt(
        tr(
          "Reason for the seller (facts and which rule is broken). It is e-mailed to them.",
          "Priežastis pardavėjui (faktai ir kuri taisyklė pažeista). Ji bus išsiųsta el. paštu.",
          "Причина для продавца (факты и какое правило нарушено). Она будет отправлена по e-mail."
        )
      );
      if (answer === null) return;
      reason = answer.trim();
    }
    setBusy(true);
    setError("");
    try {
      await setAdminListingStatus(Number(listingId), next, reason);
      onStatusChange(next);
    } catch {
      setError(tr("Could not change the status.", "Nepavyko pakeisti būsenos.", "Не удалось изменить статус."));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-accent/40 bg-accent/10 p-4 sm:flex-row sm:items-center sm:justify-between">
      <p className="text-sm font-medium text-foreground">{labels[status] ?? status}</p>
      {admin && (
        <div className="flex shrink-0 gap-2">
          <button
            type="button"
            disabled={busy}
            onClick={() => change("ACTIVE")}
            className="rounded-lg bg-accent px-4 py-2 text-sm font-semibold text-accent-foreground disabled:opacity-60"
          >
            {tr("Approve", "Patvirtinti", "Одобрить")}
          </button>
          {status !== "REJECTED" && (
            <button
              type="button"
              disabled={busy}
              onClick={() => change("REJECTED")}
              className="rounded-lg border border-border px-4 py-2 text-sm font-semibold hover:border-accent disabled:opacity-60"
            >
              {tr("Reject", "Atmesti", "Отклонить")}
            </button>
          )}
        </div>
      )}
      {error && <p className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
