/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { formatPrice } from "@/lib/format";

interface CarCardProps {
  id: string;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  size?: "large" | "small";
}

export default function CarCard({
  id,
  title,
  description = "text/text/text/text",
  price,
  imageUrl,
  size = "large",
}: CarCardProps) {
  const isLarge = size === "large";
  const src = imageUrl && imageUrl.length > 0 ? imageUrl : "/placeholder-car.jpg";
  const btnHeight = isLarge ? "h-10" : "h-8";

  return (
    <Link href={`/listing?id=${id}`} className="block" prefetch={false}>
      <article className="overflow-hidden rounded-lg bg-white transition-shadow hover:shadow-lg">
        {/* Car Image */}
        <div className={`relative bg-[hsl(var(--muted))] ${isLarge ? "h-64" : "h-52"}`}>
          <img
            src={src}
            alt={title}
            className="absolute inset-0 h-full w-full rounded border-2 border-[hsl(var(--accent))] object-cover"
            loading="lazy"
          />
        </div>

        {/* Card Content */}
        <div className={`space-y-2 ${isLarge ? "p-6" : "p-4"}`}>
          <div className="text-sm font-bold text-[#5f5f5f]">Text</div>
          <h3 className="text-base font-bold text-black">{title}</h3>
          <p className="text-sm text-[#5f5f5f]">{description}</p>

          <div className="my-3 border-t border-[hsl(var(--accent))]" />

          <div className="text-sm font-bold text-[#5f5f5f]">Price</div>
          <div className="text-xl font-bold text-black">{formatPrice(price)}</div>

          {/* View — центрировано */}
          <button
            type="button"
            className={`w-full ${btnHeight} flex items-center justify-center rounded-lg bg-[#5f5f5f] text-xl font-extrabold text-white transition-colors hover:bg-gray-700`}
          >
            View
          </button>
        </div>
      </article>
    </Link>
  );
}
