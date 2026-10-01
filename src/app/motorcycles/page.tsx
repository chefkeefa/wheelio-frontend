import type { Metadata } from "next";
import ComingSoon from "@/components/ComingSoon";

export const metadata: Metadata = { title: "Motorcycles", robots: { index: false } };

export default function Page() {
  return <ComingSoon section="motorcycles" />;
}
