import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { z } from "zod";
import { createPixOrder } from "@/lib/checkout.functions";
import { getKit } from "@/lib/kits";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Loader2, ShieldCheck } from "lucide-react";

const searchSchema = z.object({ kit: z.coerce.string().optional() });

export const Route = createFileRoute("/checkout")({
  validateSearch: searchSchema,
  component: CheckoutPage,
  head: () => ({ meta: [{ title: "Checkout — Cicatribem" }] }),
});

function CheckoutPage() {
  const { kit: kitParam } = Route.useSearch();
  const kit = getKit(kitParam);
  const navigate = useNavigate();
  const createOrder = useServerFn(createPixOrder);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [form, setForm] = useState({
    customer_name: "",
    customer_email: "",
    customer_phone: "",
    customer_document: "",
    address_cep: "",
    address_street: "",
    address_number: "",
    address_complement: "",
    address_neighborhood: "",
    address_city: "",
    address_state: "",
  });

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const lookupCep = async (cep: string) => {
    const clean = cep.replace(/\D/g, "");
    if (clean.length !== 8) return;
    try {
      const r = await fetch(`https://viacep.com.br/ws/${clean}/json/`);
      const j = await r.json();
      if (j.erro) return;
      setForm((f) => ({
        ...f,
        address_street: f.address_street || j.logradouro || "",
        address_neighborhood: f.address_neighborhood || j.bairro || "",
        address_city: f.address_city || j.localidade || "",
        address_state: f.address_state || j.uf || "",
      }));
    } catch {
      // silencioso
    }
  };

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await createOrder({ data: { kitId: kit.id, ...form } });
      if (!res.ok) {
        setError(res.error);
        setLoading(false);
        return;
      }
      navigate({ to: "/pedido/$transactionId", params: { transactionId: res.transaction_id } });
    } catch (err) {
      console.error(err);
      setError("Erro ao processar. Verifique os dados e tente novamente.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b bg-card/95 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3">
          <Link
            to="/"
            className="inline-flex items-center gap-2 rounded-full border border-border bg-background px-3 py-2 text-sm font-semibold text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground"
            aria-label="Voltar à página do produto"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Voltar ao produto</span>
          </Link>
          <span className="flex items-center gap-1.5 text-xs font-semibold text-success">
            <ShieldCheck className="h-4 w-4" /> Pagamento seguro
          </span>
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-8 px-4 py-8 lg:grid-cols-[1fr_360px]">
        <form onSubmit={onSubmit} className="space-y-8">
          <section className="space-y-4 rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-bold">Seus dados</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nome completo" required>
                <Input value={form.customer_name} onChange={set("customer_name")} required maxLength={120} />
              </Field>
              <Field label="E-mail" required>
                <Input type="email" value={form.customer_email} onChange={set("customer_email")} required maxLength={255} />
              </Field>
              <Field label="Telefone (WhatsApp)" required>
                <Input value={form.customer_phone} onChange={set("customer_phone")} required placeholder="(11) 99999-9999" maxLength={20} />
              </Field>
              <Field label="CPF" required>
                <Input value={form.customer_document} onChange={set("customer_document")} required placeholder="000.000.000-00" maxLength={20} />
              </Field>
            </div>
          </section>

          <section className="space-y-4 rounded-2xl border bg-card p-6">
            <h2 className="text-lg font-bold">Endereço de entrega</h2>
            <div className="grid gap-4 sm:grid-cols-6">
              <div className="sm:col-span-2">
                <Field label="CEP" required>
                  <Input
                    value={form.address_cep}
                    onChange={(e) => {
                      set("address_cep")(e);
                      lookupCep(e.target.value);
                    }}
                    required
                    placeholder="00000-000"
                    maxLength={10}
                  />
                </Field>
              </div>
              <div className="sm:col-span-4">
                <Field label="Rua / Logradouro" required>
                  <Input value={form.address_street} onChange={set("address_street")} required maxLength={200} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Número" required>
                  <Input value={form.address_number} onChange={set("address_number")} required maxLength={20} />
                </Field>
              </div>
              <div className="sm:col-span-4">
                <Field label="Complemento">
                  <Input value={form.address_complement} onChange={set("address_complement")} maxLength={100} />
                </Field>
              </div>
              <div className="sm:col-span-3">
                <Field label="Bairro" required>
                  <Input value={form.address_neighborhood} onChange={set("address_neighborhood")} required maxLength={120} />
                </Field>
              </div>
              <div className="sm:col-span-2">
                <Field label="Cidade" required>
                  <Input value={form.address_city} onChange={set("address_city")} required maxLength={120} />
                </Field>
              </div>
              <div className="sm:col-span-1">
                <Field label="UF" required>
                  <Input
                    value={form.address_state}
                    onChange={(e) => setForm((f) => ({ ...f, address_state: e.target.value.toUpperCase().slice(0, 2) }))}
                    required
                    maxLength={2}
                    placeholder="SP"
                  />
                </Field>
              </div>
            </div>
          </section>

          {error && (
            <div className="rounded-lg border border-destructive/40 bg-destructive/10 px-4 py-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            type="submit"
            disabled={loading}
            className="h-14 w-full bg-[hsl(22,95%,55%)] text-base font-extrabold uppercase tracking-wide hover:bg-[hsl(22,95%,50%)]"
          >
            {loading ? (
              <>
                <Loader2 className="mr-2 h-5 w-5 animate-spin" /> Gerando Pix...
              </>
            ) : (
              "Gerar Pix e finalizar"
            )}
          </Button>
        </form>

        <aside className="space-y-4 lg:sticky lg:top-6 lg:h-fit">
          <div className="rounded-2xl border bg-card p-6">
            <h3 className="text-sm font-bold uppercase tracking-wide text-muted-foreground">Resumo do pedido</h3>
            <div className="mt-4 space-y-2">
              <p className="text-sm font-semibold">{kit.name}</p>
              <p className="text-xs text-muted-foreground">Qtd: {kit.quantity}</p>
            </div>
            <div className="mt-6 space-y-2 border-t pt-4 text-sm">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Subtotal</span>
                <span>R$ {kit.price.toFixed(2).replace(".", ",")}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Frete</span>
                <span className="font-semibold text-success">Grátis</span>
              </div>
              <div className="flex justify-between border-t pt-2 text-base font-extrabold">
                <span>Total</span>
                <span>R$ {kit.price.toFixed(2).replace(".", ",")}</span>
              </div>
            </div>
          </div>
        </aside>
      </main>
    </div>
  );
}

function Field({ label, required, children }: { label: string; required?: boolean; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-semibold">
        {label} {required && <span className="text-destructive">*</span>}
      </Label>
      {children}
    </div>
  );
}
