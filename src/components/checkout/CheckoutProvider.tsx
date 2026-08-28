import { createContext, useContext, useEffect, useState, lazy, Suspense, type ReactNode } from "react";
import type { KitId } from "@/lib/kits";
import { KITS } from "@/lib/kits";
import { trackWithMatching } from "@/lib/meta-pixel";

const CheckoutDialog = lazy(() =>
  import("./CheckoutDialog").then((m) => ({ default: m.CheckoutDialog })),
);

type Ctx = { open: (kitId: KitId) => void };
const CheckoutCtx = createContext<Ctx | null>(null);

export function useCheckout() {
  const ctx = useContext(CheckoutCtx);
  if (!ctx) throw new Error("useCheckout must be used inside CheckoutProvider");
  return ctx;
}

export function CheckoutProvider({ children }: { children: ReactNode }) {
  const [openKit, setOpenKit] = useState<KitId | null>(null);
  const [primed, setPrimed] = useState(false);

  // Preload the dialog chunk after the page is idle so the first click is instant.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const idle =
      (window as unknown as { requestIdleCallback?: (cb: () => void) => number })
        .requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1500));
    const id = idle(() => {
      void import("./CheckoutDialog");
      setPrimed(true);
    });
    return () => {
      const cancel = (window as unknown as { cancelIdleCallback?: (id: number) => void })
        .cancelIdleCallback;
      if (typeof id === "number") {
        if (cancel) cancel(id);
        else window.clearTimeout(id);
      }
    };
  }, []);

  const handleOpen = (k: KitId) => {
    // Ensure chunk is loaded before showing
    if (!primed) void import("./CheckoutDialog");
    const kit = KITS[k];
    void trackWithMatching("AddToCart", {
      content_ids: [kit.id],
      contents: [{ id: kit.id, quantity: kit.quantity, item_price: kit.price }],
      content_name: kit.name,
      content_type: "product",
      content_category: "Clareador Dérmico",
      currency: "BRL",
      value: kit.price,
      num_items: kit.quantity,
    });
    setOpenKit(k);
  };

  return (
    <CheckoutCtx.Provider value={{ open: handleOpen }}>
      {children}
      {openKit !== null && (
        <Suspense fallback={null}>
          <CheckoutDialog
            kitId={openKit}
            onOpenChange={(o) => {
              if (!o) setOpenKit(null);
            }}
          />
        </Suspense>
      )}
    </CheckoutCtx.Provider>
  );
}
