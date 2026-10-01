import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pagalba",
  description: "Wheelio pagalba: atsakymai į klausimus apie automobilių skelbimus, paskyrą ir mokėjimus. Parašykite mums tiesiogiai.",
  alternates: { canonical: "/help/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
