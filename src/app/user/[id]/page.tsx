"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { anybody } from "@/lib/fonts";
import { ApiError } from "@/lib/http";
import { getMyListings, type Listing, type ListingDetail } from "@/lib/listings";
import { me, type AuthUser } from "@/lib/pirkApi";
import CertificationChecklist from "@/components/profile/CertificationChecklist";
import {
  deleteAvatar,
  getMyListingsStats,
  getProfileContact,
  getPublicProfile,
  getPublicProfileListings,
  removeListing,
  uploadAvatar,
  type ListingTotals,
  type PublicProfile,
} from "@/lib/profiles";
import CarCard from "@/components/CarCard";
import AssetIcon from "@/components/ui/AssetIcon";
import UserAvatar from "@/components/profile/UserAvatar";
import VerifiedBadge from "@/components/profile/VerifiedBadge";
import OwnListingCard from "@/components/profile/OwnListingCard";
import ListingStatsDialog from "@/components/profile/ListingStatsDialog";
import ScrollTopButton from "@/components/ui/ScrollTopButton";

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/**
 * A user's page: a profile card on the left and the user's listings on the right.
 * Everyone sees the photo, name, identity status, registration date, phone (signed-in visitors) and active listings,
 * and can write to the seller or report the profile. The owner also sees their e-mail and phone, all of their
 * listings with Edit, Delete and Statistics, and can change the photo.
 */
