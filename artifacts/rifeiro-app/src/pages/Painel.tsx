import { useGetDashboardSummary, useGetRevenueByMonth, useGetTopCustomers, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Users, MapPin, CreditCard, Bus, ArrowUpRight, TrendingUp, AlertCircle, Activity } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Link } from "wouter";

export default function Painel() {
  const { data: summary, isLoading: isLoadingSummary } = useGetDashboardSummary();
  const { data: revenue, isLoading: isLoadingRevenue } = useGetRevenueByMonth();
  const { data: topCustomers, isLoading: isLoadingCustomers } = useGetTopCustomers({ limit: 5 });
  const { data: activity, isLoading: isLoadingActivity } = useGetRecentActivity({ limit: 10 });

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusIcon = (type: string) => {
    switch (type) {
      case 'venda': return <CreditCard className="h-4 w-4 text-green-500" />;
      case 'pagamento': return <TrendingUp className="h-4 w-4 text-blue-500" />;
      case 'cliente': return <Users className="h-4 w-4 text-primary" />;
      case 'viagem': return <MapPin className="h-4 w-4 text-orange-500" />;
      default: return <Activity className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Painel de Controle</h1>
        <p className="text-muted-foreground mt-1">Visão geral do seu negócio de excursões.</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <Card className="hover-elevate shadow-sm transition-all border-l-4 border-l-primary">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Receita Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-primary" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-[120px]" />
            ) : (
              <div className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue || 0)}</div>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate shadow-sm transition-all border-l-4 border-l-destructive">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pagamentos Pendentes</CardTitle>
            <AlertCircle className="h-4 w-4 text-destructive" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-[80px]" />
            ) : (
              <div className="text-2xl font-bold">{summary?.pendingPayments || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate shadow-sm transition-all border-l-4 border-l-orange-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Viagens Ativas</CardTitle>
            <Bus className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold">{summary?.activeTrips || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate shadow-sm transition-all border-l-4 border-l-blue-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Assentos Vendidos</CardTitle>
            <MapPin className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold">{summary?.seatsSold || 0}</div>
            )}
          </CardContent>
        </Card>

        <Card className="hover-elevate shadow-sm transition-all border-l-4 border-l-indigo-500">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total de Clientes</CardTitle>
            <Users className="h-4 w-4 text-indigo-500" />
          </CardHeader>
          <CardContent>
            {isLoadingSummary ? (
              <Skeleton className="h-8 w-[60px]" />
            ) : (
              <div className="text-2xl font-bold">{summary?.totalCustomers || 0}</div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7">
        {/* Charts */}
        <Card className="lg:col-span-4 shadow-sm">
          <CardHeader>
            <CardTitle>Receitas por Mês</CardTitle>
            <CardDescription>Comparativo de receitas e despesas.</CardDescription>
          </CardHeader>
          <CardContent className="h-[300px]">
            {isLoadingRevenue ? (
              <div className="h-full flex items-center justify-center">
                <Skeleton className="h-full w-full" />
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={revenue || []} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(var(--border))" />
                  <XAxis 
                    dataKey="month" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }} 
                    dy={10}
                    tickFormatter={(val) => {
                      const [year, month] = val.split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1);
                      return format(date, 'MMM/yy', { locale: ptBR });
                    }}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                    tickFormatter={(val) => `R$${val/1000}k`}
                  />
                  <Tooltip 
                    cursor={{ fill: 'hsl(var(--muted))' }}
                    contentStyle={{ borderRadius: '8px', border: '1px solid hsl(var(--border))' }}
                    formatter={(val: number) => formatCurrency(val)}
                    labelFormatter={(val) => {
                      const [year, month] = val.toString().split('-');
                      const date = new Date(parseInt(year), parseInt(month) - 1);
                      return format(date, 'MMMM yyyy', { locale: ptBR });
                    }}
                  />
                  <Legend iconType="circle" />
                  <Bar dataKey="revenue" name="Receitas" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                  <Bar dataKey="expenses" name="Despesas" fill="hsl(var(--destructive))" radius={[4, 4, 0, 0]} maxBarSize={40} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Recent Activity */}
        <Card className="lg:col-span-3 shadow-sm flex flex-col">
          <CardHeader>
            <CardTitle>Atividade Recente</CardTitle>
            <CardDescription>Últimas ações realizadas no sistema.</CardDescription>
          </CardHeader>
          <CardContent className="flex-1 overflow-y-auto max-h-[300px] pr-2">
            {isLoadingActivity ? (
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center gap-4">
                    <Skeleton className="h-10 w-10 rounded-full shrink-0" />
                    <div className="space-y-2 flex-1">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                  </div>
                ))}
              </div>
            ) : activity && activity.length > 0 ? (
              <div className="space-y-6">
                {activity.map((item) => (
                  <div key={item.id} className="flex items-start gap-4 text-sm group">
                    <div className="p-2 rounded-full bg-muted mt-0.5 group-hover:bg-primary/10 transition-colors">
                      {getStatusIcon(item.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-foreground leading-snug">{item.description}</p>
                      <p className="text-xs text-muted-foreground mt-1">
                        {format(new Date(item.createdAt), "dd 'de' MMM, HH:mm", { locale: ptBR })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center text-muted-foreground space-y-2">
                <Activity className="h-8 w-8 opacity-20" />
                <p>Nenhuma atividade recente.</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Top Customers */}
        <Card className="lg:col-span-7 shadow-sm">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Melhores Clientes</CardTitle>
              <CardDescription>Clientes com maior volume de compras.</CardDescription>
            </div>
            <Link href="/clientes" className="text-sm text-primary font-medium hover:underline flex items-center">
              Ver todos <ArrowUpRight className="h-4 w-4 ml-1" />
            </Link>
          </CardHeader>
          <CardContent>
            {isLoadingCustomers ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <Skeleton key={i} className="h-12 w-full" />
                ))}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm text-left">
                  <thead className="border-b text-muted-foreground font-medium">
                    <tr>
                      <th className="pb-3 pr-4 font-medium">Cliente</th>
                      <th className="pb-3 px-4 font-medium">Viagens</th>
                      <th className="pb-3 px-4 font-medium">Total Gasto</th>
                    </tr>
                  </thead>
                  <tbody>
                    {topCustomers?.map((customer) => (
                      <tr key={customer.id} className="border-b last:border-0 hover:bg-muted/50 transition-colors">
                        <td className="py-3 pr-4">
                          <Link href={`/clientes/${customer.id}`} className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-2">
                            <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                              {customer.name.charAt(0).toUpperCase()}
                            </div>
                            <span className="truncate max-w-[200px] block">{customer.name}</span>
                          </Link>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">
                          {customer.tripsCount}
                        </td>
                        <td className="py-3 px-4 font-medium">
                          {formatCurrency(customer.totalSpent)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}