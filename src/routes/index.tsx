import { createFileRoute } from "@tanstack/react-router";
import { Announcement } from "@/components/site/Announcement";
import { Header } from "@/components/site/Header";
import { ProductGallery } from "@/components/site/ProductGallery";
import { ProductHeading } from "@/components/site/ProductHeading";
import { ProductBuyBox } from "@/components/site/ProductBuyBox";
import { Sections } from "@/components/site/Sections";
import { Footer } from "@/components/site/Footer";
import { CheckoutProvider } from "@/components/checkout/CheckoutProvider";
import heroImg from "@/assets/gallery-clareador-tube.webp";
import { fpAttrs, fpClass } from "@/lib/daily-fingerprint";

export const Route = createFileRoute("/")({
  component: Index,
  head: () => ({
    meta: [
      { title: "Clareador Dérmico Cicatribem — Manchas, Axilas e Virilha" },
      { name: "description", content: "Creme clareador Cicatribem para melasma, axilas, virilha e rosto. Fórmula com Lumin White™, Niacinamida e Ácido Glicólico. Frete grátis." },
    ],
    links: [
      { rel: "preload", as: "image", href: heroImg, fetchPriority: "high" },
    ],
  }),
});

function Index() {
  return (
    <CheckoutProvider>
      <div className={`min-h-screen bg-background ${fpClass("page")}`} {...fpAttrs("page")}>
        <Announcement />
        <Header />
        <main className={fpClass("main")} {...fpAttrs("main")}>
          <section className={`mx-auto max-w-7xl px-4 py-4 sm:py-8 ${fpClass("hero")}`} {...fpAttrs("hero")}>
            <div className={`grid gap-4 lg:grid-cols-2 lg:gap-x-16 lg:gap-y-6 ${fpClass("herogrid")}`}>
              <ProductHeading className="lg:col-start-2 lg:row-start-1" />
              <div className="lg:col-start-1 lg:row-start-1 lg:row-span-2">
                <ProductGallery />
              </div>
              <div className="lg:col-start-2 lg:row-start-2">
                <ProductBuyBox />
              </div>
            </div>
          </section>
          <Sections />
        </main>
        <Footer />
      </div>
    </CheckoutProvider>
  );
}
