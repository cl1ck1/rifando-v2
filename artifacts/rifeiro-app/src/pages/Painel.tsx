import { useGetDashboardSummary, useGetRevenueByMonth, useGetTopCustomers, useGetRecentActivity, useGetParcelasAtrasadas } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Users, ShoppingBag, DollarSign, AlertTriangle,
  TrendingUp, CalendarCheck, Package, MapPin,
  ChevronRight, ArrowRight,
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const modulos = [
  {
    href: "/clientes",
    label: "Clientes",
    descricao: "Gerencie seus compradores e vinculos de rota",
    icon: Users,
    bg: "bg-violet-50 dark:bg-violet-950/30",
    iconBg: "bg-violet-100 dark:bg-violet-900/50",
    iconColor: "text-violet-600 dark:text-violet-400",
    border: "border-violet-200 dark:border-violet-800",
    hover: "hover:border-violet-400 hover:shadow-violet-100",
  },
  {
    href: "/vendas",
    label: "Vendas",
    descricao: "Registre e acompanhe todas as suas vendas",
    icon: ShoppingBag,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    iconBg: "bg-blue-100 dark:bg-blue-900/50",
    iconColor: "text-blue-600 dark:text-blue-400",
    border: "border-blue-200 dark:border-blue-800",
    hover: "hover:border-blue-400 hover:shadow-blue-100",
  },
  {
    href: "/parcelas",
    label: "Parcelas",
    descricao: "Controle cobranças, vencimentos e recebimentos",
    icon: CalendarCheck,
    bg: "bg-amber-50 dark:bg-amber-950/30",
    iconBg: "bg-amber-100 dark:bg-amber-900/50",
    iconColor: "text-amber-600 dark:text-amber-400",
    border: "border-amber-200 dark:border-amber-800",
    hover: "hover:border-amber-400 hover:shadow-amber-100",
  },
  {
    href: "/catalogo",
    label: "Catalogo",
    descricao: "Produtos e precos para oferecer aos clientes",
    icon: Package,
    bg: "bg-cyan-50 dark:bg-cyan-950/30",
    iconBg: "bg-cyan-100 dark:bg-cyan-900/50",
    iconColor: "text-cyan-600 dark:text-cyan-400",
    border: "border-cyan-200 dark:border-cyan-800",
    hover: "hover:border-cyan-400 hover:shadow-cyan-100",
  },
  {
    href: "/rotas",
    label: "Rotas",
    descricao: "Planeje seus trajetos de venda porta a porta",
    icon: MapPin,
    bg: "bg-green-50 dark:bg-green-950/30",
    iconBg: "bg-green-100 dark:bg-green-900/50",
    iconColor: "text-green-600 dark:text-green-400",
    border: "border-green-200 dark:border-green-800",
    hover: "hover:border-green-400 hover:shadow-green-100",
  },
];

