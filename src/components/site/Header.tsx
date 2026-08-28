import { Search, User, ShoppingBag } from "lucide-react";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/95 backdrop-blur">
      <div className="mx-auto flex max-w-7xl items-center gap-6 px-4 py-4">
        <a href="/" className="text-2xl font-black tracking-tight text-primary">
          CICATRIBEM
        </a>
        <nav className="hidden flex-1 items-center justify-center gap-7 text-sm font-medium lg:flex">
          <a href="#" className="hover:text-primary">Skincare</a>
          <a href="#" className="hover:text-primary">Manchas</a>
          <a href="#" className="hover:text-primary">Estrias</a>
          <a href="#" className="hover:text-primary">Celulite</a>
          <a href="#" className="hover:text-primary">Assinatura</a>
          <a href="#" className="hover:text-primary">Rastrear pedido</a>
        </nav>
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden items-center gap-2 rounded-full border bg-secondary px-4 py-2 md:flex">
            <Search className="h-4 w-4 text-muted-foreground" />
            <input placeholder="Pesquisar produto..." className="w-44 bg-transparent text-sm outline-none" />
          </div>
          <User className="h-5 w-5" />
          <ShoppingBag className="h-5 w-5" />
        </div>
      </div>
    </header>
  );
}
