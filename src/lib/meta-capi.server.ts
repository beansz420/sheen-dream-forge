import { createHash } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { KITS, type KitId } from "./kits";

const PIXEL_ID = "3903982886564566";
const API_VERSION = "v19.0";

function sha256(v: string | null | undefined) {
  if (!v) return undefined;
  return createHash("sha256").update(v.trim().toLowerCase()).digest("hex");
}

export type CapiEventName = "Purchase" | "InitiateCheckout";

export async function sendMetaCapiEvent(opts: {
  event_name: CapiEventName;
  event_id: string;
  transaction_id: string;
  event_source_url?: string;
  user_agent?: string;
  client_ip_address?: string;
  fbp?: string;
  fbc?: string;
}) {
  const token = process.env.META_CAPI_ACCESS_TOKEN;
  if (!token) {
    console.error("[meta-capi] missing META_CAPI_ACCESS_TOKEN");
    return { ok: false as const, error: "CAPI token missing" };
  }

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select(
      "id, amount, kit_id, customer_email, customer_phone, customer_name, customer_document, address_city, address_state, address_cep, fbp, fbc, fbclid, event_source_url, client_user_agent, client_ip_address, capi_attempts",
    )
    .eq("transaction_id", opts.transaction_id)
    .maybeSingle();

  if (!order) {
    console.error("[meta-capi] order not found:", opts.transaction_id);
    return { ok: false as const, error: "Order not found" };
  }

  const [firstName, ...rest] = (order.customer_name || "").split(" ");
  const lastName = rest.join(" ");
  const phone = (order.customer_phone || "").replace(/\D/g, "");
  // Telefone Brasil: prepend country code se ainda não tem.
  const phoneE164 = phone.length === 10 || phone.length === 11 ? `55${phone}` : phone;

  // external_id: CPF quando existir, senão o id do pedido — nunca vazio.
  const externalIdSource = order.customer_document?.replace(/\D/g, "") || order.id;

  const userData: Record<string, string | undefined> = {
    em: sha256(order.customer_email),
    ph: sha256(phoneE164),
    fn: sha256(firstName),
    ln: sha256(lastName || firstName),
    ct: sha256(order.address_city?.replace(/\s+/g, "")),
    st: sha256(order.address_state?.toLowerCase()),
    zp: sha256((order.address_cep || "").replace(/\D/g, "")),
    country: sha256("br"),
    external_id: sha256(externalIdSource),
  };

  // user_data extra (não-hash): IP, UA, fbp, fbc — fundamentais p/ EMQ alto
  const clientUA = opts.user_agent || order.client_user_agent || undefined;
  const clientIP = opts.client_ip_address || order.client_ip_address || undefined;
  const fbp = opts.fbp || order.fbp || undefined;
  const fbc =
    opts.fbc ||
    order.fbc ||
    (order.fbclid ? `fb.1.${Date.now()}.${order.fbclid}` : undefined);

  if (!clientIP || !clientUA || !fbp) {
    console.warn("[meta-capi] parâmetros parciais", {
      tx: opts.transaction_id,
      ip: Boolean(clientIP),
      ua: Boolean(clientUA),
      fbp: Boolean(fbp),
      fbc: Boolean(fbc),
    });
  }


  // custom_data rico: Meta usa content_ids, content_name, num_items p/ otimização
  const kit = order.kit_id ? KITS[order.kit_id as KitId] : null;
  const customData: Record<string, unknown> = {
    currency: "BRL",
    value: Number(order.amount),
    content_type: "product",
    content_category: "Clareador Dérmico",
    order_id: opts.transaction_id,
  };
  if (kit) {
    customData.content_ids = [kit.id];
    customData.content_name = kit.name;
    customData.num_items = kit.quantity;
    customData.contents = [
      { id: kit.id, quantity: kit.quantity, item_price: kit.price },
    ];
  } else {
    customData.content_ids = [opts.transaction_id];
  }

  const payload = {
    data: [
      {
        event_name: opts.event_name,
        event_time: Math.floor(Date.now() / 1000),
        event_id: opts.event_id,
        action_source: "website",
        event_source_url:
          opts.event_source_url || order.event_source_url || undefined,

        user_data: {
          ...userData,
          client_user_agent: clientUA,
          client_ip_address: clientIP,
          fbp,
          fbc,
        },
        custom_data: customData,
      },
    ],
  };

  const markAttempt = async (error: string | null) => {
    // Só Purchase controla o estado de entrega do pedido.
    if (opts.event_name !== "Purchase") return;
    await supabaseAdmin
      .from("orders")
      .update({
        capi_attempts: ((order as { capi_attempts?: number }).capi_attempts ?? 0) + 1,
        capi_last_error: error,
        ...(error === null ? { capi_purchase_sent_at: new Date().toISOString() } : {}),
      })
      .eq("transaction_id", opts.transaction_id);
  };

  // Até 3 tentativas com backoff — falha de rede não pode custar uma venda.
  let lastError = "unknown";
  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const res = await fetch(
        `https://graph.facebook.com/${API_VERSION}/${PIXEL_ID}/events?access_token=${token}`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        },
      );
      const body = (await res.json().catch(() => ({}))) as {
        error?: { message?: string };
        events_received?: number;
        fbtrace_id?: string;
      };
      if (!res.ok) {
        lastError = `${res.status} ${body.error?.message || "CAPI error"}`;
        console.error("[meta-capi] error:", res.status, body);
      } else {
        console.log(
          `[meta-capi] ${opts.event_name} sent tx=${opts.transaction_id} event_id=${opts.event_id} received=${body.events_received} trace=${body.fbtrace_id}`,
        );
        await markAttempt(null);
        return { ok: true as const };
      }
    } catch (err) {
      lastError = err instanceof Error ? err.message : "Network error";
      console.error("[meta-capi] fetch error:", err);
    }
    if (attempt < 3) await new Promise((r) => setTimeout(r, attempt * 500));
  }

  await markAttempt(lastError);
  return { ok: false as const, error: lastError };
}


export function purchaseEventId(transactionId: string) {
  return `purchase_${transactionId}`;
}

/**
 * Rede de segurança: reenvia Purchase de pedidos pagos cujo CAPI nunca saiu.
 * Chamado a cada webhook e a cada polling de status — como o site tem tráfego
 * constante, nenhuma venda fica sem evento por muito tempo.
 * event_id determinístico garante deduplicação no Meta.
 */
export async function sweepUnsentPurchases(limit = 5) {
  const cutoff = new Date(Date.now() - 60_000).toISOString();
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("transaction_id, capi_attempts")
    .eq("status", "paid")
    .is("capi_purchase_sent_at", null)
    .not("transaction_id", "is", null)
    .lt("paid_at", cutoff)
    .gt("paid_at", new Date(Date.now() - 24 * 60 * 60_000).toISOString())
    .lt("capi_attempts", 6)
    .order("paid_at", { ascending: false })
    .limit(limit);

  if (!orders?.length) return { swept: 0 };

  for (const o of orders) {
    await sendMetaCapiEvent({
      event_name: "Purchase",
      event_id: purchaseEventId(o.transaction_id!),
      transaction_id: o.transaction_id!,
    }).catch((e) => console.error("[meta-capi] sweep failed", o.transaction_id, e));
  }
  return { swept: orders.length };
}

