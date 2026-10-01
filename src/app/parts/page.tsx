import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Car parts", robots: { index: false } };

export default function Page() {
  return <ComingSoon section="parts" />;
}
