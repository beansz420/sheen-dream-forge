import { X, Check, ShieldCheck, Truck, Award, Star, BadgeCheck } from "lucide-react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { KitsSection } from "@/components/site/KitsSection";
import reviewForehead from "@/assets/review-forehead.webp";
import reviewArmpit from "@/assets/review-armpit.webp";
import reviewKit from "@/assets/review-kit.webp";
import reviewTube from "@/assets/review-tube.webp";

const problems = [
  "Manchas escuras difíceis de uniformizar",
  "Escurecimento em axilas, virilha e áreas íntimas",
  "Marcas pós-acne que não saem",
  "Tom de pele desigual no rosto e corpo",
  "Pele opaca, sem viço e envelhecida",
  "Desconforto e baixa autoestima com a aparência",
];

const actives = [
  {
    n: "01",
    title: "Lumin White™",
    dose: "Tecnologia clareadora",
    desc: "Inibe a melanina e clareia de forma progressiva, mesmo em manchas antigas.",
  },
  {
    n: "02",
    title: "Niacinamida",
    dose: "5% de concentração",
    desc: "Uniformiza o tom, fortalece a barreira cutânea e reduz manchas pós-inflamatórias.",
  },
  {
    n: "03",
    title: "Ácido Glicólico",
    dose: "Ação renovadora",
    desc: "Renova as camadas da pele e potencializa a absorção dos demais ativos.",
  },
];

const reviews = [
  {
    name: "Patrícia R.",
    city: "Curitiba, PR",
    when: "1 semana atrás",
    text:
      "Sofria com manchas na testa há anos. Em 30 dias clarearam visivelmente, como mostra a foto. Recomendo de olhos fechados!",
    initials: "PR",
    image: reviewForehead,
    imageAlt: "Antes e depois — manchas na testa",
  },
  {
    name: "Carla M.",
    city: "São Paulo, SP",
    when: "3 dias atrás",
    text:
      "Comecei a usar há 3 semanas e a diferença nas axilas é absurda. Já posso usar regata sem vergonha. Vale cada centavo!",
    initials: "CM",
    image: reviewArmpit,
    imageAlt: "Antes e depois — clareamento das axilas",
  },
  {
    name: "Roberto S.",
    city: "Belo Horizonte, MG",
    when: "2 semanas atrás",
    text:
      "Comprei para a minha esposa e acabei usando também nos cotovelos e joelhos escurecidos. Resultado sensacional, pele uniforme.",
    initials: "RS",
    image: reviewTube,
    imageAlt: "Cliente segurando o tubo do Clareador Dérmico",
  },
  {
    name: "Juliana F.",
    city: "Florianópolis, SC",
    when: "5 dias atrás",
    text:
      "Era cética, mas em 2 semanas já vi diferença na virilha. Comprei o kit de 2 e gostei tanto que vou pegar o kit de 3.",
    initials: "JF",
    image: reviewKit,
    imageAlt: "Kit Clareador Dérmico + Sérum recebido pela cliente",
  },
];

const guarantees = [
  { i: ShieldCheck, t: "Compra 100% Segura", d: "Seus dados protegidos com criptografia de ponta" },
  { i: Truck, t: "Frete Grátis via Sedex", d: "Entrega em 2 a 5 dias úteis para todo Brasil" },
  { i: BadgeCheck, t: "Garantia de 30 dias", d: "Satisfação garantida ou seu dinheiro de volta" },
  { i: Award, t: "Dermatologicamente testado", d: "Fórmula segura, hipoalergênica e eficaz" },
];

const faqs = [
  {
    q: "Em quanto tempo vou ver os resultados?",
    a: "Os primeiros sinais de uniformização aparecem em até 30 dias de uso contínuo. Manchas mais escuras costumam clarear visivelmente entre 60 e 90 dias.",
  },
  {
    q: "Posso usar no rosto e no corpo?",
    a: "Sim. A fórmula foi desenvolvida para uso facial, axilas, virilha, áreas íntimas, cotovelos e joelhos.",
  },
  {
    q: "Tem garantia?",
    a: "Sim. Oferecemos 30 dias de garantia incondicional. Se não gostar, devolvemos 100% do seu dinheiro.",
  },
  {
    q: "O frete é realmente grátis?",
    a: "Sim, o frete é grátis para todo o Brasil em qualquer um dos kits desta promoção.",
  },
  {
    q: "Posso usar grávida ou amamentando?",
    a: "Recomendamos consultar o seu médico antes de iniciar o uso de qualquer dermocosmético durante a gestação ou amamentação.",
  },
];

