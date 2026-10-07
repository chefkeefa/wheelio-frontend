import { ApiError, apiFetch, buildUrl, fetchJson, toApiError } from "@/lib/http";

export type AuthUser = {
  id: number;
  email: string;
  name: string;
  surname: string;
  city: string;
  phone: string;
  phoneVerified: boolean;
  /** Returned by newer backends: "PASSWORD" or "GOOGLE". */
  authProvider?: string;
  /** Returned by newer backends; used to show the admin panel. */
  roles?: string[];
  /** true/false; null while e-mail confirmation is off on the backend. */
  emailVerified?: boolean | null;
};

export function isAdminUser(user: AuthUser | null | undefined) {
  return Boolean(user?.roles?.some((r) => ["ADMIN", "ROLE_ADMIN"].includes(String(r).toUpperCase())));
}

export function isSupportUser(user: AuthUser | null | undefined) {
  return Boolean(user?.roles?.some((r) => ["ADMIN", "ROLE_ADMIN", "SUPPORT", "MODERATOR"].includes(String(r).toUpperCase())));
}

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

/** Erases the signed-in user's account and personal data (GDPR). Cannot be undone. */
export function deleteOwnAccount(confirmEmail: string, password?: string) {
  return fetchJson<{ success: boolean }>("/account/delete", {
    method: "POST",
    body: JSON.stringify(password ? { confirmEmail, password } : { confirmEmail }),
  });
}

export async function logout() {
  return fetchJson<void>("/auth/logout", { method: "POST" });
}

export type PhoneVerificationConfig = {
  /** false when the backend runs with PHONE_VERIFICATION_ENABLED=false (older backends omit it). */
  enabled?: boolean;
  available: boolean;
  channels: VerificationChannel[];
  voiceAvailable: boolean;
};

export async function changePassword(oldPassword: string, newPassword: string) {
  return fetchJson<{ success: boolean }>("/users/change/password", {
    method: "POST",
    body: JSON.stringify({ oldPassword, newPassword }),
  });
}

/** pending: the new address applies only after the link sent to it is opened. */
export async function changeEmail(email: string, password?: string) {
  return fetchJson<{ success: boolean; pending?: boolean; email?: string }>("/users/change/email", {
    method: "POST",
    body: JSON.stringify(password ? { email, password } : { email }),
  });
}

// ---- Buyers: seller contact, favorites, complaints ----
export type SellerContact = { name: string | null; phone: string | null };

export function getSellerContact(listingId: string | number) {
  return fetchJson<SellerContact>(`/public/listings/${encodeURIComponent(String(listingId))}/contact`);
}

export function addFavorite(listingId: string | number) {
  return fetchJson<{ success: boolean }>(`/favorites/${encodeURIComponent(String(listingId))}`, { method: "POST" });
}

export function removeFavorite(listingId: string | number) {
  return fetchJson<{ success: boolean }>(`/favorites/${encodeURIComponent(String(listingId))}`, { method: "DELETE" });
}

// ---- Digital Services Act (Skaitmeninių paslaugų aktas) ----
export const DSA_NOTICE_CATEGORIES = [
  "SCAM_FRAUD",
  "STOLEN_VEHICLE",
  "MISLEADING_INFO",
  "INTELLECTUAL_PROPERTY",
  "PERSONAL_DATA",
  "ILLEGAL_GOODS",
  "HATE_OR_VIOLENCE",
  "CHILD_ABUSE",
  "OTHER",
] as const;
export type DsaNoticeCategory = (typeof DSA_NOTICE_CATEGORIES)[number];
export type DsaNoticeInput = {
  url: string;
  listingId?: number;
  category: DsaNoticeCategory;
  explanation: string;
  name: string;
  email: string;
  goodFaith: boolean;
};
export type DsaNotice = {
  id: number;
  listingId: number | null;
  contentUrl: string;
  category: DsaNoticeCategory;
  explanation: string;
  reporterName: string | null;
  reporterEmail: string | null;
  goodFaith: boolean;
  status: "RECEIVED" | "ACTION_TAKEN" | "NO_ACTION";
  decisionNote: string | null;
  decidedAt: string | null;
  createdAt: string;
};
export type ModerationDecision = {
  id: number;
  listingId: number | null;
  restriction: "LISTING_REJECTED" | "LISTING_REMOVED" | "ACCOUNT_SUSPENDED";
  ground: "TERMS" | "ILLEGAL";
  ruleRef: string | null;
  explanation: string;
  noticeId: number | null;
  automated: boolean;
  createdAt: string;
};

