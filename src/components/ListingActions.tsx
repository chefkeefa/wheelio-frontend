"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/http";
import { getFavorites } from "@/lib/listings";
import {
  addFavorite,
  getSellerContact,
  me,
  removeFavorite,
  type AuthUser,
  type SellerContact,
} from "@/lib/pirkApi";
import AssetIcon from "@/components/ui/AssetIcon";

/** Contact seller, favorites and "report illegal content" for the public listing page. */
export default function ListingActions({ listingId }: { listingId: string }) {
  const { tr } = useLanguage();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [favorite, setFavorite] = useState(false);
  const [contact, setContact] = useState<SellerContact | null>(null);
  const [busy, setBusy] = useState<"contact" | "favorite" | null>(null);
  const [error, setError] = useState("");

  const loginHref = `/auth/login?return=${encodeURIComponent(`/listing/${listingId}`)}`;

  useEffect(() => {
    let alive = true;
    me()
      .then(async (current) => {
        if (!alive) return;
        setUser(current);
        try {
          const favorites = await getFavorites();
          if (alive) setFavorite(favorites.some((x) => x.id === listingId));
        } catch {
          /* favorites are optional */
        }
      })
      .catch(() => alive && setUser(null));
    return () => {
      alive = false;
    };
  }, [listingId]);

  const needLogin = () => {
    window.location.href = loginHref;
  };

  const showContact = async () => {
    if (!user) return needLogin();
    setBusy("contact");
    setError("");
    try {
      setContact(await getSellerContact(listingId));
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return needLogin();
      setError(e instanceof Error ? e.message : tr("Could not load contacts", "Nepavyko gauti kontaktų", "Не удалось получить контакты"));
    } finally {
      setBusy(null);
    }
  };

  const toggleFavorite = async () => {
    if (!user) return needLogin();
    setBusy("favorite");
    setError("");
    try {
      if (favorite) await removeFavorite(listingId);
      else await addFavorite(listingId);
      setFavorite(!favorite);
    } catch (e) {
      if (e instanceof ApiError && e.status === 400) {
        setError(tr("You cannot favorite your own listing.", "Negalima pažymėti savo skelbimo.", "Нельзя добавить своё объявление в избранное."));
      } else {
        setError(e instanceof Error ? e.message : tr("Action failed", "Veiksmas nepavyko", "Не удалось выполнить действие"));
      }
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-2xl bg-card p-5 shadow-card ring-1 ring-border sm:p-6">
      {contact ? (
        <div className="rounded-lg bg-muted p-4">
          <div className="text-xs text-muted-foreground">{tr("Seller", "Pardavėjas", "Продавец")}</div>
          <div className="mt-1 font-semibold">{contact.name || "—"}</div>
          {contact.phone ? (
            <a href={`tel:${contact.phone}`} className="mt-2 block text-xl font-extrabold text-accent-ink">
              {contact.phone}
            </a>
          ) : (
            <p className="mt-2 text-sm text-muted-foreground">
              {tr(
                "The seller has not shared a verified phone number.",
                "Pardavėjas nepateikė patvirtinto telefono numerio.",
                "Продавец не указал подтверждённый номер телефона."
              )}
            </p>
          )}
        </div>
      ) : (
        <button
          onClick={showContact}
          disabled={busy === "contact"}
          className="w-full rounded-lg bg-accent px-5 py-3 font-bold text-accent-foreground disabled:opacity-60"
        >
          {user === null
            ? tr("Sign in to contact the seller", "Prisijunkite, kad susisiektumėte", "Войдите, чтобы связаться с продавцом")
            : tr("Contact seller", "Susisiekti su pardavėju", "Связаться с продавцом")}
        </button>
      )}

      <button
        onClick={toggleFavorite}
        disabled={busy === "favorite"}
        className="mt-3 flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 py-3 font-semibold text-foreground disabled:opacity-60"
      >
        <AssetIcon name={favorite ? "heart-filled" : "heart"} size={18} className={favorite ? "text-red-500" : ""} />
        {favorite
          ? tr("In favorites (remove)", "Mėgstamuose (pašalinti)", "В избранном (убрать)")
          : tr("Add to favorites", "Pridėti į mėgstamus", "Добавить в избранное")}
      </button>

      {error && <p className="mt-3 text-sm text-red-600">{error}</p>}

      {/* Notice and action under the EU Digital Services Act: open to everyone, no account needed. */}
      <div className="mt-4 border-t border-border pt-4 text-sm">
        <Link href={`/report?listing=${encodeURIComponent(listingId)}`} className="text-muted-foreground underline hover:text-foreground">
          {tr("Report illegal content", "Pranešti apie neteisėtą turinį", "Сообщить о незаконном контенте")}
        </Link>
      </div>
    </div>
  );
}
