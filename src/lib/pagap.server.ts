import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { sendMetaCapiEvent, purchaseEventId } from "./meta-capi.server";

const STATUS_URL = "https://api.pagap.com.br/functions/v1/get-transaction-status";

export type PagapStatus = {
  transaction_id: string;
  status: string;
  amount?: number;
  paid_at?: string | null;
};

/** Consulta o status real da transação na Pagap (não depende do webhook). */
export async function fetchPagapStatus(transactionId: string): Promise<PagapStatus | null> {
  const apiKey = process.env.PAGAP_SECRET_KEY;
  if (!apiKey) return null;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);
    const res = await fetch(
      `${STATUS_URL}?transaction_id=${encodeURIComponent(transactionId)}`,
      { headers: { "x-api-key": apiKey }, signal: controller.signal },
    ).finally(() => clearTimeout(timeout));
    if (!res.ok) return null;
    const body = (await res.json()) as PagapStatus & { success?: boolean; error?: string };
    if (!body?.status) return null;
    return body;
  } catch (e) {
    console.error("[pagap] status fetch failed", transactionId, e);
    return null;
  }
}

/**
 * Sincroniza um pedido pendente com o gateway. Se estiver pago na Pagap,
 * atualiza o banco e dispara o Purchase no Meta (event_id determinístico,
 * então nunca duplica com o webhook nem com o Pixel).
 */
export async function syncOrderWithGateway(transactionId: string) {
  const remote = await fetchPagapStatus(transactionId);
  if (!remote) return { changed: false as const };

  const { data: order } = await supabaseAdmin
    .from("orders")
    .select("status, amount, paid_at, capi_purchase_sent_at")
    .eq("transaction_id", transactionId)
    .maybeSingle();
  if (!order) return { changed: false as const };

  if (remote.status === "paid") {
    if (
      typeof remote.amount === "number" &&
      Math.abs(Number(order.amount) - remote.amount) > 0.01
    ) {
      console.error("[pagap] amount mismatch", transactionId, order.amount, remote.amount);
      return { changed: false as const };
    }
    const paidAt = remote.paid_at || new Date().toISOString();
    if (order.status !== "paid") {
      await supabaseAdmin
        .from("orders")
        .update({ status: "paid", paid_at: paidAt })
        .eq("transaction_id", transactionId);
    }
    if (!order.capi_purchase_sent_at) {
      await sendMetaCapiEvent({
        event_name: "Purchase",
        event_id: purchaseEventId(transactionId),
        transaction_id: transactionId,
        event_time: Math.floor(new Date(paidAt).getTime() / 1000),
      }).catch((e) => console.error("[meta-capi] gateway sync purchase failed", e));
    }
    return { changed: order.status !== "paid", status: "paid" as const };
  }

  if (
    (remote.status === "refunded" || remote.status === "expired") &&
    order.status !== remote.status
  ) {
    await supabaseAdmin
      .from("orders")
      .update({ status: remote.status })
      .eq("transaction_id", transactionId);
    return { changed: true as const, status: remote.status };
  }

  return { changed: false as const, status: remote.status };
}

/**
 * Rede de segurança principal: varre pedidos pendentes recentes e confere o
 * status direto na Pagap. Garante que nenhuma venda fique sem Purchase mesmo
 * se o webhook do gateway falhar.
 */
export async function reconcilePendingOrders(limit = 20, hours = 72) {
  const since = new Date(Date.now() - hours * 3600_000).toISOString();
  const { data: orders } = await supabaseAdmin
    .from("orders")
    .select("transaction_id")
    .eq("status", "pending")
    .not("transaction_id", "is", null)
    .gt("created_at", since)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (!orders?.length) return { checked: 0, paid: 0 };
  let paid = 0;
  for (const o of orders) {
    const r = await syncOrderWithGateway(o.transaction_id!);
    if (r.status === "paid") paid++;
  }
  return { checked: orders.length, paid };
}
