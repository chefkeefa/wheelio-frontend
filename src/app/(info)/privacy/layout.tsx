import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Privatumo politika",
  description: "Kokius asmens duomenis tvarko Wheelio, kodėl ir kaip galite pasinaudoti savo teisėmis.",
  alternates: { canonical: "/privacy/" },
};

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
