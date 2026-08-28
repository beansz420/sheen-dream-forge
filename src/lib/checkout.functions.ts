import { createServerFn } from "@tanstack/react-start";
import { getRequestHeader, getRequestIP } from "@tanstack/react-start/server";
import { z } from "zod";
import { KITS, type KitId } from "./kits";

const TrackingSchema = z
  .object({
    utm_source: z.string().max(255).optional(),
    utm_campaign: z.string().max(255).optional(),
    utm_medium: z.string().max(255).optional(),
    utm_content: z.string().max(255).optional(),
    utm_term: z.string().max(255).optional(),
    fbclid: z.string().max(500).optional(),
    gclid: z.string().max(500).optional(),
    kclid: z.string().max(500).optional(),
    src: z.string().max(255).optional(),
    sck: z.string().max(255).optional(),
  })
  .optional();

const CheckoutSchema = z.object({
  kitId: z.enum(["1", "2", "3", "4"]),
  customer_name: z.string().trim().min(2).max(120),
  customer_email: z.string().trim().email().max(255),
  customer_phone: z.string().trim().min(10).max(20),
  customer_document: z.string().trim().min(11).max(20),
  address_cep: z.string().trim().min(8).max(10),
  address_street: z.string().trim().min(2).max(200),
  address_number: z.string().trim().min(1).max(20),
  address_complement: z.string().trim().max(100).optional().or(z.literal("")),
  address_neighborhood: z.string().trim().min(2).max(120),
  address_city: z.string().trim().min(2).max(120),
  address_state: z.string().trim().length(2),
  tracking_parameters: TrackingSchema,
  fbp: z.string().max(255).optional(),
  fbc: z.string().max(500).optional(),
  ic_event_id: z.string().max(100).optional(),
});


type PagapResponse = {
  success: boolean;
  transaction_id?: string;
  pix_qrcode?: string;
  pix_qrcode_image?: string;
  pix_copy_paste?: string;
  expires_at?: string;
  amount?: number;
  message?: string;
  error?: string;
};