export default function Painel() {
  const { data: summary, isLoading: summaryLoading } = useGetDashboardSummary();
  const { data: revenueData } = useGetRevenueByMonth();
  const { data: topCustomers } = useGetTopCustomers({ limit: 5 });
  const { data: activity } = useGetRecentActivity({ limit: 8 });
  const { data: atrasadas } = useGetParcelasAtrasadas();

  const kpis = [
    { label: "Total Vendas", value: summary ? formatCurrency(summary.totalVendas) : "-", icon: ShoppingBag, color: "text-blue-600" },
    { label: "Total Recebido", value: summary ? formatCurrency(summary.totalRecebido) : "-", icon: DollarSign, color: "text-green-600" },
    { label: "Total Pendente", value: summary ? formatCurrency(summary.totalPendente) : "-", icon: TrendingUp, color: "text-amber-600" },
    { label: "Clientes", value: summary ? String(summary.totalClientes) : "-", icon: Users, color: "text-violet-600" },
    { label: "Vendas no Mes", value: summary ? String(summary.vendasMes) : "-", icon: CalendarCheck, color: "text-cyan-600" },
    { label: "Parcelas Atrasadas", value: summary ? String(summary.parcelasAtrasadas) : "-", icon: AlertTriangle, color: "text-red-600" },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel</h1>
        <p className="text-muted-foreground text-sm">Bem-vindo de volta. Escolha um modulo ou confira a visao geral.</p>
      </div>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Modulos</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {modulos.map((mod) => (
            <Link key={mod.href} href={mod.href}>
              <div
                className={`
                  group relative flex flex-col gap-3 p-4 rounded-xl border cursor-pointer
                  transition-all duration-200
                  ${mod.bg} ${mod.border} ${mod.hover}
                  hover:shadow-md hover:-translate-y-0.5
                `}
              >
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${mod.iconBg}`}>
                  <mod.icon className={`w-5 h-5 ${mod.iconColor}`} />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-sm text-foreground leading-tight">{mod.label}</p>
                  <p className="text-xs text-muted-foreground mt-1 leading-snug line-clamp-2">{mod.descricao}</p>
                </div>
                <ArrowRight className={`w-3.5 h-3.5 ${mod.iconColor} opacity-0 group-hover:opacity-100 transition-opacity absolute top-3 right-3`} />
              </div>
            </Link>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-3">Visao Geral</h2>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 mb-5">
          {kpis.map((kpi) => (
            <Card key={kpi.label} className="border-border/60">
              <CardContent className="p-4">
                {summaryLoading ? (
                  <Skeleton className="h-12 w-full" />
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-2">
                      <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                      <span className="text-xs text-muted-foreground leading-tight">{kpi.label}</span>
                    </div>
                    <p className="text-base font-bold text-foreground leading-tight">{kpi.value}</p>
                  </>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="grid md:grid-cols-2 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Receita por Mes</CardTitle>
            </CardHeader>
            <CardContent>
              {revenueData && revenueData.length > 0 ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart data={revenueData}>
                    <CartesianGrid strokeDasharray="3 3" strokeOpacity={0.4} />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    <Bar dataKey="vendas" fill="hsl(var(--primary))" name="Vendas" radius={[4, 4, 0, 0]} />
                    <Bar dataKey="recebido" fill="hsl(142 72% 42%)" name="Recebido" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">Nenhum dado disponivel</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Melhores Clientes</CardTitle>
                <Link href="/clientes">
                  <span className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
                    Ver todos <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {topCustomers && topCustomers.length > 0 ? (
                <div className="space-y-1">
                  {topCustomers.map((c, i) => (
                    <Link key={c.id} href={`/clientes/${c.id}`}>
                      <div className="flex items-center justify-between py-2 hover:bg-muted/50 px-2 rounded-md transition-colors">
                        <div className="flex items-center gap-3">
                          <span className="text-xs font-medium text-muted-foreground w-5">{i + 1}.</span>
                          <div>
                            <p className="text-sm font-medium text-foreground">{c.nome}</p>
                            <p className="text-xs text-muted-foreground">{c.cidade || "Sem cidade"}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-semibold text-foreground">{formatCurrency(c.totalCompras)}</p>
                          <p className="text-xs text-muted-foreground">{c.comprasCount} compras</p>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">Nenhum cliente ainda</p>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="grid md:grid-cols-2 gap-4 mt-4">
          <Card>
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-sm font-semibold">Parcelas Atrasadas</CardTitle>
                <Link href="/parcelas">
                  <span className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-0.5 transition-colors">
                    Ver todas <ChevronRight className="w-3 h-3" />
                  </span>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              {atrasadas && atrasadas.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {atrasadas.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-2 px-3 bg-red-50 dark:bg-red-950/20 border border-red-100 dark:border-red-900/30 rounded-lg">
                      <div>
                        <p className="text-sm font-medium text-foreground">{p.clienteNome}</p>
                        <p className="text-xs text-muted-foreground">
                          Parcela {p.parcela}/{p.totalParcelas} - Venc. {p.dataVencimento}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-red-600">{formatCurrency(p.valor)}</p>
                        <Badge variant="destructive" className="text-xs">{p.diasAtraso}d atraso</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">Nenhuma parcela atrasada</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-semibold">Atividade Recente</CardTitle>
            </CardHeader>
            <CardContent>
              {activity && activity.length > 0 ? (
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {activity.map((a) => (
                    <div key={a.id} className="flex items-start gap-3 py-2">
                      <Badge variant="outline" className="text-xs shrink-0 mt-0.5">{a.type}</Badge>
                      <div>
                        <p className="text-sm text-foreground leading-tight">{a.description}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground text-center py-10">Nenhuma atividade ainda</p>
              )}
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
