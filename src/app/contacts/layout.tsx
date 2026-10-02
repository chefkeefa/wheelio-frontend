import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Kontaktai",
  description: "Kaip susisiekti su Wheelio: el. paštas, pokalbis internetu ir pagalbos centras.",
  alternates: { canonical: "/contacts/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
