"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import { anybody } from "@/lib/fonts";
import { ApiError } from "@/lib/http";
import { getMyListings, type Listing, type ListingDetail } from "@/lib/listings";
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

const AVATAR_MAX_BYTES = 5 * 1024 * 1024;

/**
 * A user's page. Everyone sees the photo, name, identity status, phone (signed-in visitors) and active listings.
 * The owner sees all of their listings with Statistics, Edit and Delete, and can change the photo.
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
      <main className="container mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="h-40 animate-pulse rounded-2xl bg-muted" />
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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

  const since = profile.memberSince ? new Date(profile.memberSince).toLocaleDateString(locale, { month: "long", year: "numeric" }) : null;
  const current = ownListings.filter((x) => x.status !== "SOLD" && x.status !== "CLOSED");
  const finished = ownListings.filter((x) => x.status === "SOLD" || x.status === "CLOSED");

  return (
    <main className="min-h-[70vh] bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-8 sm:px-6 md:py-12 lg:px-8">
        <section className="rounded-2xl bg-card p-5 shadow-card ring-1 ring-border sm:p-7">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center">
            <div className="relative self-start">
              <UserAvatar name={profile.name} src={profile.avatarUrl} size={104} />
              {profile.own && (
                <>
                  <button
                    type="button"
                    disabled={avatarBusy}
                    onClick={() => fileRef.current?.click()}
                    aria-label={tr("Change photo", "Keisti nuotrauką", "Сменить фото")}
                    className="absolute -bottom-1 -right-1 grid h-9 w-9 place-items-center rounded-full bg-accent text-accent-foreground shadow-md ring-4 ring-card transition hover:brightness-95 disabled:opacity-60"
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

            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2.5">
                <h1 className={`${anybody.className} truncate text-3xl font-extrabold sm:text-4xl`}>{profile.name}</h1>
                <VerifiedBadge verified={profile.identityVerified} size={26} />
              </div>
              <div className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground">
                {since && (
                  <span className="inline-flex items-center gap-1.5">
                    <AssetIcon name="calendar" size={15} />
                    {tr("On Wheelio since", "Wheelio nuo", "На Wheelio с")} {since}
                  </span>
                )}
                <span className="inline-flex items-center gap-1.5">
                  <AssetIcon name="car" size={15} />
                  {tr(`${profile.activeListings} for sale`, `Parduodama: ${profile.activeListings}`, `В продаже: ${profile.activeListings}`)}
                  {profile.soldListings > 0 && ` · ${tr(`${profile.soldListings} sold`, `parduota: ${profile.soldListings}`, `продано: ${profile.soldListings}`)}`}
                </span>
              </div>
              {profile.own && profile.avatarUrl && (
                <button type="button" onClick={removeAvatar} disabled={avatarBusy} className="mt-2 text-sm font-semibold text-muted-foreground underline underline-offset-2 hover:text-foreground">
                  {tr("Remove photo", "Pašalinti nuotrauką", "Удалить фото")}
                </button>
              )}
            </div>

            <div className="flex flex-col gap-2 sm:w-64">
              {profile.own ? (
                <>
                  <Link href="/sell" className="inline-flex h-11 items-center justify-center rounded-xl bg-accent px-4 font-bold text-accent-foreground transition hover:brightness-95">
                    + {tr("Sell a car", "Parduoti automobilį", "Продать автомобиль")}
                  </Link>
                  <Link href="/account/profile" className="inline-flex h-11 items-center justify-center gap-2 rounded-xl border border-border px-4 text-sm font-bold hover:border-accent">
                    <AssetIcon name="settings" size={17} />
                    {tr("Profile & settings", "Profilis ir nustatymai", "Профиль и настройки")}
                  </Link>
                </>
              ) : profile.hasPhone ? (
                phone ? (
                  <a href={`tel:${phone}`} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 font-bold text-accent-foreground">
                    <AssetIcon name="phone" size={18} />
                    {phone}
                  </a>
                ) : (
                  <button type="button" onClick={showPhone} disabled={phoneBusy} className="inline-flex h-11 items-center justify-center gap-2 rounded-xl bg-accent px-4 font-bold text-accent-foreground transition hover:brightness-95 disabled:opacity-60">
                    <AssetIcon name="phone" size={18} />
                    {phone === null ? tr("Number not available", "Numeris nepasiekiamas", "Номер недоступен") : tr("Show phone", "Rodyti telefoną", "Показать телефон")}
                  </button>
                )
              ) : null}
            </div>
          </div>

          {profile.own && !profile.identityVerified && (
            <p className="mt-5 flex items-start gap-2 rounded-xl bg-muted/60 p-3 text-sm leading-6 text-muted-foreground">
              <AssetIcon name="shield" size={18} className="mt-0.5 shrink-0" />
              <span>
                {tr(
                  "Buyers see a grey tick next to your name. To get the green one, ask support to check your ID document: ",
                  "Pirkėjai šalia jūsų vardo mato pilką varnelę. Kad ji taptų žalia, paprašykite pagalbos tarnybos patikrinti jūsų asmens dokumentą: ",
                  "Покупатели видят серую галочку рядом с вашим именем. Чтобы она стала зелёной, попросите поддержку проверить ваш документ: "
                )}
                <Link href="/help" className="font-semibold text-foreground underline underline-offset-2">
                  {tr("write to support", "parašykite pagalbai", "написать в поддержку")}
                </Link>
                .
              </span>
            </p>
          )}
        </section>

        {notice && <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-500">{notice}</div>}

        <section className="mt-10">
          <div className="mb-4 flex items-baseline gap-3 border-b border-border pb-3">
            <h2 className="text-xl font-extrabold">
              {profile.own ? tr("My listings", "Mano skelbimai", "Мои объявления") : tr("Cars for sale", "Parduodami automobiliai", "Автомобили в продаже")}
            </h2>
            <span className="text-sm text-muted-foreground">{profile.own ? current.length : publicListings.length}</span>
          </div>

          {listingsLoading ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-72 animate-pulse rounded-2xl bg-muted" />
              ))}
            </div>
          ) : profile.own ? (
            current.length ? (
              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {current.map((item) => (
                  <OwnListingCard key={item.id} item={item} totals={totals[item.id]} busy={busyId === item.id} onStats={() => setStatsFor(item)} onDelete={() => deleteListing(item)} />
                ))}
              </div>
            ) : (
              <EmptyListings own tr={tr} />
            )
          ) : publicListings.length ? (
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
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
        </section>

        {profile.own && finished.length > 0 && (
          <section className="mt-12">
            <div className="mb-4 flex items-baseline gap-3 border-b border-border pb-3">
              <h2 className="text-lg font-extrabold">{tr("Sold and withdrawn", "Parduoti ir išimti", "Проданные и снятые")}</h2>
              <span className="text-sm text-muted-foreground">{finished.length}</span>
            </div>
            <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {finished.map((item) => (
                <OwnListingCard key={item.id} item={item} totals={totals[item.id]} busy={busyId === item.id} onStats={() => setStatsFor(item)} onDelete={() => deleteListing(item)} />
              ))}
            </div>
          </section>
        )}
      </div>

      {statsFor && (
        <ListingStatsDialog
          listingId={statsFor.id}
          title={[statsFor.mark, statsFor.model, statsFor.year].filter(Boolean).join(" ") || statsFor.title}
          onClose={() => setStatsFor(null)}
        />
      )}
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
