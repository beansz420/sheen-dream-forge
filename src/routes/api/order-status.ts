import { createFileRoute } from "@tanstack/react-router";
import { z } from "zod";

const OrderStatusQuerySchema = z.object({
  transaction_id: z.string().min(1).max(100),
});

export const Route = createFileRoute("/api/order-status")({
  server: {
    handlers: {
      GET: async ({ request }) => {
        const url = new URL(request.url);
        const parsed = OrderStatusQuerySchema.safeParse({
          transaction_id: url.searchParams.get("transaction_id"),
        });

        if (!parsed.success) {
          return Response.json({ ok: false, error: "Pedido inválido." }, { status: 400 });
        }

        const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

        // Confere o status real na Pagap: não dependemos do webhook para
        // marcar a venda como paga nem para disparar o Purchase no Meta.
        const { syncOrderWithGateway } = await import("@/lib/pagap.server");
        await syncOrderWithGateway(parsed.data.transaction_id).catch((e) =>
          console.error("[pagap] sync error", e),
        );

        const { data: order, error } = await supabaseAdmin
          .from("orders")
        .select(
          "transaction_id, status, kit_id, amount, customer_name, pix_qrcode, pix_qrcode_image, pix_copy_paste, expires_at, paid_at, capi_purchase_sent_at",
        )
          .eq("transaction_id", parsed.data.transaction_id)
          .maybeSingle();

        if (error || !order) {
          return Response.json({ ok: false, error: "Pedido não encontrado." }, { status: 404 });
        }

        // Rede de segurança: pedido pago cujo CAPI nunca saiu (falha de rede/webhook).
        // event_id determinístico garante deduplicação no Meta.
        if (order.status === "paid" && !order.capi_purchase_sent_at) {
          const { sendMetaCapiEvent, purchaseEventId } = await import("@/lib/meta-capi.server");
          await sendMetaCapiEvent({
            event_name: "Purchase",
            event_id: purchaseEventId(order.transaction_id!),
            transaction_id: order.transaction_id!,
          }).catch((e) => console.error("[meta-capi] order-status fallback failed", e));
        } else {
          // Varredura oportunista: confere pendentes na Pagap e recupera
          // vendas antigas sem evento enviado (no máx. 1x por minuto).
          if (Date.now() - lastSweepAt > 60_000) {
            lastSweepAt = Date.now();
            const [{ sweepUnsentPurchases }, { reconcilePendingOrders }] = await Promise.all([
              import("@/lib/meta-capi.server"),
              import("@/lib/pagap.server"),
            ]);
            await reconcilePendingOrders(10, 72).catch((e) =>
              console.error("[pagap] reconcile error", e),
            );
            await sweepUnsentPurchases(3).catch((e) =>
              console.error("[meta-capi] sweep error", e),
            );
          }
        }


        const { capi_purchase_sent_at: _capi, ...publicOrder } = order;

        return Response.json(
          { ok: true, order: publicOrder },
          { headers: { "Cache-Control": "no-store" } },
        );

      },
    },
  },
});