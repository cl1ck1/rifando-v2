import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { ShoppingBag, Users, CalendarCheck, ArrowRight } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="border-b">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2 font-bold text-xl text-primary">
            <ShoppingBag className="w-6 h-6" />
            <span>Sou Rifeiro</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/sign-in" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Entrar
            </Link>
            <Link href="/sign-up">
              <Button size="sm">Comecar Agora</Button>
            </Link>
          </div>
        </div>
      </header>

      <section className="max-w-4xl mx-auto px-4 py-24 text-center">
        <p className="text-sm font-medium text-primary mb-4">
          A plataforma n.1 para vendedores ambulantes
        </p>
        <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-foreground leading-tight">
          Sua plataforma completa para{" "}
          <span className="text-primary">vendas porta a porta</span>
        </h1>
        <p className="mt-6 text-lg text-muted-foreground max-w-2xl mx-auto">
          Gerencie produtos, clientes, vendas e parcelas em um so lugar.
          Abandone as planilhas e profissionalize seu negocio de revenda.
        </p>
        <div className="mt-8 flex justify-center gap-4">
          <Link href="/sign-up">
            <Button size="lg" className="gap-2">
              Criar Conta Gratis <ArrowRight className="w-4 h-4" />
            </Button>
          </Link>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 pb-24">
        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card rounded-lg border p-6">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
              <ShoppingBag className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Controle de Vendas</h3>
            <p className="text-sm text-muted-foreground">
              Registre vendas com itens, calcule parcelas automaticamente e acompanhe o status de cada venda.
            </p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
              <Users className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">CRM de Clientes</h3>
            <p className="text-sm text-muted-foreground">
              Cadastre clientes com endereco de entrega, historico de compras e informacoes de contato.
            </p>
          </div>
          <div className="bg-card rounded-lg border p-6">
            <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center mb-4">
              <CalendarCheck className="w-5 h-5 text-primary" />
            </div>
            <h3 className="font-semibold text-foreground mb-2">Parcelas e Cobrancas</h3>
            <p className="text-sm text-muted-foreground">
              Controle parcelas, veja quem esta em dia e quem esta atrasado. Receba por Pix, dinheiro ou cartao.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t py-8 text-center text-sm text-muted-foreground">
        Sou Rifeiro - Todos os direitos reservados
      </footer>
    </div>
  );
}
