import Link from "next/link";

interface CarCardProps {
  id: string;
  title: string;
  description?: string;
  price: number;
  imageUrl?: string;
  size?: 'large' | 'small';
}

export default function CarCard({ 
  id, 
  title, 
  description = "text/text/text/text", 
  price, 
  imageUrl,
  size = 'large'
}: CarCardProps) {
  const isLarge = size === 'large';
  
  return (
    <Link href={`/listing/?id=${id}`} className="block">
      <article className="bg-white rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
        {/* Car Image */}
        <div className={`relative bg-[hsl(var(--muted))] ${isLarge ? 'h-64' : 'h-52'}`}>
          {imageUrl ? (
            <img
              src={imageUrl}
              alt={title}
              className="absolute inset-0 w-full h-full object-cover rounded border-2 border-[#d9a339]"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full bg-[hsl(var(--muted))] rounded border-2 border-[#d9a339]" />
          )}
        </div>

        {/* Card Content */}
        <div className={`p-4 space-y-2 ${isLarge ? 'p-6' : 'p-4'}`}>
          <div className="text-[#5f5f5f] text-sm font-bold">Text</div>
          <h3 className="text-black text-base font-bold">{title}</h3>
          <p className="text-[#5f5f5f] text-sm">{description}</p>
          
          {/* Divider */}
          <div className="border-t border-[#d9a339] my-3"></div>
          
          <div className="text-[#5f5f5f] text-sm font-bold">Price</div>
          <div className="text-black text-xl font-bold">
            {price.toLocaleString()} €
          </div>
          
          {/* View Button */}
          <button className={`w-full bg-[#5f5f5f] text-white font-extrabold text-xl rounded-lg hover:bg-gray-700 transition-colors ${isLarge ? 'h-10 py-2' : 'h-8 py-1'}`}>
            View
          </button>
        </div>
      </article>
    </Link>
  );
}
