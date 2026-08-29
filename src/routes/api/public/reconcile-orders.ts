import { createFileRoute } from "@tanstack/react-router";
import { authenticateCronRequest } from "@/integrations/supabase/cron-auth";
import { reconcilePendingOrders } from "@/lib/pagap.server";
import { sweepUnsentPurchases } from "@/lib/meta-capi.server";

async function run(request: Request) {
  const unauthorized = await authenticateCronRequest(request);
  if (unauthorized) return unauthorized;

  const reconciled = await reconcilePendingOrders(50, 72);
  const swept = await sweepUnsentPurchases(10).catch(() => ({ swept: 0 }));
  return Response.json({ ok: true, ...reconciled, ...swept });
}

export const Route = createFileRoute("/api/public/reconcile-orders")({
  server: {
    handlers: {
      GET: ({ request }) => run(request),
      POST: ({ request }) => run(request),
    },
  },
});
