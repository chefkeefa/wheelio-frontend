import type { Metadata } from "next";
import { getSeoListing } from "@/lib/seo";

type Props = { params: Promise<{ id: string }>; children: React.ReactNode };

// The page itself is a client component; this layout gives search engines and link previews
// a real title, description, image and canonical URL for each listing.
export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const { id } = await params;
  const listing = await getSeoListing(id);
  if (!listing) return { title: "Listing", robots: { index: false } };

  const price = new Intl.NumberFormat("lt-LT", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(listing.price);
  const title = `${listing.title || [listing.mark, listing.model, listing.year].filter(Boolean).join(" ") || "Car"} – ${price}`;
  const facts = [listing.year, listing.mileage ? `${new Intl.NumberFormat("lt-LT").format(listing.mileage)} km` : null, price]
    .filter(Boolean)
    .join(" · ");
  const text = (listing.description || "").replace(/\s+/g, " ").trim();
  const description = (text ? `${facts}. ${text}` : facts).slice(0, 160);
  const url = `/listing/${listing.id}/`;

  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", images: listing.thumbnail ? [listing.thumbnail] : undefined },
  };
}

export default function ListingLayout({ children }: Props) {
  return children;
}
