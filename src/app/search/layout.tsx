import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Automobilių paieška – naudoti automobiliai pardavimui",
  description: "Ieškokite automobilių skelbimų Wheelio: filtruokite pagal markę, modelį, metus, ridą, kainą, kuro tipą ir miestą. Nauji skelbimai kasdien.",
  alternates: { canonical: "/search/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