export const createPixOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => CheckoutSchema.parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const kit = KITS[data.kitId as KitId];
    const amount = Number(kit.price.toFixed(2));

    const apiKey = process.env.PAGAP_SECRET_KEY;
    if (!apiKey) {
      return { ok: false as const, error: "Pagamento indisponível no momento." };
    }

    // Captura IP/UA da requisição p/ enriquecer Meta CAPI depois
    const clientUA = getRequestHeader("user-agent") || null;
    const firstIp = (v: string | undefined | null) =>
      v ? v.split(",")[0]!.trim() || null : null;
    const clientIP =
      getRequestIP({ xForwardedFor: true }) ||
      firstIp(getRequestHeader("cf-connecting-ip")) ||
      firstIp(getRequestHeader("x-forwarded-for")) ||
      firstIp(getRequestHeader("x-real-ip")) ||
      null;

    // fbc: usa o do browser; se ausente, reconstrói do fbclid (formato oficial Meta)
    const fbclid = data.tracking_parameters?.fbclid || null;
    const fbc = data.fbc || (fbclid ? `fb.1.${Date.now()}.${fbclid}` : null);
    const eventSourceUrl = getRequestHeader("referer") || null;

    // 1. Cria registro pendente
    const { data: order, error: insertErr } = await supabaseAdmin
      .from("orders")
      .insert({
        status: "pending",
        amount,
        kit_id: data.kitId,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_phone: data.customer_phone,
        customer_document: data.customer_document,
        address_cep: data.address_cep,
        address_street: data.address_street,
        address_number: data.address_number,
        address_complement: data.address_complement || null,
        address_neighborhood: data.address_neighborhood,
        address_city: data.address_city,
        address_state: data.address_state.toUpperCase(),
        items: [{ id: kit.id, name: kit.name, quantity: kit.quantity, price: kit.price }],
        fbp: data.fbp || null,
        fbc,
        fbclid,
        event_source_url: eventSourceUrl,
        client_user_agent: clientUA,
        client_ip_address: clientIP,
      })

      .select()
      .single();

    if (insertErr || !order) {
      console.error("orders insert error:", insertErr);
      return { ok: false as const, error: "Erro ao registrar pedido." };
    }

    // 2. Cria Pix na Pagap
    try {
      const pagapPayload = {
        amount,
        customer_name: data.customer_name,
        customer_email: data.customer_email,
        customer_document: data.customer_document.replace(/\D/g, ""),
        customer_phone: data.customer_phone.replace(/\D/g, ""),
        customer_postal_code: data.address_cep.replace(/\D/g, ""),
        customer_address: data.address_street,
        customer_address_number: data.address_number,
        customer_neighborhood: data.address_neighborhood,
        customer_complement: data.address_complement || undefined,
        customer_city: data.address_city,
        customer_state: data.address_state.toUpperCase(),
        items: [
          {
            name: kit.name,
            quantity: 1,
            price: amount,
          },
        ],
        ...(data.tracking_parameters && Object.keys(data.tracking_parameters).length > 0
          ? { tracking_parameters: data.tracking_parameters }
          : {}),
      };

      const readPixAmount = (pix?: string | null) => {
        if (!pix) return null;
        let index = 0;
        while (index + 4 <= pix.length) {
          const tag = pix.slice(index, index + 2);
          const length = Number(pix.slice(index + 2, index + 4));
          if (!Number.isFinite(length) || length < 0) return null;
          const valueStart = index + 4;
          const value = pix.slice(valueStart, valueStart + length);
          if (value.length !== length) return null;
          if (tag === "54") {
            const parsed = Number(value);
            return Number.isFinite(parsed) ? Number(parsed.toFixed(2)) : null;
          }
          index = valueStart + length;
        }
        return null;
      };

      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 20000);
      const res = await fetch("https://api.pagap.com.br/functions/v1/create-pix-payment", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-api-key": apiKey,
        },
        body: JSON.stringify(pagapPayload),

        signal: controller.signal,
      }).finally(() => clearTimeout(timeout));

      const body = (await res.json().catch(() => ({}))) as PagapResponse;
      if (!res.ok || !body.success || !body.transaction_id) {
        console.error("Pagap error:", res.status, body);
        await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", order.id);
        const msg =
          body.error ||
          body.message ||
          "Os gateways de pagamento estão instáveis. Tente novamente em instantes.";
        return { ok: false as const, error: msg };
      }

      const pixAmount = readPixAmount(body.pix_copy_paste || body.pix_qrcode);
      if (pixAmount !== null && Math.abs(pixAmount - amount) > 0.01) {
        console.error("Pagap amount mismatch:", { expected: amount, received: pixAmount, transaction_id: body.transaction_id });
        await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", order.id);
        return { ok: false as const, error: "Erro ao gerar Pix com o valor correto. Tente novamente." };
      }

      await supabaseAdmin
        .from("orders")
        .update({
          transaction_id: body.transaction_id,
          pix_qrcode: body.pix_qrcode,
          pix_qrcode_image: body.pix_qrcode_image,
          pix_copy_paste: body.pix_copy_paste,
          expires_at: body.expires_at,
        })
        .eq("id", order.id);

      // InitiateCheckout server-side (dedupe com o Pixel via mesmo event_id).
      if (data.ic_event_id) {
        const { sendMetaCapiEvent } = await import("./meta-capi.server");
        await sendMetaCapiEvent({
          event_name: "InitiateCheckout",
          event_id: data.ic_event_id,
          transaction_id: body.transaction_id,
          event_source_url: eventSourceUrl || undefined,
          user_agent: clientUA || undefined,
          client_ip_address: clientIP || undefined,
          fbp: data.fbp,
          fbc: fbc || undefined,
        }).catch((e) => console.error("[meta-capi] InitiateCheckout failed", e));
      }

      return { ok: true as const, transaction_id: body.transaction_id };
    } catch (err) {
      console.error("Pagap fetch error:", err);
      await supabaseAdmin.from("orders").update({ status: "failed" }).eq("id", order.id);
      return { ok: false as const, error: "Erro de conexão com o pagamento. Tente novamente." };
    }
  });

export const getOrderStatus = createServerFn({ method: "GET" })
  .inputValidator((input: unknown) => z.object({ transaction_id: z.string().min(1).max(100) }).parse(input))
  .handler(async ({ data }) => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select(
        "transaction_id, status, kit_id, amount, customer_name, pix_qrcode, pix_qrcode_image, pix_copy_paste, expires_at, paid_at",
      )
      .eq("transaction_id", data.transaction_id)
      .maybeSingle();

    if (error || !order) return { ok: false as const, error: "Pedido não encontrado." };
    return { ok: true as const, order };
  });
