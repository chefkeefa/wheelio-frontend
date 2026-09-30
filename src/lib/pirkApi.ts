import { buildUrl, fetchJson } from "@/lib/http";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  surname: string;
  city: string;
  phone: string;
  phoneVerified: boolean;
};

export type LoginResponse = AuthUser & { accessToken: string };

export type VerificationChannel = "SMS" | "CALL";

export async function login(email: string, password: string) {
  return fetchJson<LoginResponse>("/auth/login", {
    method: "POST",
    body: JSON.stringify({ email, password }),
  });
}

export async function me() {
  return fetchJson<AuthUser>("/auth/me");
}

export async function logout() {
  return fetchJson<void>("/auth/logout", { method: "POST" });
}

export async function requestPhoneCode(phone: string, channel: VerificationChannel) {
  return fetchJson<{ expiresInSeconds: number; resendAfterSeconds: number; devCode?: string | null }>(
    "/phone-verification/request",
    { method: "POST", body: JSON.stringify({ phone, channel }) }
  );
}

export async function verifyPhoneCode(phone: string, code: string) {
  return fetchJson<{ verified: boolean; verificationToken: string }>(
    "/phone-verification/verify",
    { method: "POST", body: JSON.stringify({ phone, code }) }
  );
}

export async function attachVerifiedPhone(phone: string, verificationToken: string) {
  return fetchJson<AuthUser>("/phone-verification/attach", {
    method: "POST",
    body: JSON.stringify({ phone, verificationToken }),
  });
}

export async function updateProfile(payload: { name: string; surname: string; city: string }) {
  return fetchJson<{ success: boolean }>("/users/change/info", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function registerUser(payload: {
  email: string;
  name: string;
  surname: string;
  city: string;
  address: string;
  zip: string;
  phone: string;
  verificationToken: string;
  password: string;
}) {
  return fetchJson<{ id: number }>("/users/register", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function sendSupportTicket(payload: {
  name?: string;
  email?: string;
  phone?: string;
  category: string;
  subject: string;
  message: string;
}) {
  return fetchJson<{ id: number; status: string }>("/support/tickets", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export type PaymentConfig = { publicationPrice: number; currency: string; devMode: boolean };
export type Checkout = { paymentId: number | null; listingId: number; amount: number; currency: string; paymentUrl?: string | null; devMode: boolean; promoApplied?: boolean };
export type PaymentInfo = { id: number; listingId: number; amount: number; currency: string; status: string; listingStatus: string };

export function getPaymentConfig() {
  return fetchJson<PaymentConfig>("/pay/config");
}

export function validatePromoCode(promoCode: string) {
  return fetchJson<{ valid: boolean }>("/pay/promo/validate", {
    method: "POST",
    body: JSON.stringify({ promoCode }),
  });
}

export function startCheckout(listingId: number, promoCode?: string) {
  return fetchJson<Checkout>(`/pay/listings/${listingId}/checkout`, {
    method: "POST",
    ...(promoCode ? { body: JSON.stringify({ promoCode }) } : {}),
  });
}

export function getPayment(paymentId: number) {
  return fetchJson<PaymentInfo>(`/pay/${paymentId}`);
}

export function completeDevPayment(paymentId: number) {
  return fetchJson<PaymentInfo>(`/pay/${paymentId}/dev-complete`, { method: "POST" });
}

export type ListingCreatePayload = {
  mark: string;
  model: string;
  generation: string;
  configuration: string;
  modification: string;
  price: number;
  description: string;
  details: { year: number; mileage: number };
};

export function createPendingListing(payload: ListingCreatePayload) {
  return fetchJson<{ id: number; status: string; createdAt: string }>("/listings/create", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export async function uploadListingImage(listingId: number, file: File, viewType?: PhotoViewType) {
  const form = new FormData();
  form.append("file", file);
  if (viewType) form.append("viewType", viewType);
  const response = await fetch(buildUrl(`/listings/${listingId}/images`), {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Image upload failed: ${response.status}`);
  }
  return response.json() as Promise<{ id: number; url: string; preview: string }>;
}


export type PhotoViewType =
  | "FRONT"
  | "REAR"
  | "LEFT_SIDE"
  | "RIGHT_SIDE"
  | "INTERIOR"
  | "DASHBOARD"
  | "VIN_PLATE"
  | "OTHER";

export type PhotoClassification = {
  label: PhotoViewType;
  confidence: number;
  source: string;
};

export async function classifyListingPhoto(file: File) {
  const form = new FormData();
  form.append("file", file);
  const response = await fetch(buildUrl("/photo-classification"), {
    method: "POST",
    body: form,
    credentials: "include",
  });
  if (!response.ok) {
    const text = await response.text();
    throw new Error(text || `Photo classification failed: ${response.status}`);
  }
  return response.json() as Promise<PhotoClassification>;
}

export type LiveSupportConversation = {
  id: number;
  accessToken?: string | null;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  status: "OPEN" | "CLOSED";
  createdAt: string;
  updatedAt: string;
};

export type LiveSupportMessage = {
  id: number;
  conversationId: number;
  sender: "USER" | "AGENT" | "SYSTEM";
  message: string;
  createdAt: string;
};

export function startLiveSupport(payload: { name?: string; email?: string; phone?: string }) {
  return fetchJson<LiveSupportConversation>("/support/live", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getLiveSupportMessages(id: number, token?: string) {
  return fetchJson<LiveSupportMessage[]>(
    `/support/live/${id}/messages${token ? `?token=${encodeURIComponent(token)}` : ""}`
  );
}

export function sendLiveSupportMessage(id: number, message: string, token?: string) {
  return fetchJson<LiveSupportMessage>(
    `/support/live/${id}/messages${token ? `?token=${encodeURIComponent(token)}` : ""}`,
    { method: "POST", body: JSON.stringify({ message }) }
  );
}

export function liveSupportStreamUrl(id: number, token?: string) {
  return buildUrl(`/support/live/${id}/stream`, token ? { token } : undefined);
}

export function listSupportConversations(page = 0, size = 50) {
  return fetchJson<{ content: LiveSupportConversation[]; totalElements: number }>(
    `/support/live/agent/conversations?page=${page}&size=${size}`
  );
}

export function sendAgentSupportMessage(id: number, message: string) {
  return fetchJson<LiveSupportMessage>(`/support/live/agent/conversations/${id}/messages`, {
    method: "POST",
    body: JSON.stringify({ message }),
  });
}

export function setSupportConversationClosed(id: number, value: boolean) {
  return fetchJson<LiveSupportConversation>(
    `/support/live/agent/conversations/${id}/closed?value=${value ? "true" : "false"}`,
    { method: "POST" }
  );
}

export function googleLoginUrl() {
  return buildUrl("/auth/google");
}
