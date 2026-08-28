// Captura e persiste parâmetros de atribuição (UTMs, fbclid, gclid, kclid)
// para enviar à Pagap no momento da criação do pedido. A Pagap repassa
// esses dados à UTMIFY/Meta para melhorar a atribuição server-side.

const STORAGE_KEY = "tracking_params_v1";

export type TrackingParams = {
  utm_source?: string;
  utm_campaign?: string;
  utm_medium?: string;
  utm_content?: string;
  utm_term?: string;
  fbclid?: string;
  gclid?: string;
  kclid?: string;
  src?: string;
  sck?: string;
};

const KEYS: (keyof TrackingParams)[] = [
  "utm_source",
  "utm_campaign",
  "utm_medium",
  "utm_content",
  "utm_term",
  "fbclid",
  "gclid",
  "kclid",
  "src",
  "sck",
];

export function captureTrackingFromUrl() {
  if (typeof window === "undefined") return;
  try {
    const url = new URL(window.location.href);
    const found: TrackingParams = {};
    let any = false;
    for (const k of KEYS) {
      const v = url.searchParams.get(k);
      if (v) {
        found[k] = v.slice(0, 255);
        any = true;
      }
    }
    if (!any) return;
    // Merge com o que já estava salvo (primeira atribuição vence p/ utm_source)
    const prev = getTracking();
    const merged = { ...prev, ...found };
    localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
  } catch {
    // ignore
  }
}

export function getTracking(): TrackingParams {
  if (typeof window === "undefined") return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    return JSON.parse(raw) as TrackingParams;
  } catch {
    return {};
  }
}
