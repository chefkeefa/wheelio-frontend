import type { Metadata, Viewport } from "next";
// Fonts are bundled from npm (@fontsource) instead of next/font/google: the build must not depend on
// reaching Google Fonts (the Hostinger build failed there).
import "@fontsource-variable/inter/wght.css";
import "@fontsource/anybody/700.css";
import "@fontsource/anybody/800.css";
import "./globals.css";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { LanguageProvider } from "@/context/LanguageContext";
import { SITE_URL } from "@/lib/config";
import SupportWidget from "@/components/SupportWidget";
import JsonLd from "@/components/JsonLd";
import { DEFAULT_OG_IMAGE, SITE_DESCRIPTION, SITE_KEYWORDS, SITE_NAME, SITE_TITLE } from "@/lib/seo";

// No site-wide canonical: a canonical of "/" on every page told search engines that all pages
// duplicate the home page. Pages that need one set it themselves (see listing/[id]/layout.tsx).
export const metadata: Metadata = {
  title: { default: SITE_TITLE, template: "%s | Wheelio" },
  description: SITE_DESCRIPTION,
  keywords: SITE_KEYWORDS,
  applicationName: SITE_NAME,
  metadataBase: new URL(SITE_URL),
  openGraph: {
    siteName: SITE_NAME,
    type: "website",
    locale: "lt_LT",
    alternateLocale: ["en_US", "ru_RU"],
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [{ url: DEFAULT_OG_IMAGE, alt: "Wheelio automobilių skelbimai" }],
  },
  twitter: { card: "summary_large_image" },
  // Google Search Console "HTML tag" verification code, if that method is used instead of DNS.
  verification: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION
    ? { google: process.env.NEXT_PUBLIC_GOOGLE_SITE_VERIFICATION }
    : undefined,
};

// Tells Google the site name ("Wheelio" instead of the bare domain) and the logo for results.
const siteJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITE_URL}/#website`,
      url: `${SITE_URL}/`,
      name: SITE_NAME,
      alternateName: ["Wheelio.lt", "Wheelio automobilių skelbimai"],
      description: SITE_DESCRIPTION,
      inLanguage: "lt-LT",
    },
    {
      "@type": "Organization",
      "@id": `${SITE_URL}/#organization`,
      name: SITE_NAME,
      url: `${SITE_URL}/`,
      logo: `${SITE_URL}/images/wheeliologo.svg`,
      areaServed: ["LT", "LV", "EE"],
    },
  ],
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="lt">
      <body className="flex min-h-screen flex-col bg-background text-foreground font-sans antialiased">
        <JsonLd data={siteJsonLd} />
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
