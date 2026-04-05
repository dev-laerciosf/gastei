import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import Link from "next/link";
import {
  ArrowRight,
  BarChart3,
  CreditCard,
  PiggyBank,
  Receipt,
  RefreshCcw,
  Github,
  Shield,
  Sparkles,
  Target,
  Wallet,
  Zap,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { PricingCards } from "@/components/pricing-cards";

export default async function Home() {
  const session = await auth();
  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <div className="flex min-h-screen flex-col">
      <header className="sticky top-0 z-50 border-b bg-background/80 backdrop-blur-sm">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="text-xl font-bold tracking-tight">
            Gastei
          </Link>
          <nav className="hidden items-center gap-6 md:flex">
            <a href="#features" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Funcionalidades
            </a>
            <a href="#how-it-works" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Como funciona
            </a>
            <a href="#pricing" className="text-sm text-muted-foreground transition-colors hover:text-foreground">
              Planos
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/login">Entrar</Link>
            </Button>
            <Button size="sm" asChild>
              <Link href="/register">Começar grátis</Link>
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1">
        <section className="relative overflow-hidden py-24 md:py-32">
          <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted via-background to-background" />
          <div className="mx-auto max-w-6xl px-4 text-center">
            <div className="mx-auto max-w-3xl">
              <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
                <Sparkles className="h-4 w-4" />
                Controle financeiro simples e poderoso
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Saiba exatamente para onde{" "}
                <span className="bg-gradient-to-r from-blue-500 to-violet-500 bg-clip-text text-transparent">
                  seu dinheiro vai
                </span>
              </h1>
              <p className="mt-6 text-lg text-muted-foreground md:text-xl">
                Registre seus gastos, acompanhe metas, controle orçamentos e tome
                decisões financeiras mais inteligentes — tudo em um só lugar.
              </p>
              <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Button size="lg" className="w-full sm:w-auto" asChild>
                  <Link href="/register">
                    Começar grátis
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Link>
                </Button>
                <Button variant="outline" size="lg" className="w-full sm:w-auto" asChild>
                  <a href="#features">Ver funcionalidades</a>
                </Button>
              </div>
              <p className="mt-4 text-sm text-muted-foreground">
                Sem cartão de crédito. Comece em segundos.
              </p>
              <a
                href="https://github.com/dev-laerciosf/gastei"
                target="_blank"
                rel="noopener noreferrer"
                className="mt-4 inline-flex items-center gap-2 rounded-full border px-4 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              >
                <Github className="h-4 w-4" />
                Open source no GitHub
              </a>
            </div>
          </div>
        </section>

        <section id="features" className="border-t py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Tudo que você precisa para organizar suas finanças
              </h2>
              <p className="mt-4 text-muted-foreground">
                Funcionalidades pensadas para simplificar sua vida financeira
              </p>
            </div>
            <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map((feature) => (
                <div key={feature.title} className="group rounded-xl border p-6 transition-colors hover:bg-muted/50">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <feature.icon className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="mt-4 font-semibold">{feature.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section id="how-it-works" className="border-t bg-muted/30 py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Como funciona
              </h2>
              <p className="mt-4 text-muted-foreground">
                Três passos para ter o controle total das suas finanças
              </p>
            </div>
            <div className="mt-16 grid gap-8 md:grid-cols-3">
              {steps.map((step, i) => (
                <div key={step.title} className="relative text-center">
                  <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-lg font-bold text-primary-foreground">
                    {i + 1}
                  </div>
                  <h3 className="mt-4 font-semibold">{step.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{step.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="border-t py-24">
          <div className="mx-auto max-w-6xl px-4">
            <div className="grid items-center gap-12 lg:grid-cols-2">
              <div>
                <h2 className="text-3xl font-bold tracking-tight">
                  Dashboard completo para decisões inteligentes
                </h2>
                <p className="mt-4 text-muted-foreground">
                  Visualize seus gastos por categoria, acompanhe a evolução mensal
                  e receba insights automáticos sobre seus hábitos financeiros.
                </p>
                <ul className="mt-8 space-y-4">
                  {highlights.map((item) => (
                    <li key={item} className="flex items-start gap-3">
                      <div className="mt-1 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                        <Zap className="h-3 w-3 text-green-500" />
                      </div>
                      <span className="text-sm">{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
              <div className="rounded-xl border bg-card p-6 shadow-sm">
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Resumo de Abril</span>
                    <span className="text-xs text-muted-foreground">2026</span>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <DemoCard label="Receitas" value="R$ 8.500,00" trend="+12%" positive />
                    <DemoCard label="Despesas" value="R$ 5.230,00" trend="-8%" positive />
                    <DemoCard label="Economia" value="R$ 3.270,00" trend="+34%" positive />
                    <DemoCard label="Metas" value="2 de 3" trend="67%" />
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span>Alimentação</span>
                      <span className="text-muted-foreground">R$ 1.200 / R$ 1.500</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 w-4/5 rounded-full bg-blue-500" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Transporte</span>
                      <span className="text-muted-foreground">R$ 450 / R$ 600</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 w-3/4 rounded-full bg-violet-500" />
                    </div>
                    <div className="flex items-center justify-between text-xs">
                      <span>Lazer</span>
                      <span className="text-muted-foreground">R$ 380 / R$ 500</span>
                    </div>
                    <div className="h-2 rounded-full bg-muted">
                      <div className="h-2 w-3/5 rounded-full bg-amber-500" />
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section id="pricing" className="border-t bg-muted/30 py-24">
          <div className="flex flex-col items-center px-4">
            <div className="text-center">
              <h2 className="text-3xl font-bold tracking-tight">
                Planos para cada momento
              </h2>
              <p className="mt-4 text-muted-foreground">
                Comece grátis e evolua conforme sua necessidade
              </p>
            </div>
            <PricingCards currentPlan="FREE" isLoggedIn={false} />
          </div>
        </section>

        <section className="border-t py-24">
          <div className="mx-auto max-w-3xl px-4 text-center">
            <h2 className="text-3xl font-bold tracking-tight">
              Pronto para assumir o controle?
            </h2>
            <p className="mt-4 text-muted-foreground">
              Junte-se a quem já parou de se perguntar &quot;pra onde foi meu dinheiro?&quot;
            </p>
            <Button size="lg" className="mt-8" asChild>
              <Link href="/register">
                Criar conta grátis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t py-8">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-4 text-sm text-muted-foreground md:flex-row">
          <span>&copy; {new Date().getFullYear()} Gastei. Todos os direitos reservados.</span>
          <div className="flex items-center gap-6">
            <a href="#features" className="transition-colors hover:text-foreground">Funcionalidades</a>
            <a href="#pricing" className="transition-colors hover:text-foreground">Planos</a>
            <Link href="/login" className="transition-colors hover:text-foreground">Entrar</Link>
            <a
              href="https://github.com/dev-laerciosf/gastei"
              target="_blank"
              rel="noopener noreferrer"
              className="transition-colors hover:text-foreground"
              aria-label="GitHub"
            >
              <Github className="h-5 w-5" />
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}

function DemoCard({ label, value, trend, positive }: { label: string; value: string; trend: string; positive?: boolean }) {
  return (
    <div className="rounded-lg border bg-background p-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <p className="mt-1 text-sm font-semibold">{value}</p>
      <span className={`text-xs ${positive ? "text-green-500" : "text-muted-foreground"}`}>
        {trend}
      </span>
    </div>
  );
}

const features = [
  {
    icon: Receipt,
    title: "Controle de transações",
    description: "Registre receitas e despesas com categorias, tags e filtros avançados.",
  },
  {
    icon: Wallet,
    title: "Orçamento mensal",
    description: "Defina limites por categoria e acompanhe quanto já gastou em tempo real.",
  },
  {
    icon: RefreshCcw,
    title: "Transações recorrentes",
    description: "Cadastre contas fixas uma vez e elas aparecem automaticamente todo mês.",
  },
  {
    icon: Target,
    title: "Metas de economia",
    description: "Crie metas com prazo e valor, e acompanhe o progresso visual.",
  },
  {
    icon: CreditCard,
    title: "Controle de dívidas",
    description: "Registre parcelas, empréstimos e acompanhe o que ainda falta pagar.",
  },
  {
    icon: BarChart3,
    title: "Insights inteligentes",
    description: "Análises automáticas que mostram tendências e oportunidades de economia.",
  },
{
    icon: PiggyBank,
    title: "Dashboard visual",
    description: "Gráficos claros de gastos por categoria, evolução mensal e balanço.",
  },
  {
    icon: Shield,
    title: "Seguro e privado",
    description: "Seus dados ficam protegidos com autenticação segura e criptografia.",
  },
];

const steps = [
  {
    title: "Crie sua conta",
    description: "Cadastro rápido com e-mail ou Google. Sem burocracia, sem cartão de crédito.",
  },
  {
    title: "Registre seus gastos",
    description: "Adicione suas transações do dia a dia com categorias e tags para organizar tudo.",
  },
  {
    title: "Acompanhe e economize",
    description: "Use o dashboard, orçamentos e metas para tomar decisões mais inteligentes.",
  },
];

const highlights = [
  "Resumo mensal com receitas, despesas e saldo",
  "Gráficos de gastos por categoria e evolução anual",
  "Insights automáticos comparando mês a mês",
  "Progresso de orçamento por categoria em tempo real",
  "Visão consolidada de metas e dívidas",
];
