import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";

export const metadata: Metadata = {
  title: "PirkAuto",
  description: "Pirk ir parduok automobilį lengvai",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt">
      <body className="min-h-screen bg-gray-50 text-gray-900 flex flex-col">
        {/* Хедер */}
        <Header />

        {/* Основной контент */}
        <main className="flex-grow mx-auto max-w-7xl px-4 py-6">
          {children}
        </main>

        {/* Футер */}
        <Footer />
      </body>
    </html>
  );
}
