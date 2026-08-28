import { createFileRoute } from "@tanstack/react-router";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMetaCapiEvent, purchaseEventId, sweepUnsentPurchases } from "@/lib/meta-capi.server";

type WebhookPayload = {
  event?: string;
  data?: {
    transaction_id?: string;
    status?: string;
    amount?: number;
    customer_name?: string;
    created_at?: string;
    paid_at?: string;
  };
};

// Conforme docs Pagap: event ∈ { pending, paid, refunded } (expired aceito por segurança)
const ALLOWED = new Set(["pending", "paid", "expired", "refunded"]);
const MAX_AGE_SECONDS = 300; // 5 min, conforme recomendação Pagap

function verifySignature(rawBody: string, signature: string, timestamp: string, secret: string) {
  try {
    const expected =
      "sha256=" +
      createHmac("sha256", secret).update(`${timestamp}.${rawBody}`).digest("hex");
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return false;
    return timingSafeEqual(a, b);
  } catch {
    return false;
  }
}

export const Route = createFileRoute("/api/public/pagap-webhook")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const rawBody = await request.text();
        // Pagap assina com o webhook_secret quando configurado; senão, com a Secret Key.
        const webhookSecret = process.env.PAGAP_WEBHOOK_SECRET;
        const apiKey = process.env.PAGAP_SECRET_KEY;
        const signature = request.headers.get("x-pagap-signature");
        const timestamp = request.headers.get("x-pagap-timestamp");

        const secrets = [webhookSecret, apiKey].filter(Boolean) as string[];
        if (secrets.length > 0) {
          if (!signature || !timestamp) {
            console.error("[pagap-webhook] missing signature/timestamp headers");
            return new Response("missing signature", { status: 401 });
          }
          const valid = secrets.some((s) => verifySignature(rawBody, signature, timestamp, s));
          if (!valid) {
            console.error("[pagap-webhook] invalid signature");
            return new Response("invalid signature", { status: 401 });
          }
          const age = Math.floor(Date.now() / 1000) - parseInt(timestamp, 10);
          if (!Number.isFinite(age) || age > MAX_AGE_SECONDS) {
            console.error("[pagap-webhook] stale webhook age=", age);
            return new Response("stale webhook", { status: 401 });
          }
        }

        let payload: WebhookPayload;
        try {
          payload = JSON.parse(rawBody) as WebhookPayload;
        } catch {
          return new Response("invalid json", { status: 400 });
        }

        const txId = payload?.data?.transaction_id;
        const status = payload?.data?.status || payload?.event;
        if (!txId || !status || !ALLOWED.has(status)) {
          return new Response("ignored", { status: 200 });
        }

        // Idempotência: se já está no mesmo status, não reprocessa (Pagap reenvia até 5x)
        const { data: existing } = await supabaseAdmin
          .from("orders")
          .select("id, status, amount, capi_purchase_sent_at")
          .eq("transaction_id", txId)
          .maybeSingle();

        if (!existing) {
          console.error("[pagap-webhook] order not found", txId);
          return new Response("ok", { status: 200 });
        }

        const isTest =
          request.headers.get("x-pagap-test") === "1" ||
          (payload as { test?: boolean }).test === true;

        // Dispara Meta Purchase via CAPI. event_id determinístico
        // (purchase_<txId>) deduplica reenvios do webhook e o Pixel do browser.
        const firePurchase = async () => {
          if (isTest) {
            console.log("[pagap-webhook] teste detectado, CAPI não disparado", txId);
            return;
          }
          await sendMetaCapiEvent({
            event_name: "Purchase",
            event_id: purchaseEventId(txId),
            transaction_id: txId,
            event_source_url: `https://clareiabr.com/pedido/${txId}`,
          }).catch((e) => console.error("[meta-capi] webhook purchase failed", e));
        };

        // Já pago: só reenvia o CAPI se ainda não confirmou envio (falha anterior).
        if (existing.status === "paid") {
          if (status !== "refunded" && !existing.capi_purchase_sent_at) {
            await firePurchase();
          }
          if (status !== "refunded") return new Response("ok", { status: 200 });
        } else if (existing.status === status) {
          return new Response("ok", { status: 200 });
        }

        if (
          status === "paid" &&
          typeof payload.data?.amount === "number" &&
          Math.abs(Number(existing.amount) - payload.data.amount) > 0.01
        ) {
          console.error("[pagap-webhook] amount mismatch", {
            txId,
            expected: existing.amount,
            received: payload.data.amount,
          });
          return new Response("amount mismatch", { status: 400 });
        }

        const update: { status: string; paid_at?: string } = { status };
        if (status === "paid") update.paid_at = payload.data?.paid_at || new Date().toISOString();

        const { error } = await supabaseAdmin
          .from("orders")
          .update(update)
          .eq("transaction_id", txId);

        if (error) {
          console.error("webhook update error:", error);
          return new Response("db error", { status: 500 });
        }

        if (status === "paid") await firePurchase();

        // Recupera vendas anteriores que ficaram sem evento no Meta.
        await sweepUnsentPurchases(3).catch((e) =>
          console.error("[meta-capi] webhook sweep error", e),
        );

        return new Response("ok", { status: 200 });

      },
    },
  },
});
