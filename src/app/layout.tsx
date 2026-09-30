import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/context/LanguageContext";
import SupportWidget from "@/components/SupportWidget";

export const metadata: Metadata = {
  title: "Wheelio",
  description: "Automobilių paieška ir pardavimas",
  metadataBase: new URL("https://wheelio.lt"),
  alternates: { canonical: "/" },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
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