export default function UserPage() {
  const params = useParams<{ id: string | string[] }>();
  const id = String((Array.isArray(params?.id) ? params.id[0] : params?.id) ?? "").trim();
  const { tr, language } = useLanguage();

  const [profile, setProfile] = useState<PublicProfile | null | undefined>(undefined);
  const [error, setError] = useState("");
  const [publicListings, setPublicListings] = useState<Listing[]>([]);
  const [ownListings, setOwnListings] = useState<ListingDetail[]>([]);
  const [totals, setTotals] = useState<Record<string, ListingTotals>>({});
  const [listingsLoading, setListingsLoading] = useState(true);
  const [phone, setPhone] = useState<string | null | undefined>(undefined);
  const [phoneBusy, setPhoneBusy] = useState(false);
  const [statsFor, setStatsFor] = useState<ListingDetail | null>(null);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [notice, setNotice] = useState("");
  const [avatarBusy, setAvatarBusy] = useState(false);
  const [account, setAccount] = useState<AuthUser | null>(null);
  const [pickListing, setPickListing] = useState(false);
  const fileRef = useRef<HTMLInputElement | null>(null);

  const loadListings = useCallback(async (p: PublicProfile) => {
    setListingsLoading(true);
    try {
      if (p.own) {
        const [page, stats] = await Promise.all([getMyListings(0, 100), getMyListingsStats()]);
        setOwnListings(page.content);
        setTotals(stats);
      } else {
        setPublicListings(await getPublicProfileListings(String(p.id)));
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setListingsLoading(false);
    }
  }, []);

  useEffect(() => {
    let alive = true;
    setProfile(undefined);
    getPublicProfile(id)
      .then((p) => {
        if (!alive) return;
        setProfile(p);
        if (p) loadListings(p);
        if (p?.own)
          me()
            .then((u) => alive && setAccount(u))
            .catch(() => undefined);
      })
      .catch((e) => alive && (setProfile(null), setError(e instanceof Error ? e.message : String(e))));
    return () => {
      alive = false;
    };
  }, [id, loadListings]);

  const locale = language === "LT" ? "lt-LT" : language === "RU" ? "ru-RU" : "en-GB";
  const loginHref = `/auth/login?return=${encodeURIComponent(`/user/${id}`)}`;

  const showPhone = async () => {
    setPhoneBusy(true);
    try {
      setPhone((await getProfileContact(id)).phone);
    } catch (e) {
      if (e instanceof ApiError && e.status === 401) {
        window.location.href = loginHref;
        return;
      }
      setPhone(null);
    } finally {
      setPhoneBusy(false);
    }
  };

  const changeAvatar = async (file: File | undefined) => {
    if (!file || !profile) return;
    setNotice("");
    if (file.size > AVATAR_MAX_BYTES) {
      setNotice(tr("The photo must be under 5 MB.", "Nuotrauka turi būti iki 5 MB.", "Фото должно быть меньше 5 МБ."));
      return;
    }
    setAvatarBusy(true);
    try {
      const url = await uploadAvatar(file);
      setProfile({ ...profile, avatarUrl: url });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : String(e));
    } finally {
      setAvatarBusy(false);
    }
  };

  const removeAvatar = async () => {
    if (!profile || !window.confirm(tr("Remove your profile photo?", "Pašalinti profilio nuotrauką?", "Удалить фото профиля?"))) return;
    setAvatarBusy(true);
    try {
      await deleteAvatar();
      setProfile({ ...profile, avatarUrl: null });
    } catch (e) {
      setNotice(e instanceof Error ? e.message : String(e));
    } finally {
      setAvatarBusy(false);
    }
  };

  const deleteListing = async (item: ListingDetail) => {
    const title = [item.mark, item.model, item.year].filter(Boolean).join(" ") || item.title;
    const question = tr(
      `Delete “${title}” for good? Photos, statistics and buyer chats are deleted too. This cannot be undone.`,
      `Ištrinti „${title}“ visam laikui? Kartu ištrinamos nuotraukos, statistika ir pokalbiai su pirkėjais. To atšaukti negalima.`,
      `Удалить «${title}» навсегда? Вместе с ним удалятся фото, статистика и чаты с покупателями. Отменить это нельзя.`
    );
    if (!window.confirm(question) || !profile) return;
    setBusyId(item.id);
    setNotice("");
    try {
      await removeListing(item.id);
      setOwnListings((list) => list.filter((x) => x.id !== item.id));
      const p = await getPublicProfile(id);
      if (p) setProfile(p);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : String(e));
    } finally {
      setBusyId(null);
    }
  };

  if (profile === undefined)
    return (
      <main className="container mx-auto grid max-w-6xl gap-6 px-4 py-10 sm:px-6 lg:grid-cols-[300px_minmax(0,1fr)] lg:gap-8 lg:px-8">
        <div className="h-96 animate-pulse rounded-2xl bg-muted" />
        <div className="grid content-start gap-5 sm:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
          ))}
        </div>
      </main>
    );

  if (profile === null)
    return (
      <main className="container mx-auto max-w-3xl px-4 py-16 text-center sm:px-6">
        <h1 className="page-title">{tr("User not found", "Naudotojas nerastas", "Пользователь не найден")}</h1>
        <p className="mt-3 text-muted-foreground">
          {error || tr("This page does not exist or the account was closed.", "Šio puslapio nėra arba paskyra uždaryta.", "Такой страницы нет или аккаунт закрыт.")}
        </p>
        <Link href="/" className="mt-6 inline-flex rounded-xl bg-accent px-5 py-3 font-bold text-accent-foreground">
          {tr("Back to listings", "Grįžti į skelbimus", "Назад к объявлениям")}
        </Link>
      </main>
    );

  const since = profile.memberSince
    ? new Date(profile.memberSince).toLocaleDateString(locale, {
        day: "numeric",
        month: "long",
        year: "numeric",
      })
    : null;
  const current = ownListings.filter((x) => x.status !== "SOLD" && x.status !== "CLOSED");
  const finished = ownListings.filter((x) => x.status === "SOLD" || x.status === "CLOSED");
  const row = "flex w-full items-center justify-between gap-3 px-5 py-4 text-left font-bold transition hover:bg-muted/60";
  const listingTitle = (x: Listing) => [x.mark, x.model, x.year].filter(Boolean).join(" ") || x.title;

  const writeToSeller = () => {
    if (publicListings.length === 1) window.location.href = `/listing/${publicListings[0].id}?write=1`;
    else setPickListing((v) => !v);
  };

  return (
    <main className="min-h-[70vh] bg-background text-foreground">
      <div className="container mx-auto grid max-w-6xl gap-6 px-4 py-8 sm:px-6 md:py-12 lg:grid-cols-[300px_minmax(0,1fr)] lg:items-start lg:gap-8 lg:px-8">
        <aside className="lg:sticky lg:top-24">
          <section className="overflow-hidden rounded-2xl bg-card shadow-card ring-1 ring-border">
            <div className="flex flex-col items-center px-5 pb-5 pt-7 text-center">
              <div className="relative">
                <UserAvatar name={profile.name} src={profile.avatarUrl} size={152} />
                {profile.own && (
                  <>
                    <button
                      type="button"
                      disabled={avatarBusy}
                      onClick={() => fileRef.current?.click()}
                      aria-label={tr("Change photo", "Keisti nuotrauką", "Сменить фото")}
                      className="absolute bottom-1 right-1 grid h-10 w-10 place-items-center rounded-full bg-accent text-accent-foreground shadow-md ring-4 ring-card transition hover:brightness-95 disabled:opacity-60"
                    >
                      <AssetIcon name={avatarBusy ? "spinner" : "camera"} size={18} className={avatarBusy ? "animate-spin" : ""} />
                    </button>
                    <input
                      ref={fileRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="hidden"
                      onChange={(e) => {
                        changeAvatar(e.target.files?.[0]);
                        e.target.value = "";
                      }}
                    />
                  </>
                )}
              </div>
              {profile.own && profile.avatarUrl && (
                <button type="button" onClick={removeAvatar} disabled={avatarBusy} className="mt-2 text-xs font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground">
                  {tr("Remove photo", "Pašalinti nuotrauką", "Удалить фото")}
                </button>
              )}

              <h1 className={`${anybody.className} mt-4 max-w-full break-words text-2xl font-extrabold leading-tight`}>
                {profile.own && account ? `${account.name} ${account.surname}`.trim() || profile.name : profile.name}
                <span className="ml-2 inline-block align-[-3px]">
                  <VerifiedBadge verified={profile.identityVerified} size={22} />
                </span>
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                {tr(`${profile.activeListings} for sale`, `Parduodama: ${profile.activeListings}`, `В продаже: ${profile.activeListings}`)}
                {profile.soldListings > 0 && ` · ${tr(`${profile.soldListings} sold`, `parduota: ${profile.soldListings}`, `продано: ${profile.soldListings}`)}`}
              </p>
            </div>

            <dl className="space-y-3 border-t border-border px-5 py-4 text-sm">
              {since && (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tr("Registered", "Užsiregistravo", "Дата регистрации")}</dt>
                  <dd className="mt-0.5 font-semibold">{since}</dd>
                </div>
              )}
              {profile.own ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tr("Contact details", "Kontaktai", "Контактные данные")}</dt>
                  <dd className="mt-1 space-y-1.5">
                    <span className="flex items-center gap-2 break-all">
                      <AssetIcon name="mail" size={15} className="shrink-0 text-muted-foreground" />
                      {account?.email || "—"}
                    </span>
                    <span className="flex items-center gap-2">
                      <AssetIcon name="phone" size={15} className="shrink-0 text-muted-foreground" />
                      {account?.phone || tr("not added", "nepridėtas", "не указан")}
                    </span>
                  </dd>
                  <p className="mt-1.5 text-xs text-muted-foreground">
                    {tr(
                      "Only you see your e-mail. Buyers see the phone after signing in.",
                      "El. paštą matote tik jūs. Telefoną pirkėjai mato prisijungę.",
                      "E-mail видите только вы. Телефон покупатели видят после входа.",
                    )}
                  </p>
                </div>
              ) : profile.hasPhone ? (
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{tr("Contact details", "Kontaktai", "Контактные данные")}</dt>
                  <dd className="mt-1.5">
                    {phone ? (
                      <a href={`tel:${phone}`} className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 font-bold text-accent-foreground">
                        <AssetIcon name="phone" size={17} />
                        {phone}
                      </a>
                    ) : (
                      <button
                        type="button"
                        onClick={showPhone}
                        disabled={phoneBusy}
                        className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-accent px-4 font-bold text-accent-foreground transition hover:brightness-95 disabled:opacity-60"
                      >
                        <AssetIcon name="phone" size={17} />
                        {phone === null ? tr("Number not available", "Numeris nepasiekiamas", "Номер недоступен") : tr("Show phone", "Rodyti telefoną", "Показать телефон")}
                      </button>
                    )}
                  </dd>
                </div>
              ) : null}
            </dl>

            {profile.own && (
              <div className="px-5 pb-5">
                <Link href="/account/profile" className="inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-bold transition hover:border-accent">
                  <AssetIcon name="edit" size={16} />
                  {tr("Edit", "Redaguoti", "Редактировать")}
                </Link>
              </div>
            )}

            <div className="divide-y divide-border border-t border-border">
              {profile.own ? (
                <Link href="/messages" className={row}>
                  {tr("My messages", "Mano žinutės", "Мои сообщения")}
                  <AssetIcon name="message" size={18} className="text-muted-foreground" />
                </Link>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={writeToSeller}
                    disabled={!listingsLoading && publicListings.length === 0}
                    aria-expanded={publicListings.length > 1 ? pickListing : undefined}
                    className={`${row} disabled:cursor-not-allowed disabled:opacity-50`}
                  >
                    {tr("Send a message", "Parašyti žinutę", "Отправить сообщение")}
                    <AssetIcon name="message" size={18} className="text-muted-foreground" />
                  </button>
                  {pickListing && publicListings.length > 1 && (
                    <div className="bg-muted/40 px-5 py-3">
                      <p className="text-xs text-muted-foreground">{tr("Which car is it about?", "Dėl kurio automobilio?", "По какому автомобилю?")}</p>
                      <ul className="mt-1.5 space-y-1">
                        {publicListings.map((x) => (
                          <li key={x.id}>
                            <Link href={`/listing/${x.id}?write=1`} className="block truncate rounded-lg px-2 py-1.5 text-sm font-semibold hover:bg-card">
                              {listingTitle(x)}
                            </Link>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                  <Link href={`/report?user=${profile.id}`} className={`${row} text-muted-foreground hover:text-foreground`}>
                    {tr("Report this user", "Pranešti apie naudotoją", "Оставить жалобу")}
                    <AssetIcon name="flag" size={18} />
                  </Link>
                </>
              )}
            </div>
          </section>

          {profile.own && profile.certification && !profile.certification.certified && (
            <CertificationChecklist c={profile.certification} returnTo={`/user/${profile.id}`} />
          )}
        </aside>

        <div className="min-w-0">
          <div className="mb-5 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-card px-5 py-4 shadow-card ring-1 ring-border">
            <h2 className="flex items-baseline gap-3 text-xl font-extrabold">
              {profile.own ? tr("My listings", "Mano skelbimai", "Мои объявления") : tr("User's listings", "Naudotojo skelbimai", "Объявления пользователя")}
              <span className="text-sm font-semibold text-muted-foreground">{profile.own ? current.length : publicListings.length}</span>
            </h2>
            {profile.own && (
              <Link href="/sell" className="inline-flex h-10 items-center justify-center rounded-xl bg-accent px-4 text-sm font-bold text-accent-foreground transition hover:brightness-95">
                + {tr("New listing", "Naujas skelbimas", "Новое объявление")}
              </Link>
            )}
          </div>

          {notice && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">{notice}</div>}

          {listingsLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : profile.own ? (
            current.length ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {current.map((item) => (
                  <OwnListingCard key={item.id} item={item} totals={totals[item.id]} busy={busyId === item.id} onStats={() => setStatsFor(item)} onDelete={() => deleteListing(item)} />
                ))}
              </div>
            ) : (
              <EmptyListings own tr={tr} />
            )
          ) : publicListings.length ? (
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {publicListings.map((item) => (
                <CarCard
                  key={item.id}
                  id={item.id}
                  title={[item.mark, item.model].filter(Boolean).join(" ") || item.title}
                  price={item.price}
                  imageUrl={item.thumbnail}
                  year={item.year}
                  mileage={item.mileage}
                  volume={item.volume}
                  fuel={item.fuel}
                  city={item.city}
                />
              ))}
            </div>
          ) : (
            <EmptyListings tr={tr} />
          )}

          {profile.own && finished.length > 0 && (
            <section className="mt-10">
              <div className="mb-4 flex items-baseline gap-3 border-b border-border pb-3">
                <h2 className="text-lg font-extrabold">{tr("Sold and withdrawn", "Parduoti ir išimti", "Проданные и снятые")}</h2>
                <span className="text-sm text-muted-foreground">{finished.length}</span>
              </div>
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {finished.map((item) => (
                  <OwnListingCard key={item.id} item={item} totals={totals[item.id]} busy={busyId === item.id} onStats={() => setStatsFor(item)} onDelete={() => deleteListing(item)} />
                ))}
              </div>
            </section>
          )}
        </div>
      </div>

      {!statsFor && <ScrollTopButton />}

      {statsFor && <ListingStatsDialog listingId={statsFor.id} title={[statsFor.mark, statsFor.model, statsFor.year].filter(Boolean).join(" ") || statsFor.title} onClose={() => setStatsFor(null)} />}
    </main>
  );
}

function EmptyListings({ own, tr }: { own?: boolean; tr: (en: string, lt: string, ru: string) => string }) {
  return (
    <div className="rounded-2xl border border-dashed border-border p-10 text-center">
      <p className="font-semibold">{own ? tr("You have no listings yet", "Dar neturite skelbimų", "У вас пока нет объявлений") : tr("No cars for sale right now", "Šiuo metu automobilių neparduoda", "Сейчас ничего не продаёт")}</p>
      {own && (
        <Link href="/sell" className="mt-4 inline-flex rounded-xl bg-accent px-5 py-3 font-bold text-accent-foreground">
          {tr("Create listing", "Sukurti skelbimą", "Создать объявление")}
        </Link>
      )}
    </div>
  );
}
