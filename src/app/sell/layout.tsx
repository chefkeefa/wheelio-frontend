import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Parduoti automobilį – įdėkite skelbimą",
  description: "Parduokite automobilį greitai: įdėkite automobilio skelbimą Wheelio su nuotraukomis, kaina ir kontaktais. Pirkėjai iš visos Lietuvos ir Baltijos šalių.",
  alternates: { canonical: "/sell/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
