// src/components/Footer.tsx
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="mt-10 border-t border-[hsl(var(--border))] bg-[hsl(var(--card))]">
      {/* Верхняя зона футера */}
      <div className="container grid gap-8 py-10 md:grid-cols-4">
        {/* Бренд */}
        <div className="space-y-3 md:col-span-1">
          <Link href="/" className="flex items-center gap-2">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-black text-xs font-bold text-white">
              PA
            </div>
            <span className="text-lg font-semibold tracking-tight">PirkAuto</span>
          </Link>
          <p className="text-sm text-[hsl(var(--muted-fg))]">
            Išmanus būdas rasti ar parduoti automobilį Lietuvoje.
          </p>
        </div>

        {/* Колонка 1 */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Pirkėjams</div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li><Link href="/search" className="hover:underline">Paieška</Link></li>
            <li><Link href="/listing/?id=1" className="hover:underline">Pavyzdinis skelbimas</Link></li>
          </ul>
        </div>

        {/* Колонка 2 */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Pardavėjams</div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li><Link href="/sell" className="hover:underline">Patalpinti skelbimą</Link></li>
            <li><Link href="/about" className="hover:underline">Apie mus</Link></li>
          </ul>
        </div>

        {/* Колонка 3 */}
        <div className="space-y-3">
          <div className="text-sm font-semibold">Teisinė informacija</div>
          <ul className="space-y-2 text-sm text-gray-700">
            <li><Link href="/terms" className="hover:underline">Taisyklės</Link></li>
            <li><Link href="/privacy" className="hover:underline">Privatumo politika</Link></li>
          </ul>
        </div>
      </div>

      {/* Низ футера */}
      <div className="border-t border-[hsl(var(--border))]">
        <div className="container flex items-center justify-between py-4 text-xs text-gray-600">
          <div>© 2025 PirkAuto. Visos teisės saugomos.</div>
          <div className="flex items-center gap-3">
            <Link href="mailto:hello@pirkauto.lt" className="hover:underline">hello@pirkauto.lt</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
