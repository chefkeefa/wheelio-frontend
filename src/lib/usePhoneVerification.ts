"use client";

import { useEffect, useState } from "react";
import { getPhoneVerificationConfig, type AuthUser, type PhoneVerificationConfig } from "@/lib/pirkApi";

// Older backends have no config endpoint: they only support SMS.
const FALLBACK: PhoneVerificationConfig = { enabled: true, available: true, channels: ["SMS"], voiceAvailable: false };
let cached: Promise<PhoneVerificationConfig> | null = null;

/** Loads GET /phone-verification/config once per page load and shares it between components. */
export function loadPhoneVerificationConfig() {
  if (!cached) cached = getPhoneVerificationConfig().catch(() => FALLBACK);
  return cached;
}

export function usePhoneVerificationConfig() {
  const [config, setConfig] = useState<PhoneVerificationConfig | null>(null);
  useEffect(() => {
    let alive = true;
    loadPhoneVerificationConfig().then((c) => alive && setConfig(c));
    return () => {
      alive = false;
    };
  }, []);
  return config;
}

/** True when SMS verification is switched off on the backend (PHONE_VERIFICATION_ENABLED=false). */
export const verificationOff = (config: PhoneVerificationConfig | null | undefined) => config?.enabled === false;

/** Whether the user still has to add (verification off) or verify (verification on) a phone before publishing. */
export function needsPhone(user: AuthUser | null | undefined, config: PhoneVerificationConfig | null | undefined) {
  if (!user) return false;
  return verificationOff(config) ? !user.phone : !user.phoneVerified;
}
