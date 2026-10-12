import type { Metadata } from "next";

// Private section: crawlable (so Google can see this tag) but never indexed.
export const metadata: Metadata = { robots: { index: false, follow: false } };

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
