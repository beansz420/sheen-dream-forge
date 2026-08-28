import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import {
  applyStoredMetaAdvancedMatching,
  ensureMetaBrowserIds,
  fbqTrack,
  hasTrackedPurchase,
  markTrackedPurchase,
  purchaseEventId,
} from "@/lib/meta-pixel";

import { fetchOrderStatus } from "@/lib/order-status";
import { KITS } from "@/lib/kits";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Copy, Loader2, Clock, XCircle } from "lucide-react";

export const Route = createFileRoute("/pedido/$transactionId")({
  component: OrderPage,
  head: () => ({ meta: [{ title: "Pagamento Pix — Cicatribem" }] }),
});

function OrderPage() {
  const { transactionId } = Route.useParams();
  const [copied, setCopied] = useState(false);
  const [purchaseFired, setPurchaseFired] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["order", transactionId],
    queryFn: () => fetchOrderStatus(transactionId),
    refetchInterval: (q) => {
      const r = q.state.data;
      if (r?.ok && (r.order.status === "paid" || r.order.status === "expired" || r.order.status === "refunded")) {
        return false;
      }
      return 4000;
    },
  });

  // Dispara Purchase no Pixel quando pagamento confirmado.
  // CAPI (server-side) é disparado pelo webhook da Pagap — não chamamos do browser
  // para evitar endpoint público que permitiria spam de eventos no Meta.
  useEffect(() => {
    if (purchaseFired) return;
    if (!data?.ok) return;
    if (data.order.status !== "paid") return;
    const eventId = purchaseEventId(transactionId);
    const amount = Number(data.order.amount);
    const matchedKit = (Object.values(KITS) as Array<typeof KITS["1"]>).find((k) => k.price === amount);
    if (!hasTrackedPurchase(transactionId)) {
      // Garante _fbp/_fbc e re-aplica o advanced matching salvo no checkout
      // antes de disparar o evento, para cobertura de 100% dos parâmetros.
      ensureMetaBrowserIds();
      applyStoredMetaAdvancedMatching();

      const didTrack = fbqTrack(
        "Purchase",
        {
          currency: "BRL",
          value: amount,
          content_type: "product",
          content_ids: matchedKit ? [matchedKit.id] : [transactionId],
          content_name: matchedKit?.name,
          num_items: matchedKit?.quantity,
          order_id: transactionId,
          contents: matchedKit
            ? [{ id: matchedKit.id, quantity: matchedKit.quantity, item_price: matchedKit.price }]
            : undefined,
        },
        eventId,
      );
      if (didTrack) markTrackedPurchase(transactionId);
    }
    setPurchaseFired(true);
  }, [data, transactionId, purchaseFired]);


  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!data?.ok) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md text-center">
          <XCircle className="mx-auto h-12 w-12 text-destructive" />
          <h1 className="mt-4 text-xl font-bold">Pedido não encontrado</h1>
          <p className="mt-2 text-sm text-muted-foreground">Verifique o link ou volte à loja.</p>
          <Button asChild className="mt-6">
            <Link to="/">Voltar à loja</Link>
          </Button>
        </div>
      </div>
    );
  }

  const order = data.order;

  if (order.status === "paid") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <CheckCircle2 className="mx-auto h-16 w-16 text-success" />
          <h1 className="mt-4 text-2xl font-extrabold">Pagamento confirmado!</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Obrigado, {order.customer_name.split(" ")[0]}. Seu pedido já está em separação e logo enviaremos um e-mail com o
            código de rastreio.
          </p>
          <div className="mt-6 rounded-lg bg-secondary px-4 py-3 text-left text-sm">
            <p className="text-muted-foreground">Valor pago</p>
            <p className="text-lg font-bold">R$ {Number(order.amount).toFixed(2).replace(".", ",")}</p>
          </div>
          <Button asChild className="mt-6 w-full">
            <Link to="/">Voltar à loja</Link>
          </Button>
        </div>
      </div>
    );
  }

  if (order.status === "expired" || order.status === "refunded") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background px-4">
        <div className="max-w-md rounded-2xl border bg-card p-8 text-center shadow-sm">
          <XCircle className="mx-auto h-16 w-16 text-destructive" />
          <h1 className="mt-4 text-2xl font-extrabold">
            {order.status === "expired" ? "QR Code expirado" : "Pagamento estornado"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">Gere um novo pedido para concluir a compra.</p>
          <Button asChild className="mt-6 w-full">
            <Link to="/">Voltar à loja</Link>
          </Button>
        </div>
      </div>
    );
  }

  const copy = async () => {
    if (!order.pix_copy_paste) return;
    await navigator.clipboard.writeText(order.pix_copy_paste);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card">
        <div className="mx-auto max-w-3xl px-4 py-4 text-center">
          <h1 className="text-base font-bold">Pague com Pix para finalizar</h1>
        </div>
      </header>

      <main className="mx-auto max-w-md px-4 py-8">
        <div className="rounded-2xl border bg-card p-6 text-center shadow-sm">
          <div className="inline-flex items-center gap-2 rounded-full bg-promo/10 px-3 py-1 text-xs font-semibold text-promo">
            <Clock className="h-3.5 w-3.5" /> Aguardando pagamento
          </div>

          <p className="mt-4 text-sm text-muted-foreground">Total a pagar</p>
          <p className="text-3xl font-extrabold">R$ {Number(order.amount).toFixed(2).replace(".", ",")}</p>

          {order.pix_qrcode_image && (
            <div className="mt-6 flex justify-center">
              <img
                src={order.pix_qrcode_image}
                alt="QR Code Pix"
                className="h-64 w-64 rounded-lg border bg-white p-2"
              />
            </div>
          )}

          <div className="mt-6 text-left">
            <p className="text-xs font-bold uppercase tracking-wide text-muted-foreground">Pix copia e cola</p>
            <div className="mt-2 break-all rounded-lg border bg-secondary p-3 text-[11px] font-mono">
              {order.pix_copy_paste}
            </div>
            <Button onClick={copy} className="mt-3 w-full" variant="outline">
              <Copy className="mr-2 h-4 w-4" /> {copied ? "Copiado!" : "Copiar código"}
            </Button>
          </div>

          <ol className="mt-6 space-y-2 text-left text-xs text-muted-foreground">
            <li>1. Abra o app do seu banco e escolha <b>Pagar com Pix</b>.</li>
            <li>2. Escaneie o QR Code ou cole o código.</li>
            <li>3. Confirme o pagamento — esta página atualiza sozinha quando recebermos a confirmação.</li>
          </ol>

          <div className="mt-6 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-3 w-3 animate-spin" /> Verificando pagamento...
          </div>
        </div>
      </main>
    </div>
  );
}
