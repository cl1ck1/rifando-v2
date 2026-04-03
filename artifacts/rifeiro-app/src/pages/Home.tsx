import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { MapPin, Users, CreditCard, ArrowRight, CheckCircle2 } from "lucide-react";

export default function Home() {
  return (
    <div className="flex flex-col min-h-[100dvh] bg-background">
      {/* Header */}
      <header className="px-6 lg:px-8 h-20 flex items-center justify-between border-b">
        <div className="flex items-center gap-2">
          <div className="bg-primary/10 p-2 rounded-xl text-primary">
            <MapPin className="h-6 w-6" />
          </div>
          <span className="font-bold text-xl text-foreground">Sou Rifeiro</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/sign-in">
            <Button variant="ghost" className="font-medium">
              Entrar
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="font-medium">
              Começar Agora
            </Button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="flex-1 flex flex-col items-center text-center px-6 pt-24 pb-32">
        <div className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 border-transparent bg-primary/10 text-primary mb-8">
          A plataforma nº 1 para vendedores de excursões
        </div>
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl mb-6 text-foreground">
          Sua plataforma completa para <span className="text-primary">vender excursões</span> de ônibus
        </h1>
        <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mb-10">
          Gerencie viagens, clientes, pagamentos e vendas em um só lugar. Abandone as planilhas e profissionalize seu negócio de excursões.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 w-full justify-center max-w-md">
          <Link href="/sign-up" className="w-full sm:w-auto">
            <Button size="lg" className="w-full h-14 text-lg group">
              Criar Conta Grátis
              <ArrowRight className="ml-2 h-5 w-5 group-hover:translate-x-1 transition-transform" />
            </Button>
          </Link>
        </div>

        {/* Features Grid */}
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mt-32 text-left">
          <div className="bg-card p-6 rounded-2xl border hover:border-primary/50 transition-colors shadow-sm">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
              <MapPin className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Gestão de Viagens</h3>
            <p className="text-muted-foreground">
              Controle assentos, rotas e status das suas viagens. Saiba exatamente quem vai em cada poltrona.
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border hover:border-primary/50 transition-colors shadow-sm">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
              <CreditCard className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">Controle Financeiro</h3>
            <p className="text-muted-foreground">
              Acompanhe pagamentos, parcelas e receba alertas de inadimplência. Nunca mais perca dinheiro.
            </p>
          </div>
          
          <div className="bg-card p-6 rounded-2xl border hover:border-primary/50 transition-colors shadow-sm">
            <div className="h-12 w-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center mb-6">
              <Users className="h-6 w-6" />
            </div>
            <h3 className="text-xl font-bold mb-3">CRM de Clientes</h3>
            <p className="text-muted-foreground">
              Mantenha o histórico de todos os seus clientes. Saiba quem viaja mais e fidelize seu público.
            </p>
          </div>
        </div>

        {/* Value Props */}
        <div className="mt-32 max-w-4xl text-left">
          <h2 className="text-3xl font-bold text-center mb-12">Por que escolher o Sou Rifeiro?</h2>
          <div className="grid sm:grid-cols-2 gap-y-6 gap-x-12">
            {[
              "Sem necessidade de instalar nada, acesse de qualquer lugar",
              "Design responsivo que funciona perfeitamente no celular",
              "Suporte técnico especializado para o seu negócio",
              "Exportação de relatórios e lista de passageiros em PDF/Excel",
              "Catálogo online para os clientes verem suas próximas viagens",
              "Integração com WhatsApp para avisos automáticos (em breve)"
            ].map((prop, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle2 className="h-6 w-6 text-primary shrink-0" />
                <span className="text-foreground">{prop}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="py-8 border-t bg-muted/20 text-center text-muted-foreground">
        <p>© {new Date().getFullYear()} Sou Rifeiro. Todos os direitos reservados.</p>
      </footer>
    </div>
  );
}