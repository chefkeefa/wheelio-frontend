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
import { CHAT_MESSAGE_MAX, getListingChat, notifyChatsChanged, startChat } from "@/lib/chats";

/** Write to the seller, seller's phone, favorites and "report illegal content" for the public listing page. */
export default function ListingActions({ listingId }: { listingId: string }) {
  const { tr } = useLanguage();
  const [user, setUser] = useState<AuthUser | null | undefined>(undefined);
  const [favorite, setFavorite] = useState(false);
  const [contact, setContact] = useState<SellerContact | null>(null);
  const [busy, setBusy] = useState<"contact" | "favorite" | "chat" | null>(null);
  const [error, setError] = useState("");
  // Chat with the seller: the buyer's existing conversation, or own=true on the seller's own listing.
  const [chat, setChat] = useState<{ chatId: number | null; own: boolean; available: boolean } | null>(null);
  const [composing, setComposing] = useState(false);
  const [draft, setDraft] = useState("");
  const [chatError, setChatError] = useState("");

  const loginHref = `/auth/login?return=${encodeURIComponent(`/listing/${listingId}`)}`;

  useEffect(() => {
    let alive = true;
    me()
      .then(async (current) => {
        if (!alive) return;
        setUser(current);
        getListingChat(listingId)
          .then((c) => alive && setChat(c))
          .catch(() => alive && setChat({ chatId: null, own: false, available: true }));
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

  const quickMessages = [
    tr("Hello! Is the car still available?", "Sveiki! Ar automobilis dar parduodamas?", "Здравствуйте! Машина ещё продаётся?"),
    tr("When could I come to see it?", "Kada galėčiau atvykti apžiūrėti?", "Когда можно приехать посмотреть?"),
    tr("Is the price negotiable?", "Ar kaina derinama?", "Возможен торг?"),
  ];

  const openComposer = () => {
    if (!user) return needLogin();
    setChatError("");
    setComposing(true);
  };

  const sendFirstMessage = async () => {
    const text = draft.trim();
    if (!text) return;
    setBusy("chat");
    setChatError("");
    try {
      const r = await startChat(listingId, text);
      notifyChatsChanged();
      window.location.href = `/messages/${r.chatId}`;
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) return needLogin();
      setChatError(
        e instanceof ApiError && e.status === 503
          ? tr("Messages are not available yet. Please call the seller.", "Žinutės dar neveikia. Paskambinkite pardavėjui.", "Сообщения пока недоступны. Позвоните продавцу.")
          : e instanceof ApiError && e.status === 429
            ? tr("Too many messages. Try again later.", "Per daug žinučių. Bandykite vėliau.", "Слишком много сообщений. Попробуйте позже.")
            : e instanceof Error ? e.message : tr("Message was not sent", "Žinutė neišsiųsta", "Сообщение не отправлено")
      );
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

  const chatBlock = chat?.own ? (
    <Link
      href="/messages"
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 font-bold text-accent-foreground"
    >
      <AssetIcon name="message" size={19} />
      {tr("Messages from buyers", "Pirkėjų žinutės", "Сообщения от покупателей")}
    </Link>
  ) : chat?.chatId ? (
    <Link
      href={`/messages/${chat.chatId}`}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 font-bold text-accent-foreground"
    >
      <AssetIcon name="message" size={19} />
      {tr("Open your conversation", "Atidaryti pokalbį", "Открыть переписку")}
    </Link>
  ) : composing ? (
    <div className="rounded-xl border border-border bg-background p-3">
      <label htmlFor="seller-message" className="text-sm font-semibold">
        {tr("Message to the seller", "Žinutė pardavėjui", "Сообщение продавцу")}
      </label>
      <div className="mt-2 flex flex-wrap gap-1.5">
        {quickMessages.map((q) => (
          <button
            key={q}
            type="button"
            onClick={() => setDraft(q)}
            className="rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground transition hover:border-accent hover:text-foreground"
          >
            {q}
          </button>
        ))}
      </div>
      <textarea
        id="seller-message"
        value={draft}
        onChange={(e) => setDraft(e.target.value.slice(0, CHAT_MESSAGE_MAX))}
        rows={3}
        autoFocus
        placeholder={tr("Write your question…", "Parašykite klausimą…", "Напишите вопрос…")}
        className="mt-2 w-full resize-none rounded-lg border border-border bg-card px-3 py-2 text-[15px] outline-none focus:border-accent"
      />
      <div className="mt-2 flex items-center gap-2">
        <button
          type="button"
          onClick={sendFirstMessage}
          disabled={busy === "chat" || !draft.trim()}
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-accent px-4 py-2.5 font-bold text-accent-foreground disabled:opacity-50"
        >
          <AssetIcon name={busy === "chat" ? "spinner" : "send"} size={17} className={busy === "chat" ? "animate-spin" : ""} />
          {tr("Send", "Siųsti", "Отправить")}
        </button>
        <button
          type="button"
          onClick={() => setComposing(false)}
          className="rounded-lg px-3 py-2.5 text-sm font-semibold text-muted-foreground hover:text-foreground"
        >
          {tr("Cancel", "Atšaukti", "Отмена")}
        </button>
      </div>
      {chatError && <p className="mt-2 text-sm text-red-600">{chatError}</p>}
    </div>
  ) : (
    <button
      type="button"
      onClick={openComposer}
      className="flex w-full items-center justify-center gap-2 rounded-lg bg-accent px-5 py-3 font-bold text-accent-foreground"
    >
      <AssetIcon name="message" size={19} />
      {user === null
        ? tr("Sign in to write to the seller", "Prisijunkite ir parašykite pardavėjui", "Войдите, чтобы написать продавцу")
        : tr("Write to the seller", "Parašyti pardavėjui", "Написать продавцу")}
    </button>
  );

  return (
    <div className="rounded-2xl bg-card p-5 shadow-card ring-1 ring-border sm:p-6">
      {chatBlock}

      <div className="mt-3">
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
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border bg-background px-5 py-3 font-semibold text-foreground disabled:opacity-60"
        >
          <AssetIcon name="phone" size={18} />
          {tr("Show phone number", "Rodyti telefono numerį", "Показать телефон")}
        </button>
      )}
      </div>

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
