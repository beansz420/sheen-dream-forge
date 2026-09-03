import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { KITS, type KitId } from "./kits";

const HASH = z.string().regex(/^[a-f0-9]{64}$/);

const FunnelSchema = z.object({
  event_name: z.enum(["ViewContent", "AddToCart", "InitiateCheckout"]),
  event_id: z.string().min(4).max(100),
  kit_id: z.enum(["1", "2", "3", "4"]),
  event_source_url: z.string().max(1000).optional(),
  fbp: z.string().max(255).optional(),
  fbc: z.string().max(500).optional(),
  matching: z.record(z.string().max(20), HASH).optional(),
});

/**
 * Espelha os eventos de funil do Pixel na Conversions API.
 * Ganha IP, user-agent e fbp/fbc mesmo quando o navegador bloqueia o Pixel;
 * o mesmo event_id garante a deduplicação no Meta.
 */
export const trackFunnelEvent = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => FunnelSchema.parse(input))
  .handler(async ({ data }) => {
    const { sendFunnelCapiEvent } = await import("./meta-capi-direct.server");
    const kit = KITS[data.kit_id as KitId];

    const ua = getRequestHeader("user-agent") || undefined;
    const ip =
      getRequestHeader("cf-connecting-ip") ||
      getRequestHeader("x-forwarded-for")?.split(",")[0]?.trim() ||
      getRequestIP({ xForwardedFor: true }) ||
      undefined;

    await sendFunnelCapiEvent({
      event_name: data.event_name,
      event_id: data.event_id,
      event_source_url: data.event_source_url,
      user_agent: ua,
      client_ip_address: ip,
      fbp: data.fbp,
      fbc: data.fbc,
      matching: data.matching,
      custom_data: {
        currency: "BRL",
        value: kit.price,
        content_type: "product",
        content_category: "Clareador Dérmico",
        content_ids: [kit.id],
        content_name: kit.name,
        num_items: kit.quantity,
        contents: [{ id: kit.id, quantity: kit.quantity, item_price: kit.price }],
      },
    }).catch((e) => console.error("[meta-capi] funnel failed", e));

    return { ok: true as const };
  });
