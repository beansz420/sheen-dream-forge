export type OrderStatusResponse =
  | {
      ok: true;
      order: {
        transaction_id: string;
        status: string;
        amount: number | string;
        customer_name: string;
        kit_id: string | null;
        pix_qrcode: string | null;
        pix_qrcode_image: string | null;
        pix_copy_paste: string | null;
        expires_at: string | null;
        paid_at: string | null;
      };
    }
  | { ok: false; error: string };

export async function fetchOrderStatus(transactionId: string): Promise<OrderStatusResponse> {
  const res = await fetch(`/api/order-status?transaction_id=${encodeURIComponent(transactionId)}`, {
    cache: "no-store",
  });
  const body = (await res.json().catch(() => null)) as OrderStatusResponse | null;

  if (!body) return { ok: false, error: "Erro ao consultar pedido." };
  return body;
}