/** Notice of illegal content (DSA Art. 16): anyone can send one, signed in or not. */
export function sendDsaNotice(input: DsaNoticeInput) {
  return fetchJson<{ id: number; status: string; receivedAt: string }>("/dsa/notices", { method: "POST", body: JSON.stringify(input) });
}
/** Statements of reasons about the signed-in user's listings (DSA Art. 17). Older backends: none. */
export async function getMyModerationDecisions(): Promise<ModerationDecision[]> {
  try {
    return await fetchJson<ModerationDecision[]>("/dsa/decisions/mine");
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) return [];
    throw e;
  }
}
export function listDsaNotices(page = 0, size = 50, status = "") {
  const filter = status ? `&status=${encodeURIComponent(status)}` : "";
  return fetchJson<Paged<DsaNotice>>(`/admin/dsa/notices?page=${page}&size=${size}${filter}`);
}
export function decideDsaNotice(id: number, action: "REMOVE" | "NO_ACTION", explanation: string, ground: "TERMS" | "ILLEGAL" = "TERMS") {
  return fetchJson<{ success: boolean; status: string }>(`/admin/dsa/notices/${id}/decision`, {
    method: "POST",
    body: JSON.stringify({ action, explanation, ground }),
  });
}

// ---- Admin ----
export type Paged<T> = { content: T[]; number: number; size: number; totalElements: number; totalPages: number };
export type AdminStats = { users: number; listings: number; payments: number; openTickets: number };
export type AdminUser = {
  id: number;
  email: string;
  name: string;
  surname: string;
  city: string | null;
  phone: string | null;
  phoneVerified: number | boolean;
  disabled: number | boolean;
  registrationDate: string | null;
  roles?: string[];
  /** "Verified identity" badge on the user's page (set by an admin). */
  identityVerified?: boolean;
};
export type ModerationFlag =
  | "NEW_ACCOUNT"
  | "EMAIL_NOT_VERIFIED"
  | "PHONE_NOT_VERIFIED"
  | "PHONE_SHARED"
  | "PREVIOUSLY_REJECTED"
  | "OPEN_COMPLAINTS"
  | "NO_PHOTOS"
  | "CONTACTS_IN_TEXT"
  | "MANY_NEW_LISTINGS"
  | "OWNER_BLOCKED"
  | "NO_SDK";
/** What the moderator should look at before approving a listing (computed by the backend). */
export type ModerationSignals = {
  ownerEmail: string | null;
  accountAgeDays: number | null;
  emailVerified: boolean | null;
  phoneVerified: boolean;
  accountsWithSamePhone: number;
  ownerListings: number;
  ownerRejected: number;
  ownerListingsLastDay: number;
  openComplaints: number;
  photos: number;
  contactsInText: boolean;
  flags: ModerationFlag[];
};
export type AdminListing = {
  id: number;
  user: { id: number; name: string; surname: string } | null;
  car: { mark?: { name: string } | null; model?: { name: string } | null } | null;
  status: string;
  price: number;
  description: string | null;
  createdAt: string | null;
  /** Missing on backends older than the moderation signals. */
  moderation?: ModerationSignals | null;
};
export type AdminComplaint = {
  id: number;
  type: "USER" | "LISTING" | string;
  status: "WAITING" | "DENIED" | "ACCEPTED" | string;
  description: string;
  userId: number;
  userEmail: string | null;
  userTargetId: number | null;
  listingTargetId: number | null;
  createdAt: string | null;
};
export const ADMIN_LISTING_STATUSES = ["ACTIVE", "PENDING_PAYMENT", "PENDING_REVIEW", "REJECTED", "SOLD", "CLOSED"] as const;

