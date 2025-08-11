// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

const inter = Inter({
  subsets: ["latin", "latin-ext"],
  variable: "--font-sans",
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "PirkAuto",
  description: "Automobilių paieška ir pardavimas",
  metadataBase: new URL("https://dev.pirkauto.lt"),
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt" className={inter.variable}>
      {/* Фон на всём сайте берётся из bg-background (=> --bg) */}
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <div className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
          <Header />
        </div>
        {/* Без глобального container — ограничивай ширину в секциях страниц */}
        <main className="py-6">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
