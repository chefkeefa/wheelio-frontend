// src/app/layout.tsx
import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { AuthProvider } from "@/contexts/AuthContext";

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
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <AuthProvider>
          {/* липкий хедер */}
          <div className="sticky top-0 z-40 border-b border-[hsl(var(--border))] bg-white/95 backdrop-blur supports-[backdrop-filter]:bg-white/60">
            <Header />
          </div>

          {/* БЕЗ верхнего паддинга + гасим margin у первого блока */}
          <main className="pt-0 pb-6 [&>*:first-child]:mt-0">
            {children}
          </main>

          <Footer />
        </AuthProvider>
      </body>
    </html>
  );
}
