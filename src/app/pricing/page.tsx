import { auth } from "@/lib/auth";
import { PricingCards } from "@/components/pricing-cards";
import Link from "next/link";
import { Button } from "@/components/ui/button";

export default async function PricingPage() {
  const session = await auth();

  return (
    <div className="flex min-h-screen flex-col items-center justify-center px-4 py-16">
      <div className="text-center">
        <h1 className="text-4xl font-bold tracking-tight">
          Escolha o plano ideal para você
        </h1>
        <p className="mt-4 text-lg text-muted-foreground">
          Comece grátis e evolua conforme sua necessidade
        </p>
      </div>
      <PricingCards currentPlan={session?.user?.plan ?? "FREE"} isLoggedIn={!!session?.user} />
      {!session?.user && (
        <p className="mt-8 text-sm text-muted-foreground">
          Já tem conta?{" "}
          <Link href="/login" className="text-primary underline">
            Entrar
          </Link>
        </p>
      )}
      {session?.user && (
        <Button variant="ghost" asChild className="mt-8">
          <Link href="/dashboard">Voltar ao dashboard</Link>
        </Button>
      )}
    </div>
  );
}