export function Sections() {
  return (
    <div className="space-y-20 py-16">
      {/* Problems */}
      <section className="mx-auto max-w-5xl px-4">
        <h2 className="mb-10 text-center text-2xl font-extrabold leading-tight md:text-4xl">
          Você sabia que <span className="text-primary">8 em cada 10 mulheres</span><br className="hidden md:block" />
          convivem com manchas na pele?
        </h2>
        <div className="mx-auto max-w-2xl space-y-3">
          {problems.map((p) => (
            <div key={p} className="flex items-start gap-3 rounded-xl border bg-card p-4">
              <div className="mt-0.5 rounded-full bg-destructive/10 p-1">
                <X className="h-4 w-4 text-destructive" />
              </div>
              <p className="font-medium">{p}</p>
            </div>
          ))}
          <div className="mt-4 rounded-xl border-2 border-success bg-success/5 p-4">
            <p className="flex items-start gap-3 font-bold">
              <span className="rounded-full bg-success p-1">
                <Check className="h-4 w-4 text-success-foreground" />
              </span>
              Cicatribem resolve TODOS esses problemas em uma única fórmula.
            </p>
          </div>
        </div>
      </section>

      {/* Actives — Tripla Ação */}
      <section className="bg-secondary py-16">
        <div className="mx-auto max-w-6xl px-4">
          <h2 className="mb-2 text-center text-3xl font-extrabold md:text-4xl">Tripla Ação Clareadora</h2>
          <p className="mb-12 text-center text-muted-foreground">
            3 ativos de alta performance em uma única fórmula
          </p>
          <div className="grid gap-6 md:grid-cols-3">
            {actives.map((a) => (
              <div key={a.n} className="relative rounded-2xl border bg-card p-6 shadow-sm">
                <span className="absolute -top-4 left-6 rounded-full bg-gradient-to-br from-primary to-primary-glow px-3 py-1 text-sm font-extrabold text-primary-foreground shadow">
                  {a.n}
                </span>
                <h3 className="mt-2 text-xl font-extrabold">{a.title}</h3>
                <p className="mt-1 text-sm font-semibold text-primary">{a.dose}</p>
                <p className="mt-3 text-sm text-muted-foreground">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Kits — acima das provas sociais para aumentar conversão */}
      <KitsSection />

      {/* Reviews */}
      <section className="mx-auto max-w-6xl px-4">

        <div className="mb-10 text-center">
          <h2 className="text-3xl font-extrabold md:text-4xl">O que dizem nossas clientes</h2>
          <div className="mt-3 flex items-center justify-center gap-2">
            <div className="flex">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="h-5 w-5 fill-promo text-promo" />
              ))}
            </div>
            <span className="font-bold">4.9/5</span>
            <span className="text-muted-foreground">· 3.812+ clientes satisfeitas</span>
          </div>
        </div>

        <div className="grid gap-5 md:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.name} className="rounded-2xl border bg-card p-5 shadow-sm">
              <div className="flex items-center gap-3">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-glow text-sm font-bold text-primary-foreground">
                  {r.initials}
                </div>
                <div className="flex-1">
                  <p className="flex items-center gap-1.5 text-sm font-bold">
                    {r.name}
                    <BadgeCheck className="h-4 w-4 text-primary" />
                    <span className="text-xs font-normal text-muted-foreground">Verificada</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{r.city} · {r.when}</p>
                </div>
                <div className="flex">
                  {[...Array(5)].map((_, i) => (
                    <Star key={i} className="h-3.5 w-3.5 fill-promo text-promo" />
                  ))}
                </div>
              </div>
              <p className="mt-4 text-sm leading-relaxed text-foreground">"{r.text}"</p>
              {r.image && (
                <div className="mt-4 overflow-hidden rounded-xl border bg-muted">
                  <img
                    src={r.image}
                    alt={r.imageAlt}
                    className="aspect-[4/3] w-full object-cover"
                    loading="lazy"
                  />
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* Urgency */}
      <section className="mx-auto max-w-3xl px-4">
        <div className="rounded-2xl border-2 border-promo bg-promo/10 p-6 text-center md:p-10">
          <p className="mb-2 text-xs font-bold uppercase tracking-wider text-promo">⚠ Atenção</p>
          <h2 className="text-2xl font-extrabold md:text-3xl">Estoque quase esgotado!</h2>
          <p className="mt-3 text-sm text-muted-foreground">
            Restam apenas <span className="font-bold text-foreground">14 unidades</span> com preço promocional.<br />
            Depois, o produto volta ao preço original.
          </p>
          <p className="mt-4 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
            Oferta por tempo limitado
          </p>
        </div>
      </section>

      {/* Guarantees */}
      <section className="mx-auto max-w-6xl px-4">
        <h2 className="mb-12 text-center text-3xl font-extrabold md:text-4xl">Garantias Cicatribem</h2>
        <div className="grid gap-5 md:grid-cols-2 lg:grid-cols-4">
          {guarantees.map(({ i: Icon, t, d }) => (
            <div key={t} className="rounded-2xl border bg-card p-6 text-center shadow-sm">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-primary to-primary-glow">
                <Icon className="h-7 w-7 text-primary-foreground" />
              </div>
              <h3 className="font-bold">{t}</h3>
              <p className="mt-1 text-sm text-muted-foreground">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ */}
      <section className="mx-auto max-w-3xl px-4">
        <h2 className="mb-10 text-center text-3xl font-extrabold md:text-4xl">Perguntas Frequentes</h2>
        <Accordion type="single" collapsible className="space-y-3">
          {faqs.map((f, i) => (
            <AccordionItem
              key={i}
              value={`item-${i}`}
              className="rounded-xl border bg-card px-5"
            >
              <AccordionTrigger className="text-left font-bold">{f.q}</AccordionTrigger>
              <AccordionContent className="text-sm text-muted-foreground">{f.a}</AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </section>
    </div>
  );
}