export function getAdminStats() {
  return fetchJson<AdminStats>("/admin/stats");
}
/** What protects the site right now (moderation, phone and e-mail confirmation), as the running API sees it. */
export type AdminConfigDiagnostics = {
  listingModeration: boolean;
  phoneVerification: boolean;
  emailVerification: { enabled: boolean; required: boolean };
  paymentsEnabled: boolean;
  photoProcessing: boolean;
  photoClassification: boolean;
  /** The fields below are missing on older backends. */
  schema?: {
    checked: boolean;
    error?: string;
    pending: { version: string; missing: string[] }[];
    problems: string[];
    autoApply: boolean;
    lastAutoApply: { at: string; applied: string[]; failed: string | null } | null;
  };
  backups?: AdminBackupStatus;
  errorAlerts?: boolean;
  warnings: string[];
};
export type AdminBackupStatus = {
  enabled: boolean;
  dir: string | null;
  keepDays: number;
  latest: { name: string; size: number; createdAt: string } | null;
  files: number;
  lastError: string | null;
  running: boolean;
};
export type AdminRecentErrors = {
  since: string;
  total: number;
  alerts: boolean;
  recent: { at: string; source: "api" | "process" | "frontend"; where: string; message: string; stack: string | null; count: number }[];
};
export function getAdminRecentErrors() {
  return fetchJson<AdminRecentErrors>("/admin/diagnostics/errors");
}
/** Adds the tables, columns and indexes the database still lacks (never changes existing data). */
export function applyMigrations() {
  return fetchJson<{ applied: string[]; failed: string | null }>("/admin/diagnostics/schema/apply", { method: "POST", timeoutMs: 120000 });
}
export function runBackup() {
  return fetchJson<{ file: { name: string; size: number } }>("/admin/backups/run", { method: "POST", timeoutMs: 300000 });
}

