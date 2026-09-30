import type { Metadata } from "next";
import type { ReactNode } from "react";

// The reset link carries a one-time token; do not leak it through the Referer header.
export const metadata: Metadata = {
  title: "Reset password | Wheelio",
  referrer: "no-referrer",
  robots: { index: false, follow: false },
};

export default function ResetPasswordLayout({ children }: { children: ReactNode }) {
  return children;
}
