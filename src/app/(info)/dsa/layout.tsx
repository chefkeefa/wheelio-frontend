import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Skaitmeninių paslaugų aktas",
  description: "Wheelio kontaktiniai centrai, pranešimai apie neteisėtą turinį, moderavimas ir sprendimų skundimas pagal Skaitmeninių paslaugų aktą (ES) 2022/2065.",
  alternates: { canonical: "/dsa/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
