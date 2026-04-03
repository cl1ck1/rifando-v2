import { useGetClienteHistory } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Phone, MapPin, Mail } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const statusColors: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800",
  parcial: "bg-blue-100 text-blue-800",
  quitada: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
  paga: "bg-green-100 text-green-800",
  atrasada: "bg-red-100 text-red-800",
};

export default function ClienteDetail() {
  const [, params] = useRoute("/clientes/:id");
  const clienteId = parseInt(params?.id || "0", 10);
  const { data, isLoading } = useGetClienteHistory(clienteId);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Cliente nao encontrado</p>;
  }

  const { cliente, vendas, parcelas } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">{cliente.nome}</h1>
          <p className="text-muted-foreground">Detalhes do cliente</p>
        </div>
        <Badge variant={cliente.status === "ativo" ? "default" : "secondary"}>{cliente.status}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Informacoes de Contato</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center gap-2 text-sm">
              <Phone className="w-4 h-4 text-muted-foreground" />
              <span>{cliente.telefone}</span>
            </div>
            {cliente.email && (
              <div className="flex items-center gap-2 text-sm">
                <Mail className="w-4 h-4 text-muted-foreground" />
                <span>{cliente.email}</span>
              </div>
            )}
            {cliente.cpf && (
              <div className="text-sm">
                <span className="text-muted-foreground">CPF:</span> {cliente.cpf}
              </div>
            )}
            {(cliente.endereco || cliente.cidade) && (
              <div className="flex items-start gap-2 text-sm">
                <MapPin className="w-4 h-4 text-muted-foreground mt-0.5" />
                <div>
                  {cliente.endereco && <p>{cliente.endereco}</p>}
                  {cliente.bairro && <p>{cliente.bairro}</p>}
                  {cliente.cidade && <p>{cliente.cidade}/{cliente.estado}</p>}
                  {cliente.referencia && <p className="text-muted-foreground">Ref: {cliente.referencia}</p>}
                </div>
              </div>
            )}
            {cliente.observacoes && (
              <div className="text-sm">
                <span className="text-muted-foreground">Obs:</span> {cliente.observacoes}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo Financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total em Compras</span>
              <span className="font-semibold">{formatCurrency(cliente.totalCompras)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Total de Vendas</span>
              <span>{vendas.length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Parcelas Pendentes</span>
              <span>{parcelas.filter((p) => p.status === "pendente" || p.status === "atrasada").length}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Valor Pendente</span>
              <span className="font-semibold text-amber-600">
                {formatCurrency(
                  parcelas.filter((p) => p.status === "pendente" || p.status === "atrasada")
                    .reduce((acc, p) => acc + p.valor, 0)
                )}
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cliente desde</span>
              <span>{new Date(cliente.createdAt).toLocaleDateString("pt-BR")}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Historico de Vendas</CardTitle>
        </CardHeader>
        <CardContent>
          {vendas.length > 0 ? (
            <div className="space-y-3">
              {vendas.map((v) => (
                <Link key={v.id} href={`/vendas/${v.id}`} className="flex items-center justify-between py-3 border-b last:border-0 hover:bg-muted/50 px-2 rounded-md transition-colors">
                  <div>
                    <p className="text-sm font-medium">Venda #{v.id}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(v.createdAt).toLocaleDateString("pt-BR")} - {v.numeroParcelas}x
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{formatCurrency(v.valorFinal)}</span>
                    <Badge className={statusColors[v.status]}>{v.status}</Badge>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma venda ainda</p>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parcelas</CardTitle>
        </CardHeader>
        <CardContent>
          {parcelas.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-2 font-medium text-muted-foreground">Parcela</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Vencimento</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Valor</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                    <th className="text-left py-2 font-medium text-muted-foreground">Pagamento</th>
                  </tr>
                </thead>
                <tbody>
                  {parcelas.map((p) => (
                    <tr key={p.id} className="border-b last:border-0">
                      <td className="py-2">{p.numero}/{p.totalParcelas}</td>
                      <td className="py-2">{p.dataVencimento}</td>
                      <td className="py-2 font-medium">{formatCurrency(p.valor)}</td>
                      <td className="py-2"><Badge className={statusColors[p.status]}>{p.status}</Badge></td>
                      <td className="py-2 text-muted-foreground">{p.dataPagamento || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground text-center py-4">Nenhuma parcela</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
