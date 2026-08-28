import { Star, Eye } from "lucide-react";

export function ProductHeading({ className = "" }: { className?: string }) {
  return (
    <div className={`space-y-2 ${className}`}>
      <div className="flex items-center gap-2 text-xs">
        <span className="relative flex h-2.5 w-2.5">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-success opacity-75" />
          <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-success" />
        </span>
        <span className="flex items-center gap-1.5 text-muted-foreground">
          <Eye className="h-3.5 w-3.5" /> 187 vendo agora
        </span>
      </div>

      <h1 className="text-[26px] font-extrabold leading-[1.15] tracking-tight md:text-4xl">
        Clareador Dérmico Cicatribem
      </h1>

      <p className="text-sm text-muted-foreground">
        Clareia manchas em <span className="font-semibold text-foreground">axilas, virilha, rosto e joelhos</span>
      </p>

      <div className="flex items-center gap-2">
        <span className="flex">
          {[...Array(5)].map((_, i) => (
            <Star key={i} className="h-4 w-4 fill-promo text-promo" />
          ))}
        </span>
        <span className="text-sm font-semibold">4.9</span>
        <span className="text-sm text-muted-foreground">(2.847 avaliações)</span>
      </div>
    </div>
  );
}
