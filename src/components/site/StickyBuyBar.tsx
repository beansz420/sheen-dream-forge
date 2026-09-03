import { useEffect, useState } from "react";
import { ShoppingCart } from "lucide-react";

/**
 * Barra fixa de compra (mobile). Aparece depois que o usuário rola o
 * primeiro CTA e some quando a seção de kits está visível — mantém a
 * ação de compra sempre a um toque de distância.
 */
export function StickyBuyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      const kits = document.getElementById("kits");
      const kitsVisible = kits
        ? kits.getBoundingClientRect().top < window.innerHeight - 80 &&
          kits.getBoundingClientRect().bottom > 0
        : false;
      setVisible(window.scrollY > 520 && !kitsVisible);
    };
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <div
      className={`fixed inset-x-0 bottom-0 z-40 border-t bg-background/95 px-3 pb-[env(safe-area-inset-bottom)] pt-2 shadow-[0_-6px_20px_-10px_rgba(0,0,0,0.35)] backdrop-blur transition-transform duration-300 md:hidden ${
        visible ? "translate-y-0" : "translate-y-full"
      }`}
    >
      <div className="flex items-center gap-3 pb-2">
        <div className="min-w-0">
          <p className="text-lg font-extrabold leading-none">R$ 59,90</p>
          <p className="truncate text-[11px] text-muted-foreground">
            Frete grátis · em até 12x
          </p>
        </div>
        <button
          type="button"
          onClick={() =>
            document.getElementById("kits")?.scrollIntoView({ behavior: "smooth", block: "start" })
          }
          className="ml-auto flex flex-1 items-center justify-center gap-2 rounded-xl bg-[hsl(22,95%,55%)] py-3.5 text-sm font-extrabold uppercase tracking-wide text-white shadow-lg"
        >
          <ShoppingCart className="h-4 w-4" /> Comprar agora
        </button>
      </div>
    </div>
  );
}
