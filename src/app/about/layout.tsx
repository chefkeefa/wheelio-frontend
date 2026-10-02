import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Apie Wheelio",
  description: "Wheelio – moderni automobilių skelbimų svetainė Lietuvoje ir Baltijos šalyse, kurioje paprasta pirkti ir parduoti automobilį.",
  alternates: { canonical: "/about/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
