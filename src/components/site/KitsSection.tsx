import { ShoppingCart, Truck, Zap, Gift } from "lucide-react";
import { useCheckout } from "@/components/checkout/CheckoutProvider";
import kit1 from "@/assets/kit-1un.webp";
import kit2 from "@/assets/kit-2un.webp";
import kit3 from "@/assets/kit-3un-serum.webp";
import kit4 from "@/assets/kit-regenerador.webp";

type Kit = {
  id: "1" | "2" | "3" | "4";
  image: string;
  title: string;
  subtitle: string;
  price: string;
  oldPrice?: string;
  off?: string;
  perUnit?: string;
  badge?: { label: string; tone: "teal" | "green" };
  ribbon?: string;
  highlighted?: boolean;
  bonus?: string;
};

const kits: Kit[] = [
  {
    id: "1",
    image: kit1,
    title: "1 Clareador Dérmico",
    subtitle: "Niacinamida + Ácido Glicólico + Lumin White",
    price: "R$ 59,90",
    oldPrice: "R$ 99,90",
    off: "-40% OFF",
  },
  {
    id: "4",
    image: kit4,
    title: "1 Regenerador Dérmico Anti-estrias",
    subtitle: "Com Hidroxi C™ - Trata e previne todos os tipos de estrias",
    price: "R$ 59,90",
    oldPrice: "R$ 99,90",
    off: "-40% OFF",
  },
  {
    id: "2",
    image: kit2,
    title: "Kit 2 Clareadores Dérmicos",
    subtitle: "Niacinamida + Ácido Glicólico + Lumin White",
    price: "R$ 79,90",
    oldPrice: "R$ 199,80",
    off: "-60% OFF",
    perUnit: "(R$ 39,95/un)",
  },
  {
    id: "3",
    image: kit3,
    title: "Kit 3 Clareadores Dérmicos",
    subtitle: "Niacinamida + Ácido Glicólico + Lumin White",
    price: "R$ 109,90",
    oldPrice: "R$ 299,70",
    off: "-63% OFF",
    perUnit: "(R$ 36,63/un)",
    badge: { label: "BRINDE EXCLUSIVO", tone: "teal" },
    ribbon: "MAIS VENDIDO",
    highlighted: true,
    bonus: "+ Sérum Facial Hidratante de BRINDE",
  },
];

export function KitsSection() {
  return (
    <section className="mx-auto max-w-3xl px-4">
      <div className="space-y-5">
        <div className="text-center">
          <h2 className="text-2xl font-extrabold uppercase tracking-wide md:text-3xl">Escolha o seu kit</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Quanto mais unidades, <span className="font-bold text-foreground">maior a economia</span>
          </p>
        </div>
        {kits.map((k) => (
          <KitCard key={k.id} kit={k} id={`kit-${k.id}`} />
        ))}
        <p className="text-center text-xs text-muted-foreground">
          🔒 Pagamento 100% seguro · Seus dados protegidos
        </p>
      </div>
    </section>
  );
}

function KitCard({ kit, id }: { kit: Kit; id?: string }) {
  const card = (
    <div id={id} className="rounded-2xl border border-border bg-background p-4 shadow-sm scroll-mt-24">
      {kit.badge && (
        <div>
          <span
            className={`inline-block rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wide text-white ${
              kit.badge.tone === "green" ? "bg-success" : "bg-[hsl(178,60%,45%)]"
            }`}
          >
            {kit.badge.label}
          </span>
        </div>
      )}

      <div className="mt-3 flex gap-4">
        <img
          src={kit.image}
          alt={kit.title}
          className="h-24 w-24 flex-shrink-0 rounded-lg object-contain"
          loading="lazy"
        />
        <div className="min-w-0 flex-1">
          <h3 className="text-base font-bold leading-snug">{kit.title}</h3>
          <p className="mt-1 text-xs text-muted-foreground">{kit.subtitle}</p>
          {kit.bonus && (
            <p className="mt-1 flex items-center gap-1 text-xs font-semibold text-success">
              <Gift className="h-3.5 w-3.5" /> {kit.bonus}
            </p>
          )}
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-xl font-extrabold">{kit.price}</span>
            {kit.off && (
              <span className="text-xs font-bold text-destructive">{kit.off}</span>
            )}
          </div>
          {kit.oldPrice && (
            <p className="text-xs text-muted-foreground">
              <span className="line-through">{kit.oldPrice}</span>{" "}
              {kit.perUnit && <span className="ml-1">{kit.perUnit}</span>}
            </p>
          )}
        </div>
      </div>

      <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground">
        <span className="flex items-center gap-1">
          <Truck className="h-3.5 w-3.5 text-success" /> Frete Grátis
        </span>
        <span className="flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-promo" /> Entrega rápida
        </span>
      </div>

      <BuyButton kitId={kit.id} />
    </div>
  );

  if (kit.highlighted) {
    return (
      <div className="rounded-2xl border-2 border-success p-1.5 pt-0">
        <div className="-mx-1.5 -mt-3 mb-1 flex justify-center">
          <span className="rounded-full bg-[hsl(22,95%,55%)] px-4 py-1 text-[11px] font-bold uppercase tracking-wide text-white shadow">
            {kit.ribbon}
          </span>
        </div>
        {card}
      </div>
    );
  }
  return card;
}

function BuyButton({ kitId }: { kitId: "1" | "2" | "3" | "4" }) {
  const { open } = useCheckout();
  return (
    <button
      type="button"
      onClick={() => open(kitId)}
      className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-[hsl(22,95%,55%)] py-3.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-md transition-transform hover:scale-[1.01]"
    >
      <ShoppingCart className="h-4 w-4" /> Comprar agora
    </button>
  );
}
