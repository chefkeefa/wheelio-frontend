// src/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-16 border-t border-[#d9a339] bg-[hsl(var(--card))]">
      <div className="container py-8">
        <div className="flex justify-center gap-8">
          <Link 
            href="/about" 
            className="text-[#5f5f5f] text-xl font-medium hover:text-black transition-colors"
          >
            About us
          </Link>
          <Link 
            href="/help" 
            className="text-[#5f5f5f] text-xl font-medium hover:text-black transition-colors"
          >
            Help
          </Link>
          <Link 
            href="/rules" 
            className="text-[#5f5f5f] text-xl font-medium hover:text-black transition-colors"
          >
            Rules
          </Link>
        </div>
      </div>
    </footer>
  );
}
