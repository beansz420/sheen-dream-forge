// Meta Pixel helper (client-side)
export const META_PIXEL_ID = "3903982886564566";
const PURCHASE_STORAGE_PREFIX = "meta_purchase_fired_";
const ADVANCED_MATCHING_STORAGE_KEY = "meta_advanced_matching_v1";

type FbqFn = ((...args: unknown[]) => void) & { queue?: unknown[] };

declare global {
  interface Window {
    fbq?: FbqFn;
    _fbq?: FbqFn;
  }
}

export function generateEventId(): string {
  // RFC4122-ish random id; reused as eventID for browser + CAPI dedupe
  return "evt_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function purchaseEventId(transactionId: string) {
  return `purchase_${transactionId}`;
}

const IC_EVENT_ID_KEY = "meta_ic_event_id";

/** eventID do InitiateCheckout do browser, reaproveitado pelo CAPI (dedupe). */
export function newCheckoutEventId() {
  const id = "ic_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
  try {
    sessionStorage.setItem(IC_EVENT_ID_KEY, id);
  } catch {
    // ignore
  }
  return id;
}

export function getCheckoutEventId() {
  try {
    return sessionStorage.getItem(IC_EVENT_ID_KEY) || undefined;
  } catch {
    return undefined;
  }
}


export function hasTrackedPurchase(transactionId: string) {
  if (typeof window === "undefined") return false;
  try {
    return localStorage.getItem(`${PURCHASE_STORAGE_PREFIX}${transactionId}`) === "1";
  } catch {
    return false;
  }
}

export function markTrackedPurchase(transactionId: string) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(`${PURCHASE_STORAGE_PREFIX}${transactionId}`, "1");
  } catch {
    // ignore storage errors
  }
}

function readCookie(name: string) {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith(`${name}=`))
    ?.split("=")[1];
}

const FBC_STORAGE_KEY = "meta_fbc_v1";
const FBP_STORAGE_KEY = "meta_fbp_v1";

function writeCookie(name: string, value: string, days = 90) {
  if (typeof document === "undefined") return;
  try {
    document.cookie = `${name}=${value}; path=/; max-age=${days * 24 * 60 * 60}; SameSite=Lax`;
  } catch {
    // ignore
  }
}

function readStore(key: string) {
  try {
    return localStorage.getItem(key) || undefined;
  } catch {
    return undefined;
  }
}

function writeStore(key: string, value: string) {
  try {
    localStorage.setItem(key, value);
  } catch {
    // ignore
  }
}

/**
 * Garante _fbc e _fbp mesmo quando o cookie do Pixel ainda não existe.
 * Formato oficial Meta: fb.<subdomainIndex>.<creationTime>.<fbclid|randomNumber>
 * - _fbc é reconstruído a partir do fbclid da URL (ou do último fbclid salvo)
 * - _fbp é gerado se ausente, garantindo dedupe/matching no CAPI
 */
export function ensureMetaBrowserIds(): { fbp?: string; fbc?: string } {
  if (typeof window === "undefined") return {};

  let fbc = readCookie("_fbc");
  let fbclid: string | null = null;
  try {
    fbclid = new URL(window.location.href).searchParams.get("fbclid");
  } catch {
    fbclid = null;
  }

  if (fbclid) {
    const built = `fb.1.${Date.now()}.${fbclid}`;
    if (!fbc || !fbc.endsWith(fbclid)) {
      fbc = built;
      writeCookie("_fbc", built);
    }
  }
  if (!fbc) fbc = readStore(FBC_STORAGE_KEY);
  if (fbc) {
    writeStore(FBC_STORAGE_KEY, fbc);
    if (!readCookie("_fbc")) writeCookie("_fbc", fbc);
  }

  let fbp = readCookie("_fbp") || readStore(FBP_STORAGE_KEY);
  if (!fbp) {
    fbp = `fb.1.${Date.now()}.${Math.floor(Math.random() * 1e10)}`;
  }
  writeStore(FBP_STORAGE_KEY, fbp);
  if (!readCookie("_fbp")) writeCookie("_fbp", fbp);

  return { fbp, fbc };
}

export function getMetaBrowserIds() {
  return ensureMetaBrowserIds();
}


type MetaAdvancedMatchingInput = {
  customer_email?: string;
  customer_phone?: string;
  customer_name?: string;
  customer_document?: string;
  address_city?: string;
  address_state?: string;
  address_cep?: string;
};

type MetaAdvancedMatchingData = Record<string, string>;

function cleanDigits(value: string | undefined) {
  return (value || "").replace(/\D/g, "");
}

function normalizeName(value: string | undefined) {
  return (value || "").trim().toLowerCase();
}

