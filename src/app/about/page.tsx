// src/app/about/page.tsx
import Link from "next/link";

export default function AboutPage() {
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-bold">Apie PirkAuto</h1>
      <p className="text-gray-700">
        PirkAuto — paprastas būdas pirkti ir parduoti automobilius Lietuvoje.
        Čia bus tekstas apie projektą, misiją ir komandos tikslus.
      </p>
      <Link href="/" className="text-blue-600 hover:underline">← Grįžti į pradžią</Link>
    </section>
  );
}
