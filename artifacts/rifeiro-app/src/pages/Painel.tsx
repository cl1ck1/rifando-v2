import { useGetDashboardSummary, useGetRevenueByMonth, useGetTopCustomers, useGetRecentActivity, useGetParcelasAtrasadas } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, ShoppingBag, DollarSign, AlertTriangle, TrendingUp, CalendarCheck } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

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
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Painel</h1>
        <p className="text-muted-foreground">Visao geral do seu negocio</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label}>
            <CardContent className="p-4">
              {summaryLoading ? (
                <Skeleton className="h-12 w-full" />
              ) : (
                <>
                  <div className="flex items-center gap-2 mb-2">
                    <kpi.icon className={`w-4 h-4 ${kpi.color}`} />
                    <span className="text-xs text-muted-foreground">{kpi.label}</span>
                  </div>
                  <p className="text-lg font-bold text-foreground">{kpi.value}</p>
                </>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Receita por Mes</CardTitle>
          </CardHeader>
          <CardContent>
            {revenueData && revenueData.length > 0 ? (
              <ResponsiveContainer width="100%" height={250}>
                <BarChart data={revenueData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis tick={{ fontSize: 12 }} />
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="vendas" fill="hsl(var(--primary))" name="Vendas" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="recebido" fill="hsl(142 72% 42%)" name="Recebido" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum dado disponivel</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Melhores Clientes</CardTitle>
          </CardHeader>
          <CardContent>
            {topCustomers && topCustomers.length > 0 ? (
              <div className="space-y-3">
                {topCustomers.map((c, i) => (
                  <Link key={c.id} href={`/clientes/${c.id}`} className="flex items-center justify-between py-2 hover:bg-muted/50 px-2 rounded-md transition-colors">
                    <div className="flex items-center gap-3">
                      <span className="text-sm font-medium text-muted-foreground w-6">{i + 1}.</span>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.nome}</p>
                        <p className="text-xs text-muted-foreground">{c.cidade || "Sem cidade"}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-semibold text-foreground">{formatCurrency(c.totalCompras)}</p>
                      <p className="text-xs text-muted-foreground">{c.comprasCount} compras</p>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhum cliente ainda</p>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Parcelas Atrasadas</CardTitle>
          </CardHeader>
          <CardContent>
            {atrasadas && atrasadas.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {atrasadas.map((p) => (
                  <div key={p.id} className="flex items-center justify-between py-2 px-2 border rounded-md">
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
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma parcela atrasada</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Atividade Recente</CardTitle>
          </CardHeader>
          <CardContent>
            {activity && activity.length > 0 ? (
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {activity.map((a) => (
                  <div key={a.id} className="flex items-start gap-3 py-2">
                    <Badge variant="outline" className="text-xs shrink-0 mt-0.5">{a.type}</Badge>
                    <div>
                      <p className="text-sm text-foreground">{a.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(a.createdAt).toLocaleDateString("pt-BR")}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-8">Nenhuma atividade ainda</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
