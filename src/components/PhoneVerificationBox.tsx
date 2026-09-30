"use client";

import { useEffect, useState } from "react";
import { useLanguage } from "@/context/LanguageContext";
import {
  getPhoneVerificationConfig,
  requestPhoneCode,
  verifyPhoneCode,
  type PhoneVerificationConfig,
  type VerificationChannel,
} from "@/lib/pirkApi";

type Props = {
  phone: string;
  onPhoneChange: (value: string) => void;
  /** Called with the one-time token and the normalized (E.164) number after a successful check. */
  onVerified: (verificationToken: string, normalizedPhone: string) => void | Promise<void>;
  verified?: boolean;
  inputClassName?: string;
};

/**
 * Phone verification UI shared by registration and /verify-phone.
 * Only channels reported by GET /phone-verification/config are offered, and the success
 * message describes the channel the backend actually used (never "call" for an SMS).
 */
export default function PhoneVerificationBox({ phone, onPhoneChange, onVerified, verified = false, inputClassName }: Props) {
  const { tr } = useLanguage();
  const [config, setConfig] = useState<PhoneVerificationConfig | null>(null);
  const [code, setCode] = useState("");
  const [sending, setSending] = useState(false);
  const [checking, setChecking] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [devCode, setDevCode] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    let alive = true;
    getPhoneVerificationConfig()
      .then((c) => alive && setConfig(c))
      .catch(() => {
        // Older backends have no config endpoint: they only support SMS.
        if (alive) setConfig({ available: true, channels: ["SMS"], voiceAvailable: false });
      });
    return () => {
      alive = false;
    };
  }, []);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((s) => Math.max(0, s - 1)), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const input = inputClassName || "h-12 w-full rounded-lg bg-[#cecece] px-4 text-black outline-none focus:ring-2 focus:ring-accent";
  const channels = config?.channels || [];

  async function send(channel: VerificationChannel) {
    setError("");
    setMessage("");
    setSending(true);
    try {
      const r = await requestPhoneCode(phone, channel);
      const used = r.channel || "SMS";
      const target = r.phone || phone;
      setDevCode(r.devCode || "");
      setCooldown(r.resendAfterSeconds || 60);
      setMessage(
        used === "CALL"
          ? tr(`We are calling ${target}. Listen for the 6-digit code.`, `Skambiname ${target}. Išklausykite 6 skaitmenų kodą.`, `Звоним на ${target}. Прослушайте 6-значный код.`)
          : tr(`Code sent by SMS to ${target}.`, `Kodas išsiųstas SMS žinute į ${target}.`, `Код отправлен по SMS на ${target}.`)
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setSending(false);
    }
  }

  async function check() {
    setError("");
    setChecking(true);
    try {
      const r = await verifyPhoneCode(phone, code);
      await onVerified(r.verificationToken, r.phone || phone);
      setMessage(tr("Phone verified ✓", "Telefonas patvirtintas ✓", "Телефон подтверждён ✓"));
      setDevCode("");
    } catch (e) {
      setError(e instanceof Error ? e.message : String(e));
    } finally {
      setChecking(false);
    }
  }

  if (config && !config.available) {
    return (
      <div className="rounded-lg bg-amber-500/10 p-3 text-sm text-amber-700">
        {tr(
          "Phone verification is temporarily unavailable. Please try again later or contact support.",
          "Telefono patvirtinimas laikinai nepasiekiamas. Bandykite vėliau arba susisiekite su pagalba.",
          "Подтверждение телефона временно недоступно. Попробуйте позже или обратитесь в поддержку."
        )}
      </div>
    );
  }

  const busy = sending || !config || cooldown > 0 || verified;
  return (
    <div>
      <p className="mb-2 text-sm text-muted-foreground">
        {channels.includes("CALL")
          ? tr("Receive the code by SMS or by a voice call.", "Gaukite kodą SMS žinute arba skambučiu.", "Получите код по SMS или голосовым звонком.")
          : tr("We will send the code by SMS.", "Kodą atsiųsime SMS žinute.", "Мы отправим код по SMS.")}
      </p>
      <div className="grid gap-2 sm:grid-cols-[1fr_auto_auto]">
        <input
          className={input}
          type="tel"
          inputMode="tel"
          autoComplete="tel"
          required
          placeholder="+3706XXXXXXX"
          value={phone}
          disabled={verified}
          onChange={(e) => onPhoneChange(e.target.value)}
        />
        {channels.includes("SMS") && (
          <button type="button" disabled={busy || !phone.trim()} onClick={() => send("SMS")} className="min-h-11 rounded-lg border border-border px-4 font-bold hover:bg-background disabled:opacity-50">
            {cooldown > 0 ? `SMS (${cooldown}s)` : tr("Send SMS code", "Siųsti SMS kodą", "Отправить SMS")}
          </button>
        )}
        {channels.includes("CALL") && (
          <button type="button" disabled={busy || !phone.trim()} onClick={() => send("CALL")} className="min-h-11 rounded-lg border border-border px-4 font-bold hover:bg-background disabled:opacity-50">
            {tr("Call me", "Paskambinti", "Позвонить")}
          </button>
        )}
      </div>
      {!verified && (
        <div className="mt-3 flex gap-2">
          <input
            className={input}
            inputMode="numeric"
            autoComplete="one-time-code"
            maxLength={6}
            placeholder={tr("6-digit code", "6 skaitmenų kodas", "6-значный код")}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
          />
          <button type="button" disabled={checking || code.length !== 6} onClick={check} className="min-h-11 rounded-lg bg-[#5f5f5f] px-5 font-bold text-white hover:bg-accent disabled:opacity-50">
            {checking ? "…" : tr("Verify", "Patvirtinti", "Подтвердить")}
          </button>
        </div>
      )}
      {devCode && (
        <div className="mt-2 text-sm text-amber-600">
          DEV code: <b>{devCode}</b>
        </div>
      )}
      {message && <div className="mt-2 text-sm text-green-600">{message}</div>}
      {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
    </div>
  );
}
