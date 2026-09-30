/* eslint-disable @next/next/no-img-element */
"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useLanguage } from "@/context/LanguageContext";
import { ApiError } from "@/lib/http";
import { closeListing, deleteListingImage, editListing, getMyListings, type ListingDetail, type ListingStatus } from "@/lib/listings";
import { startCheckout, uploadListingImage } from "@/lib/pirkApi";
import AssetIcon from "@/components/ui/AssetIcon";

const FALLBACK_IMAGE = "/images/no-photo.svg";

export default function MyListingsPage() {
  const { language } = useLanguage();
  const router = useRouter();
  const tr = (en: string, lt: string, ru: string) => language === "LT" ? lt : language === "RU" ? ru : en;

  const [items, setItems] = useState<ListingDetail[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const load = async () => {
    setLoading(true);
    setError("");
    try {
      const page = await getMyListings(0, 100);
      setItems(page.content);
    } catch (e) {
      if (e instanceof ApiError && (e.status === 401 || e.status === 403)) {
        router.replace("/auth/login?return=/account/listings");
        return;
      }
      setError(e instanceof Error ? e.message : tr("Could not load listings", "Nepavyko įkelti skelbimų", "Не удалось загрузить объявления"));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const changeStatus = async (id: string, status: "SOLD" | "CLOSED") => {
    const question =
      status === "SOLD"
        ? tr("Mark this listing as sold? It will no longer be shown to buyers.", "Pažymėti kaip parduotą? Skelbimas nebebus rodomas pirkėjams.", "Отметить как проданное? Объявление больше не будет показано покупателям.")
        : tr("Take this listing down? It will no longer be shown to buyers.", "Išimti skelbimą? Jis nebebus rodomas pirkėjams.", "Снять объявление? Оно больше не будет показано покупателям.");
    if (!window.confirm(question)) return;
    setBusyId(id);
    setError("");
    try {
      await closeListing(id, status === "SOLD");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("Action failed", "Veiksmas nepavyko", "Не удалось выполнить действие"));
    } finally {
      setBusyId(null);
    }
  };

  const pay = async (id: string) => {
    setBusyId(id);
    setError("");
    try {
      const checkout = await startCheckout(Number(id));
      if (checkout.devMode) {
        window.location.href = `/payment/dev?paymentId=${checkout.paymentId}&listingId=${checkout.listingId}&amount=${checkout.amount}`;
        return;
      }
      if (checkout.paymentUrl) {
        window.location.href = checkout.paymentUrl;
        return;
      }
      throw new Error(tr("Payment link was not created", "Mokėjimo nuoroda nesukurta", "Ссылка на оплату не создана"));
    } catch (e) {
      setError(e instanceof Error ? e.message : tr("Payment failed", "Mokėjimas nepavyko", "Ошибка оплаты"));
      setBusyId(null);
    }
  };

  return (
    <main className="min-h-[70vh] bg-background text-foreground">
      <div className="container mx-auto max-w-6xl px-4 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-4xl font-extrabold md:text-5xl">{tr("My listings", "Mano skelbimai", "Мои объявления")}</h1>
            <p className="mt-2 text-muted-foreground">{tr("Manage the cars you are selling on Wheelio.", "Valdykite Wheelio parduodamus automobilius.", "Управляйте автомобилями, которые вы продаёте на Wheelio.")}</p>
          </div>
          <Link href="/sell" className="rounded-xl bg-accent px-5 py-3 font-bold text-black transition hover:brightness-95">+ {tr("Sell a car", "Parduoti automobilį", "Продать автомобиль")}</Link>
        </div>

        {error && <div className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-red-500">{error}</div>}

        {loading ? (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }).map((_, i) => <div key={i} className="h-[360px] animate-pulse rounded-2xl bg-muted" />)}</div>
        ) : items.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-10 text-center">
            <h2 className="text-2xl font-bold">{tr("You have no listings yet", "Dar neturite skelbimų", "У вас пока нет объявлений")}</h2>
            <p className="mt-2 text-muted-foreground">{tr("Create your first car listing and it will appear here.", "Sukurkite pirmą automobilio skelbimą ir jis atsiras čia.", "Создайте первое объявление автомобиля, и оно появится здесь.")}</p>
            <Link href="/sell" className="mt-6 inline-flex rounded-xl bg-accent px-5 py-3 font-bold text-black">{tr("Create listing", "Sukurti skelbimą", "Создать объявление")}</Link>
          </div>
        ) : (
          <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
            {items.map((item) => (
              <article key={item.id} className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
                <div className="relative h-52 bg-muted">
                  <img src={item.thumbnail || FALLBACK_IMAGE} alt={item.title} className="h-full w-full object-cover" onError={(e) => { e.currentTarget.onerror = null; e.currentTarget.src = FALLBACK_IMAGE; }} />
                  <StatusBadge status={item.status} language={language} />
                </div>
                <div className="p-5">
                  <h2 className="text-xl font-extrabold">{item.title}</h2>
                  <div className="mt-2 text-xl font-extrabold text-accent">{formatPrice(item.price)}</div>
                  <div className="mt-2 text-sm text-muted-foreground">{formatMileage(item.mileage)} km{item.createdAt ? ` · ${new Date(item.createdAt).toLocaleDateString(language === "LT" ? "lt-LT" : language === "RU" ? "ru-RU" : "en-GB")}` : ""}</div>

                  <div className="mt-5 flex flex-wrap gap-2">
                    {item.status === "ACTIVE" && <Link href={`/listing/${item.id}`} className="rounded-lg border border-border px-4 py-2 text-sm font-bold hover:border-accent">{tr("Open", "Atidaryti", "Открыть")}</Link>}
                    {item.status === "PENDING_PAYMENT" && <button disabled={busyId === item.id} onClick={() => pay(item.id)} className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black disabled:opacity-50">{tr("Pay & publish", "Apmokėti ir paskelbti", "Оплатить и опубликовать")}</button>}
                    {item.status === "ACTIVE" && <button disabled={busyId === item.id} onClick={() => changeStatus(item.id, "SOLD")} className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-bold text-white disabled:opacity-50">{tr("Mark as sold", "Pažymėti kaip parduotą", "Отметить проданным")}</button>}
                    {(item.status === "ACTIVE" || item.status === "PENDING_PAYMENT") && <button disabled={busyId === item.id} onClick={() => changeStatus(item.id, "CLOSED")} className="rounded-lg border border-border px-4 py-2 text-sm font-bold text-muted-foreground hover:text-foreground disabled:opacity-50">{tr("Take down", "Išimti", "Снять")}</button>}
                    {item.status !== "SOLD" && item.status !== "CLOSED" && <button onClick={() => setEditingId(editingId === item.id ? null : item.id)} className="rounded-lg border border-border px-4 py-2 text-sm font-bold hover:border-accent">{tr("Edit", "Redaguoti", "Редактировать")}</button>}
                  </div>
                  {editingId === item.id && <EditListingPanel item={item} tr={tr} onDone={async () => { setEditingId(null); await load(); }} onReload={load} />}
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}

function StatusBadge({ status, language }: { status?: ListingStatus; language: string }) {
  const labels: Record<string, [string, string, string]> = {
    ACTIVE: ["Active", "Aktyvus", "Активно"],
    SOLD: ["Sold", "Parduota", "Продано"],
    CLOSED: ["Closed", "Uždarytas", "Закрыто"],
    PENDING_PAYMENT: ["Payment required", "Laukia apmokėjimo", "Ожидает оплаты"],
  };
  const colors: Record<string, string> = {
    ACTIVE: "bg-emerald-600 text-white",
    SOLD: "bg-blue-600 text-white",
    CLOSED: "bg-zinc-700 text-white",
    PENDING_PAYMENT: "bg-accent text-black",
  };
  const key = status || "CLOSED";
  const label = labels[key] || labels.CLOSED;
  const text = language === "LT" ? label[1] : language === "RU" ? label[2] : label[0];
  return <span className={`absolute right-3 top-3 rounded-full px-3 py-1 text-xs font-extrabold ${colors[key] || colors.CLOSED}`}>{text}</span>;
}

function formatPrice(value: number) {
  return new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(value);
}
function formatMileage(value: number) {
  return new Intl.NumberFormat("lt-LT").format(value);
}

const MAX_PHOTO_BYTES = 10 * 1024 * 1024;

function EditListingPanel({
  item,
  tr,
  onDone,
  onReload,
}: {
  item: ListingDetail;
  tr: (en: string, lt: string, ru: string) => string;
  onDone: () => Promise<void>;
  onReload: () => Promise<void>;
}) {
  const [price, setPrice] = useState(String(item.price || ""));
  const [description, setDescription] = useState(item.description || "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const images = item.images || [];

  const save = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const value = Number(price);
    if (!Number.isFinite(value) || value <= 0) {
      setError(tr("Price must be greater than zero", "Kaina turi būti didesnė už nulį", "Цена должна быть больше нуля"));
      return;
    }
    if (!description.trim()) {
      setError(tr("Description is required", "Aprašymas privalomas", "Описание обязательно"));
      return;
    }
    setSaving(true);
    setError("");
    try {
      await editListing(item.id, { price: value, description: description.trim() });
      await onDone();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("Could not save", "Nepavyko išsaugoti", "Не удалось сохранить"));
    } finally {
      setSaving(false);
    }
  };

  const removePhoto = async (index: number) => {
    if (!window.confirm(tr("Delete this photo?", "Ištrinti šią nuotrauką?", "Удалить это фото?"))) return;
    setSaving(true);
    setError("");
    try {
      await deleteListingImage(item.id, index);
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("Could not delete the photo", "Nepavyko ištrinti nuotraukos", "Не удалось удалить фото"));
    } finally {
      setSaving(false);
    }
  };

  const addPhotos = async (files: FileList | null) => {
    if (!files?.length) return;
    setSaving(true);
    setError("");
    try {
      for (const file of Array.from(files)) {
        if (file.size > MAX_PHOTO_BYTES) throw new Error(tr("Each photo must be under 10 MB", "Kiekviena nuotrauka turi būti iki 10 MB", "Каждое фото должно быть меньше 10 МБ"));
        await uploadListingImage(Number(item.id), file);
      }
      await onReload();
    } catch (err) {
      setError(err instanceof Error ? err.message : tr("Could not upload the photo", "Nepavyko įkelti nuotraukos", "Не удалось загрузить фото"));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={save} className="mt-5 space-y-3 border-t border-border pt-4">
      <label className="block text-sm font-semibold">
        {tr("Price, EUR", "Kaina, EUR", "Цена, EUR")}
        <input type="number" min={1} step="1" value={price} onChange={(e) => setPrice(e.target.value)} className="mt-1 h-10 w-full rounded-lg border border-border bg-background px-3" />
      </label>
      <label className="block text-sm font-semibold">
        {tr("Description", "Aprašymas", "Описание")}
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} maxLength={10000} rows={5} className="mt-1 w-full rounded-lg border border-border bg-background p-3" />
      </label>
      <div>
        <div className="text-sm font-semibold">{tr("Photos", "Nuotraukos", "Фото")}</div>
        <div className="mt-2 grid grid-cols-3 gap-2">
          {images.map((src, index) => (
            <div key={src} className="relative h-20 overflow-hidden rounded-lg bg-muted">
              <img src={src} alt="" className="h-full w-full object-cover" />
              <button type="button" disabled={saving} onClick={() => removePhoto(index)} aria-label={tr("Delete photo", "Ištrinti nuotrauką", "Удалить фото")} className="absolute right-1 top-1 grid h-6 w-6 place-items-center rounded-full bg-black/70 text-white"><AssetIcon name="close" size={14} /></button>
            </div>
          ))}
        </div>
        <label className="mt-2 inline-block cursor-pointer text-sm font-semibold text-accent">
          + {tr("Add photos", "Pridėti nuotraukų", "Добавить фото")}
          <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={saving} onChange={(e) => { addPhotos(e.target.files); e.target.value = ""; }} />
        </label>
      </div>
      {error && <p className="text-sm text-red-600">{error}</p>}
      <button disabled={saving} className="rounded-lg bg-accent px-4 py-2 text-sm font-bold text-black disabled:opacity-60">
        {saving ? "…" : tr("Save changes", "Išsaugoti", "Сохранить")}
      </button>
    </form>
  );
}