async function sha256(value: string | undefined) {
  const normalized = (value || "").trim().toLowerCase();
  if (!normalized || typeof crypto === "undefined" || !crypto.subtle) return undefined;
  const data = new TextEncoder().encode(normalized);
  const hash = await crypto.subtle.digest("SHA-256", data);
  return Array.from(new Uint8Array(hash))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

function applyMetaAdvancedMatching(data: MetaAdvancedMatchingData) {
  if (typeof window === "undefined" || !window.fbq || Object.keys(data).length === 0) return false;
  window.fbq("init", META_PIXEL_ID, data);
  return true;
}

const ANON_ID_KEY = "meta_anon_external_id_v1";

/**
 * external_id estável por visitante (anônimo). Meta recomenda enviar external_id
 * em TODOS os eventos — assim ViewContent/AddToCart/InitiateCheckout de quem
 * ainda não preencheu o formulário também têm identificador para matching.
 */
export function getAnonExternalId() {
  if (typeof window === "undefined") return undefined;
  let id = readStore(ANON_ID_KEY);
  if (!id) {
    id =
      typeof crypto !== "undefined" && "randomUUID" in crypto
        ? crypto.randomUUID()
        : `anon_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
    writeStore(ANON_ID_KEY, id);
  }
  return id;
}

function readStoredMatching(): MetaAdvancedMatchingData {
  try {
    const raw = localStorage.getItem(ADVANCED_MATCHING_STORAGE_KEY);
    return raw ? (JSON.parse(raw) as MetaAdvancedMatchingData) : {};
  } catch {
    return {};
  }
}

/** Aplica o que já está em cache (sincronamente), sem esperar hash. */
export function applyStoredMetaAdvancedMatching() {
  if (typeof window === "undefined") return false;
  return applyMetaAdvancedMatching(readStoredMatching());
}

let baseMatchingPromise: Promise<MetaAdvancedMatchingData> | null = null;

/**
 * Garante que country + external_id (anônimo ou real) estejam no advanced
 * matching de todos os eventos, mesmo na primeira visita.
 */
export function ensureMetaAdvancedMatching() {
  if (typeof window === "undefined") return Promise.resolve({} as MetaAdvancedMatchingData);
  if (!baseMatchingPromise) {
    baseMatchingPromise = (async () => {
      const data = readStoredMatching();
      if (!data.country) {
        const country = await sha256("br");
        if (country) data.country = country;
      }
      if (!data.external_id) {
        const external = await sha256(getAnonExternalId());
        if (external) data.external_id = external;
      }
      try {
        localStorage.setItem(ADVANCED_MATCHING_STORAGE_KEY, JSON.stringify(data));
      } catch {
        // ignore
      }
      applyMetaAdvancedMatching(data);
      return data;
    })();
  }
  return baseMatchingPromise;
}

export async function setMetaAdvancedMatching(input: MetaAdvancedMatchingInput) {
  const [firstName, ...lastNameParts] = normalizeName(input.customer_name).split(/\s+/).filter(Boolean);
  const phoneDigits = cleanDigits(input.customer_phone);
  const phone = phoneDigits.length === 10 || phoneDigits.length === 11 ? `55${phoneDigits}` : phoneDigits;
  const data: MetaAdvancedMatchingData = { ...readStoredMatching() };

  const entries: Array<[keyof MetaAdvancedMatchingData, Promise<string | undefined>]> = [
    ["em", sha256(input.customer_email)],
    ["ph", sha256(phone)],
    ["fn", sha256(firstName)],
    // Meta exige ln; com nome único, repete o primeiro nome (melhor que vazio).
    ["ln", sha256(lastNameParts.join(" ") || firstName)],
    ["ct", sha256(input.address_city?.replace(/\s+/g, ""))],
    ["st", sha256(input.address_state)],
    ["zp", sha256(cleanDigits(input.address_cep))],
    ["country", sha256("br")],
    ["external_id", sha256(cleanDigits(input.customer_document) || getAnonExternalId())],
  ];

  for (const [key, promise] of entries) {
    const value = await promise;
    if (value) data[key] = value;
  }

  try {
    localStorage.setItem(ADVANCED_MATCHING_STORAGE_KEY, JSON.stringify(data));
  } catch {
    // ignore storage errors
  }
  baseMatchingPromise = Promise.resolve(data);
  return applyMetaAdvancedMatching(data);
}

export function fbqTrack(
  event: string,
  params?: Record<string, unknown>,
  eventID?: string,
) {
  if (typeof window === "undefined" || !window.fbq) return false;
  // fbp/fbc precisam existir ANTES do evento sair (cobertura de fbc ~100%).
  ensureMetaBrowserIds();
  const id = eventID ?? generateEventId();
  window.fbq("track", event, params ?? {}, { eventID: id });
  return true;
}

/** Dispara o evento só depois de garantir country/external_id no matching. */
export async function trackWithMatching(
  event: string,
  params?: Record<string, unknown>,
  eventID?: string,
) {
  await ensureMetaAdvancedMatching();
  return fbqTrack(event, params, eventID);
}
