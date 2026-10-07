import type { Metadata } from "next";

// Seller pages hold little text of their own and change often, so they are not indexed; listings are.
export const metadata: Metadata = { title: "Pardavėjas", robots: { index: false, follow: true } };

export default function UserLayout({ children }: { children: React.ReactNode }) {
  return children;
}
