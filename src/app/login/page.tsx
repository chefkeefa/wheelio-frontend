"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";

export default function OAuthFailureAlias() {
  const router = useRouter();
  useEffect(() => router.replace("/auth/login?oauthError=google"), [router]);
  return <main className="container py-12 text-center">Returning to sign in…</main>;
}
