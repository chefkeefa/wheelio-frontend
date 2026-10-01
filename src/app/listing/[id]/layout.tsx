import type { Metadata } from "next";
import JsonLd from "@/components/JsonLd";
import { SITE_URL } from "@/lib/config";
import { getSeoListingDetail, type SeoListingDetail } from "@/lib/seo";

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

function carName(listing: SeoListingDetail) {
  return listing.title || [listing.mark, listing.model, listing.year].filter(Boolean).join(" ") || "Automobilis";
}

// The page itself is a client component; this layout gives search engines and link previews
// a real title, description, image, canonical URL and structured data for each listing.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getSeoListingDetail(id);
  if (!listing) return { title: "Skelbimas", robots: { index: false } };

  const price = new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(listing.price);
  const name = carName(listing);
  const title = `${name} – ${price}${listing.city ? `, ${listing.city}` : ""}`;
  const facts = [
    listing.year ? `${listing.year} m.` : null,
    listing.mileage ? `${new Intl.NumberFormat("lt-LT").format(listing.mileage)} km` : null,
    price,
    listing.city,
  ]
    .filter(Boolean)
    .join(" · ");
  const text = (listing.description || "").replace(/\s+/g, " ").trim();
  const description = `Parduodamas ${name}: ${facts}.${text ? ` ${text}` : " Automobilio skelbimas Wheelio."}`.slice(0, 160);
  const url = `/listing/${listing.id}/`;
  const image = listing.thumbnail || listing.images?.[0];

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: image ? [image] : undefined },
  };
}

function carJsonLd(listing: SeoListingDetail) {
  const images = [...(listing.images ?? []), ...(listing.thumbnail ? [listing.thumbnail] : [])];
  const sold = listing.status === "SOLD" || listing.status === "CLOSED";
  return {
    "@context": "https://schema.org",
    "@type": "Car",
    name: carName(listing),
    url: `${SITE_URL}/listing/${listing.id}/`,
    description: (listing.description || "").replace(/\s+/g, " ").trim().slice(0, 500) || undefined,
    image: images.length ? images.slice(0, 10) : undefined,
    brand: listing.mark ? { "@type": "Brand", name: listing.mark } : undefined,
    model: listing.model || undefined,
    vehicleModelDate: listing.year ? String(listing.year) : undefined,
    mileageFromOdometer: listing.mileage
      ? { "@type": "QuantitativeValue", value: listing.mileage, unitCode: "KMT" }
      : undefined,
    fuelType: listing.fuel || undefined,
    vehicleTransmission: listing.transmission || undefined,
    itemCondition: "https://schema.org/UsedCondition",
    offers: {
      "@type": "Offer",
      price: listing.price,
      priceCurrency: "EUR",
      availability: sold ? "https://schema.org/SoldOut" : "https://schema.org/InStock",
      url: `${SITE_URL}/listing/${listing.id}/`,
      areaServed: listing.city ? { "@type": "City", name: listing.city } : undefined,
    },
  };
}

export default async function ListingLayout({ params, children }: Props) {
  const { id } = await params;
  // Same cached request as generateMetadata, so no extra API call.
  const listing = await getSeoListingDetail(id);
  return (
    <>
      {listing && <JsonLd data={carJsonLd(listing)} />}
      {children}
    </>
  );
}
