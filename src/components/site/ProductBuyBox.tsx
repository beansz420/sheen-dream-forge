import { useEffect } from "react";
import { ShoppingCart, Truck, Users, ShieldCheck, Award } from "lucide-react";
import { trackDual } from "@/lib/meta-pixel";
import { KITS } from "@/lib/kits";

export function ProductBuyBox() {
  // Meta Pixel + CAPI: ViewContent ao visualizar a página do produto.
  // content_ids iguais aos de AddToCart/Purchase (exigência da Meta p/ catálogo).
  useEffect(() => {
    const kit = KITS["1"];
    void trackDual("ViewContent", kit.id, {
      content_ids: [kit.id],
      contents: [{ id: kit.id, quantity: kit.quantity, item_price: kit.price }],
      content_name: kit.name,
      content_type: "product",
      content_category: "Clareador Dérmico",
      currency: "BRL",
      value: kit.price,
    });
  }, []);


  return (
    <div className="space-y-3">
      {/* Hero price */}
      <div className="rounded-2xl border bg-card p-3.5 shadow-sm sm:p-4">
        <div className="flex flex-wrap items-center gap-3">
          <span className="text-3xl font-extrabold text-foreground">R$ 59,90</span>
          <span className="text-sm font-medium text-muted-foreground line-through">R$ 99,90</span>
          <span className="rounded-md bg-destructive px-2 py-0.5 text-xs font-bold text-destructive-foreground">-40%</span>
          <span className="ml-auto flex items-center gap-1 text-xs font-bold text-success">
            <Truck className="h-3.5 w-3.5" /> Frete grátis
          </span>
        </div>
        <p className="mt-1.5 text-xs text-muted-foreground">
          Niacinamida + Ácido Glicólico + Lumin White · em até 12x
        </p>
      </div>

      <button
        type="button"
        onClick={() => {
          document.getElementById("kits")?.scrollIntoView({ behavior: "smooth", block: "start" });
        }}
        className="flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(22,95%,55%)] py-4 text-base font-extrabold uppercase tracking-wide text-white shadow-xl transition-transform hover:scale-[1.01] sm:py-5"
      >
        <ShoppingCart className="h-5 w-5" /> Quero o meu agora
      </button>

      {/* Low stock alert */}
      <div className="rounded-xl border border-promo/40 bg-promo/10 px-4 py-2.5 text-sm">
        <p className="font-medium">
          Restam apenas <span className="font-bold">14 unidades</span> em estoque!
        </p>
      </div>

      <div className="flex items-center gap-2 rounded-xl bg-secondary px-4 py-3 text-sm">
        <Users className="h-4 w-4 text-primary" />
        <span>
          <span className="font-bold">+3.812 pessoas</span> já compraram
        </span>
      </div>


      {/* Trust badges */}
      <div className="grid grid-cols-3 gap-2 pt-1">
        {[
          { i: Truck, t: "Frete Grátis", s: "Todo Brasil" },
          { i: ShieldCheck, t: "Compra Segura", s: "Criptografia SSL" },
          { i: Award, t: "Selo ANVISA", s: "Qualidade testada" },
        ].map(({ i: Icon, t, s }) => (
          <div key={t} className="rounded-xl border bg-card p-3 text-center">
            <Icon className="mx-auto mb-1 h-5 w-5 text-primary" />
            <p className="text-[11px] font-bold leading-tight">{t}</p>
            <p className="text-[10px] text-muted-foreground">{s}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
