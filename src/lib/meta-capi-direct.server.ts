const PIXEL_ID = "3903982886564566";
const API_VERSION = "v19.0";

export type FunnelEventName = "ViewContent" | "AddToCart" | "InitiateCheckout";

/**
 * Envia eventos de funil (sem pedido no banco) para a Conversions API.
 * Deduplicado com o Pixel do navegador pelo mesmo event_id.
 * Todos os campos de user_data já chegam hasheados (SHA-256) do cliente,
 * conforme exigido pela documentação da Meta.
 */
export async function sendFunnelCapiEvent(opts: {
  event_name: FunnelEventName;
  event_id: string;
  event_source_url?: string;
  user_agent?: string;
  client_ip_address?: string;
  fbp?: string;
  fbc?: string;
  matching?: Record<string, string>;
  custom_data: Record<string, unknown>;
}) {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) return { ok: false as const, error: "CAPI token missing" };

  const payload = {
    data: [
      {
        event_name: opts.event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: opts.event_id,
        action_source: "website",
        event_source_url: opts.event_source_url,
        user_data: {
          ...(opts.matching ?? {}),
          client_user_agent: opts.user_agent,
          client_ip_address: opts.client_ip_address,
          fbp: opts.fbp,
          fbc: opts.fbc,
        },
        custom_data: opts.custom_data,
      },
    ],
  };

  try {
    const res = await fetch(
      `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${token}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      },
    );
    if (!res.ok) {
      const body = await res.text().catch(() => "");
      console.error("[meta-capi] funnel error", res.status, body.slice(0, 300));
      return { ok: false as const, error: `${res.status}` };
    }
    return { ok: true as const };
  } catch (err) {
    console.error("[meta-capi] funnel fetch error", err);
    return { ok: false as const, error: "network" };
  }
}
