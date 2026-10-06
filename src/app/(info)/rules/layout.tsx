import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Taisyklės",
  description: "Wheelio automobilių skelbimų svetainės naudojimo taisyklės pirkėjams ir pardavėjams.",
  alternates: { canonical: "/rules/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
