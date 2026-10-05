import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Pranešti apie neteisėtą turinį",
  description: "Pranešimas apie neteisėtą skelbimą ar kitą turinį Wheelio pagal Skaitmeninių paslaugų aktą.",
  alternates: { canonical: "/report/" },
  robots: { index: false, follow: true },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