const reportedErrors = new Set<string>();
/** Sends a page crash to the backend for the admin panel. Never throws; each error is sent once per page load. */
export function reportClientError(error: { message?: string; stack?: string; digest?: string }) {
  const message = String(error?.message || "Unknown error").slice(0, 1000);
  const key = `${message}|${error?.digest || ""}`;
  if (reportedErrors.has(key) || reportedErrors.size >= 10) return;
  reportedErrors.add(key);
  fetchJson("/client-errors", {
    method: "POST",
    timeoutMs: 5000,
    body: JSON.stringify({
      message,
      stack: error?.stack ? String(error.stack).slice(0, 4000) : undefined,
      digest: error?.digest ? String(error.digest).slice(0, 100) : undefined,
      url: typeof window !== "undefined" ? window.location.pathname.slice(0, 500) : undefined,
    }),
  }).catch(() => undefined);
}
export function getAdminConfigDiagnostics() {
  return fetchJson<AdminConfigDiagnostics>("/admin/diagnostics/config");
}
export function listAdminUsers(page = 0, size = 50) {
  return fetchJson<Paged<AdminUser>>(`/admin/users?page=${page}&size=${size}`);
}
export function setUserDisabled(id: number, disabled: boolean, reason?: string) {
  return fetchJson<{ success: boolean }>(`/users/${id}/edit`, {
    method: "POST",
    body: JSON.stringify(reason ? { disabled: disabled ? 1 : 0, reason } : { disabled: disabled ? 1 : 0 }),
  });
}
/** Gives or removes support desk access (the SUPPORT role) without admin rights. */
/** Erases the user's personal data and listings (GDPR request). Cannot be undone. */
export function eraseUser(id: number) {
  return fetchJson<{ success: boolean; listingsDeleted: number; paidListingsAnonymized: number }>(`/admin/users/${id}/erase`, { method: "POST" });
}
export function setUserSupportRole(id: number, enabled: boolean) {
  return fetchJson<{ id: number; roles: string[] }>(`/admin/users/${id}/support`, { method: "POST", body: JSON.stringify({ enabled }) });
}
/** status = "" for all listings, "PENDING_REVIEW" for the moderation queue. */
export function listAdminListings(page = 0, size = 50, status = "") {
  const filter = status ? `&status=${encodeURIComponent(status)}` : "";
  return fetchJson<Paged<AdminListing>>(`/admin/listings?page=${page}&size=${size}${filter}`);
}
/** reason: the statement of reasons e-mailed to the owner when a listing is rejected (DSA Art. 17). */
export function setAdminListingStatus(id: number, status: string, reason?: string) {
  return fetchJson<{ success: boolean }>(`/admin/listings/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify(reason ? { status, reason } : { status }),
  });
}
export function listAdminComplaints(page = 0, size = 50) {
  return fetchJson<Paged<AdminComplaint>>(`/admin/complaints?page=${page}&size=${size}`);
}
export function setComplaintStatus(id: number, status: "WAITING" | "DENIED" | "ACCEPTED") {
  return fetchJson<{ success: boolean }>(`/complaints/${id}/edit/status`, { method: "POST", body: JSON.stringify({ status }) });
}

/** Channels the backend really delivers (voice only when a voice provider is configured). */
export async function getPhoneVerificationConfig() {
  return fetchJson<PhoneVerificationConfig>("/phone-verification/config");
}

export async function requestPhoneCode(phone: string, channel: VerificationChannel) {
  return fetchJson<{
    expiresInSeconds: number;
    resendAfterSeconds: number;
    /** Channel the backend actually used. Older backends omit it (SMS only). */
    channel?: VerificationChannel;
    phone?: string;
    devCode?: string | null;
  }>("/phone-verification/request", { method: "POST", body: JSON.stringify({ phone, channel }) });
}

export async function verifyPhoneCode(phone: string, code: string) {
  return fetchJson<{ verified: boolean; verificationToken: string; phone?: string }>(
    "/phone-verification/verify",
    { method: "POST", body: JSON.stringify({ phone, code }) }
  );
}

export async function attachVerifiedPhone(phone: string, verificationToken: string) {
  return fetchJson<{ success: boolean; phone?: string; phoneVerified?: boolean }>("/phone-verification/attach", {
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

export type PasswordResetConfig = { enabled: boolean };

// ---- E-mail confirmation ----
export function getEmailVerificationConfig() {
  return fetchJson<{ enabled: boolean; required: boolean }>("/auth/email/config");
}
/** ifNoneRecent: send nothing when a link already went out within the last hour. */
export function requestEmailVerification(ifNoneRecent = false) {
  return fetchJson<{ sent: boolean; alreadyVerified: boolean }>(`/auth/email/verify/request${ifNoneRecent ? "?ifNoneRecent=1" : ""}`, {
    method: "POST",
  });
}
export function confirmEmailVerification(token: string) {
  return fetchJson<{ success: boolean; purpose: "VERIFY" | "CHANGE"; email: string; signedOut: boolean }>("/auth/email/verify/confirm", {
    method: "POST",
    body: JSON.stringify({ token }),
  });
}

/**
 * true when the backend requires a confirmed e-mail to publish and this user has not confirmed it yet. Then a
 * link is sent unless one went out within the last hour (accounts created before confirmation never got one).
 */
export async function emailBlocksPublishing(): Promise<boolean> {
  const [config, user] = await Promise.all([getEmailVerificationConfig().catch(() => null), me().catch(() => null)]);
  const blocked = Boolean(config?.required) && user?.emailVerified === false;
  if (blocked) await requestEmailVerification(true).catch(() => undefined);
  return blocked;
}
export function isLoginLockedError(e: unknown) {
  return e instanceof ApiError && e.status === 429 && (e.details as { code?: string } | undefined)?.code === "LOGIN_LOCKED";
}
export function isEmailNotVerifiedError(e: unknown) {
  return e instanceof ApiError && e.status === 403 && (e.details as { code?: string } | undefined)?.code === "EMAIL_NOT_VERIFIED";
}

/** Password reset is available only when the backend has e-mail delivery configured. */
export function getPasswordResetConfig() {
  return fetchJson<PasswordResetConfig>("/auth/password-reset/config");
}

export function requestPasswordReset(email: string) {
  return fetchJson<{ accepted: boolean; message: string }>("/auth/password-reset/request", {
    method: "POST",
    body: JSON.stringify({ email }),
  });
}

export function confirmPasswordReset(token: string, password: string, passwordConfirm: string) {
  return fetchJson<{ success: boolean }>("/auth/password-reset/confirm", {
    method: "POST",
    body: JSON.stringify({ token, password, passwordConfirm }),
  });
}

export async function registerUser(payload: {
  email: string;
  name: string;
  surname: string;
  city: string;
  phone: string;
  verificationToken?: string;
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

// paymentsEnabled is absent on older backends; only an explicit false means "publish for free".
export type PaymentConfig = { publicationPrice: number; currency: string; devMode: boolean; paymentsEnabled?: boolean; moderationEnabled?: boolean };
// status: ACTIVE, or PENDING_REVIEW when the backend has LISTING_MODERATION_ENABLED=true.
export type Checkout = { paymentId: number | null; listingId: number; amount: number; currency: string; paymentUrl?: string | null; devMode: boolean; promoApplied?: boolean; paymentsEnabled?: boolean; status?: string };
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
  city?: string;
  /** Equipment option keys (see lib/carOptions). */
  options?: string[];
  /** Regitra owner declaration code, required unless ltRegistered is false. */
  sdk?: string;
  ltRegistered?: boolean;
  /** Optional 17-character VIN, shown on the listing page. */
  vin?: string;
};

/**
 * Factory equipment of a catalog modification, used to pre-fill the seller's list.
 * source "exact": the version's own list; "similar": what all catalogued trims of the closest related version have.
 */
export async function getCatalogOptions(modificationId: string): Promise<{ keys: string[]; source: "exact" | "similar" | null }> {
  const data = await fetchJson<{ options?: unknown; source?: unknown }>(`/catalog/options/${encodeURIComponent(modificationId)}`);
  const keys = Array.isArray(data?.options) ? data.options.filter((x): x is string => typeof x === "string") : [];
  // Older backends send no source: their list is always the version's own.
  const source = data?.source === "similar" ? "similar" : keys.length ? "exact" : null;
  return { keys, source };
}

export type PriceEstimate = { low: number; high: number; comparables: number };

/** Price range of the same model on Wheelio, or null when there are too few similar listings to say. */
export async function getPriceEstimate(mark: string, model: string, year: number): Promise<PriceEstimate | null> {
  const q = new URLSearchParams({ mark, model, year: String(year) });
  const data = await fetchJson<{ estimate?: PriceEstimate | null }>(`/public/price-estimate?${q}`);
  const e = data?.estimate;
  return e && Number.isFinite(e.low) && Number.isFinite(e.high) ? e : null;
}

/** NHTSA vPIC fields the sell form reads; any of them may be missing for European cars. */
export type VinDecoded = Partial<
  Record<
    | "Make" | "Model" | "ModelYear" | "Series" | "Trim" | "BodyClass" | "Doors" | "DriveType" | "TransmissionStyle"
    | "TransmissionSpeeds" | "DisplacementL" | "EngineCylinders" | "EngineHP" | "EngineKW" | "EngineModel"
    | "FuelTypePrimary" | "ErrorCode" | "ErrorText",
    string
  >
>;

export type VinLookup = {
  vin: string;
  /** Catalog mark id from the VIN's manufacturer code, known even when vPIC is down. */
  wmiMake: string | null;
  nhtsaStatus: "ok" | "no-data" | "unavailable";
  nhtsa: VinDecoded | null;
};

export function lookupVin(vin: string) {
  return fetchJson<VinLookup>(`/vin/${encodeURIComponent(vin)}`, { timeoutMs: 20000 });
}

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
  const response = await apiFetch(buildUrl(`/listings/${listingId}/images`), { method: "POST", body: form });
  if (!response.ok) throw await toApiError(response);
  // listingStatus: PENDING_REVIEW when a new photo sent an approved listing back to review.
  return response.json() as Promise<{ id: number; url: string; preview: string; listingStatus?: string }>;
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
  const response = await apiFetch(buildUrl("/photo-classification"), { method: "POST", body: form });
  if (!response.ok) throw await toApiError(response);
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

export type SupportTicket = {
  id: number;
  name?: string | null;
  email?: string | null;
  phone?: string | null;
  category: string;
  subject: string;
  message: string;
  status: "OPEN" | "IN_PROGRESS" | "CLOSED";
  created_at: string;
};

export function listSupportTickets(page = 0, size = 50) {
  return fetchJson<{ content: SupportTicket[]; totalElements: number }>(
    `/support/tickets?page=${page}&size=${size}`
  );
}

export function setSupportTicketStatus(id: number, status: SupportTicket["status"]) {
  return fetchJson<SupportTicket>(`/support/tickets/${id}/status?status=${status}`, {
    method: "POST",
  });
}

export type SupportTicketReply = {
  id: number;
  ticketId: number;
  sender: "AGENT" | "USER";
  authorEmail: string | null;
  message: string;
  emailed: boolean;
  createdAt: string;
};

export type SupportReplyEmailError = "MAIL_NOT_CONFIGURED" | "NO_CUSTOMER_EMAIL" | "SEND_FAILED";

export function listSupportTicketReplies(id: number) {
  return fetchJson<SupportTicketReply[]>(`/support/tickets/${id}/replies`);
}

/** Stores a staff reply and e-mails it to the customer unless sendEmail is false (internal note). */
export function replyToSupportTicket(id: number, message: string, sendEmail = true) {
  return fetchJson<{ reply: SupportTicketReply; emailed: boolean; emailError: SupportReplyEmailError | null; ticket: SupportTicket }>(
    `/support/tickets/${id}/replies`,
    { method: "POST", body: JSON.stringify({ message, sendEmail }) }
  );
}

export function startLiveSupport(payload: { name?: string; email?: string; phone?: string }) {
  return fetchJson<LiveSupportConversation>("/support/live", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

// The guest chat token goes in a header, not the URL, so it does not end up in server or proxy logs.
const supportTokenHeaders = (token?: string): Record<string, string> => (token ? { "X-Support-Token": token } : {});

/** after = id of the last message already shown: the API then returns only newer messages. */
export function getLiveSupportMessages(id: number, token?: string, after?: number) {
  return fetchJson<LiveSupportMessage[]>(`/support/live/${id}/messages${after ? `?after=${after}` : ""}`, {
    headers: supportTokenHeaders(token),
    timeoutMs: 10000,
  });
}

export function sendLiveSupportMessage(id: number, message: string, token?: string) {
  return fetchJson<LiveSupportMessage>(`/support/live/${id}/messages`, {
    method: "POST",
    headers: supportTokenHeaders(token),
    body: JSON.stringify({ message }),
  });
}

/**
 * Keeps a live chat up to date by asking for messages newer than the last one every few seconds (paused while
 * the tab is hidden). It replaces the old EventSource stream: on the hosting every open stream held one of the
 * API's few connections, and a few of them (a support agent clicking through chats) made every request time out.
 * onHistory gets the full history once; onNew gets only new messages; onHistoryError gets the error if the
 * first load fails, and polling then stops. Returns a function that stops polling.
 */
export function pollLiveSupport(
  id: number,
  token: string | undefined,
  handlers: {
    onHistory: (messages: LiveSupportMessage[]) => void;
    onNew: (messages: LiveSupportMessage[]) => void;
    onHistoryError?: (error: unknown) => void;
    intervalMs?: () => number;
  },
) {
  let stopped = false;
  let timer: ReturnType<typeof setTimeout> | undefined;
  let after = 0;
  const interval = () => handlers.intervalMs?.() ?? 4000;
  const next = () => {
    if (!stopped) timer = setTimeout(tick, interval());
  };
  const tick = async () => {
    if (stopped) return;
    if (typeof document !== "undefined" && document.hidden) return next();
    try {
      const fresh = await getLiveSupportMessages(id, token, after);
      if (stopped) return;
      if (fresh.length) {
        after = Math.max(after, ...fresh.map((m) => m.id));
        handlers.onNew(fresh);
      }
    } catch {
      // the next tick retries
    }
    next();
  };
  getLiveSupportMessages(id, token)
    .then((history) => {
      if (stopped) return;
      after = history.reduce((max, m) => Math.max(max, m.id), 0);
      handlers.onHistory(history);
      next();
    })
    .catch((e) => {
      if (!stopped) handlers.onHistoryError?.(e);
    });
  return () => {
    stopped = true;
    if (timer) clearTimeout(timer);
  };
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
