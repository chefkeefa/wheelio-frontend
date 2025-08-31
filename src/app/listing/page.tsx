/* eslint-disable @next/next/no-img-element */
"use client";

import { useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { anybody } from "@/lib/fonts";
import { getListingById } from "@/lib/listings";
import Button from "@/components/Button";
import { formatPrice } from "@/lib/format";

export default function ListingPage() {
  const sp = useSearchParams();
  const id = sp.get("id") || "";

  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<Awaited<ReturnType<typeof getListingById>> | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const d = await getListingById(id);
        if (!alive) return;
        setData(d);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [id]);

  if (!id) return <div className="container mx-auto px-4 py-6">No listing id provided.</div>;
  if (loading) return <div className="container mx-auto px-4 py-6">Loading...</div>;
  if (!data) return <div className="container mx-auto px-4 py-6">Listing not found.</div>;

  const priceText = formatPrice(data.price);

  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className={`${anybody.className} mb-2 text-3xl font-extrabold`}>{data.title}</h1>
      <div className={`${anybody.className} mb-4 text-lg font-bold`}>{priceText}</div>

      <div className="mb-6 grid grid-cols-1 gap-4 md:grid-cols-2">
        {data.images && data.images.length > 0 ? (
          data.images.map((src, i) => (
            <div className="relative h-64 w-full overflow-hidden rounded-lg bg-[hsl(var(--muted))]" key={i}>
              <img src={src} alt={`photo ${i + 1}`} className="absolute inset-0 h-full w-full object-cover" />
            </div>
          ))
        ) : (
          <div className="relative h-64 w-full overflow-hidden rounded-lg bg-[hsl(var(--muted))]">
            <img
              src={data.thumbnail || "https://placehold.co/800x600/png"}
              alt={data.title}
              className="absolute inset-0 h-full w-full object-cover"
            />
          </div>
        )}
      </div>

      {data.description && <p className="mb-6 max-w-3xl text-[15px] leading-relaxed">{data.description}</p>}

      <div className="flex gap-3">
        <Button>Buy</Button>
        <Button variant="outline">Add to favorites</Button>
      </div>
    </div>
  );
}
