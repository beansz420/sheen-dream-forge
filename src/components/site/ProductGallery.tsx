import { useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import img1 from "@/assets/gallery-clareador-tube.webp";
import img2 from "@/assets/gallery-clareador-model.webp";
import img3 from "@/assets/gallery-clareador-blue.webp";
import img4 from "@/assets/gallery-clareador-leg.webp";
import img5 from "@/assets/gallery-regenerador.webp";
import img6 from "@/assets/gallery-serum.webp";

const slides = [
  { src: img1, alt: "Clareador Dérmico - embalagem" },
  { src: img2, alt: "Modelo aplicando o Clareador Dérmico" },
  { src: img3, alt: "Textura cremosa do Clareador Dérmico" },
  { src: img4, alt: "Aplicação na perna" },
  { src: img5, alt: "Regenerador Dérmico em uso" },
  { src: img6, alt: "Sérum Facial Hidratante - brinde" },
];

export function ProductGallery() {
  const [i, setI] = useState(0);
  const prev = () => setI((p) => (p - 1 + slides.length) % slides.length);
  const next = () => setI((p) => (p + 1) % slides.length);

  return (
    <div className="space-y-3">
      <div className="relative overflow-hidden rounded-2xl bg-secondary">
        <img
          key={i}
          src={slides[i].src}
          alt={slides[i].alt}
          className="h-[34vh] max-h-[330px] w-full object-cover animate-in fade-in duration-300 sm:aspect-square sm:h-auto sm:max-h-none"
          width={1024}
          height={1024}
          loading={i === 0 ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={i === 0 ? "high" : "auto"}
        />

        <button
          type="button"
          onClick={prev}
          aria-label="Imagem anterior"
          className="absolute left-3 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-background/90 text-foreground shadow-lg ring-1 ring-border backdrop-blur transition hover:bg-background hover:scale-105 active:scale-95"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <button
          type="button"
          onClick={next}
          aria-label="Próxima imagem"
          className="absolute right-3 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-background/90 text-foreground shadow-lg ring-1 ring-border backdrop-blur transition hover:bg-background hover:scale-105 active:scale-95"
        >
          <ChevronRight className="h-5 w-5" />
        </button>

        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 rounded-full bg-background/80 px-3 py-1 text-xs font-medium text-foreground shadow ring-1 ring-border backdrop-blur">
          {i + 1} / {slides.length}
        </div>
      </div>

    </div>
  );
}

