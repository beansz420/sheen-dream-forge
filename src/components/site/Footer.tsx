export function Footer() {
  return (
    <footer className="border-t bg-secondary py-12">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 md:grid-cols-4">
        <div>
          <p className="mb-3 text-2xl font-black text-primary">CICATRIBEM</p>
          <p className="text-sm text-muted-foreground">Dermocosméticos com tecnologia avançada para uma pele uniforme e saudável.</p>
        </div>
        <div>
          <h4 className="mb-3 font-bold">Atendimento</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Central de ajuda</li>
            <li>Trocas e devoluções</li>
            <li>Rastreie seu pedido</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-bold">Institucional</h4>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>Sobre nós</li>
            <li>Política de privacidade</li>
            <li>Termos de uso</li>
          </ul>
        </div>
        <div>
          <h4 className="mb-3 font-bold">Pagamento</h4>
          <p className="text-sm text-muted-foreground">PIX.</p>
        </div>
      </div>
      <p className="mt-10 px-4 text-center text-xs text-muted-foreground">
        © 2026 Cicatribem. Todos os direitos reservados.
      </p>
    </footer>
  );
}
