import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/context/LanguageContext";
import SupportWidget from "@/components/SupportWidget";

const inter = Inter({
  subsets: ["latin", "latin-ext", "cyrillic"],
  variable: "--font-sans",
  weight: ["400", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "Wheelio | Car listings",
  description: "Find and list cars on Wheelio.",
  metadataBase: new URL("https://wheelio.lt"),
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen bg-background text-foreground font-sans antialiased">
        <LanguageProvider>
          <Header />
          <main className="pt-0 pb-6 [&>*:first-child]:mt-0">{children}</main>
          <Footer />
          <SupportWidget />
        </LanguageProvider>
      </body>
    </html>
  );
}
