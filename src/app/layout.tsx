import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/context/LanguageContext";
import { SITE_URL } from "@/lib/config";
import SupportWidget from "@/components/SupportWidget";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-sans",
  weight: ["400", "600", "700"],
  display: "swap",
});

// No site-wide canonical: a canonical of "/" on every page told search engines that all pages
// duplicate the home page. Pages that need one set it themselves (see listing/[id]/layout.tsx).
export const metadata: Metadata = {
  title: { default: "Wheelio | Car listings", template: "%s | Wheelio" },
  description: "Find and list cars on Wheelio.",
  metadataBase: new URL(SITE_URL),
  openGraph: { siteName: "Wheelio", type: "website" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="flex min-h-screen flex-col bg-background text-foreground font-sans antialiased">
        <LanguageProvider>
          <Header />
          <main className="flex-1 pb-16 md:pb-24 [&>*:first-child]:mt-0">{children}</main>
          <Footer />
          <SupportWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
