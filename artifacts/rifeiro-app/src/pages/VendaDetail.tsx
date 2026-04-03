import { useGetVenda, useUpdateParcela, getGetVendaQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, CheckCircle } from "lucide-react";

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

export default function VendaDetail() {
  const [, params] = useRoute("/vendas/:id");
  const vendaId = parseInt(params?.id || "0", 10);
  const queryClient = useQueryClient();

  const { data, isLoading } = useGetVenda(vendaId);
  const updateParcela = useUpdateParcela();

  const handleMarcarPaga = (parcelaId: number) => {
    const today = new Date().toISOString().split("T")[0];
    updateParcela.mutate({
      id: parcelaId,
      data: { status: "paga", dataPagamento: today, metodoPagamento: "dinheiro" },
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getGetVendaQueryKey(vendaId) }),
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!data) {
    return <p className="text-muted-foreground">Venda nao encontrada</p>;
  }

  const { venda, itens, parcelas } = data;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/vendas">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div>
          <h1 className="text-2xl font-bold text-foreground">Venda #{venda.id}</h1>
          <p className="text-muted-foreground">{venda.clienteNome} - {new Date(venda.createdAt).toLocaleDateString("pt-BR")}</p>
        </div>
        <Badge className={statusColors[venda.status]}>{venda.status}</Badge>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Resumo da Venda</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Cliente</span>
              <Link href={`/clientes/${venda.clienteId}`} className="text-primary hover:underline">{venda.clienteNome}</Link>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(venda.valorTotal)}</span>
            </div>
            {venda.desconto > 0 && (
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Desconto</span>
                <span className="text-green-600">-{formatCurrency(venda.desconto)}</span>
              </div>
            )}
            <div className="flex justify-between text-sm font-bold border-t pt-2">
              <span>Total</span>
              <span>{formatCurrency(venda.valorFinal)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Pagamento</span>
              <span>{venda.formaPagamento === "avista" ? "A Vista" : `${venda.numeroParcelas}x parcelado`}</span>
            </div>
            {venda.observacoes && (
              <div className="text-sm">
                <span className="text-muted-foreground">Obs:</span> {venda.observacoes}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-base">Itens da Venda</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {itens.map((item) => (
                <div key={item.id} className="flex items-center justify-between text-sm py-2 border-b last:border-0">
                  <div>
                    <span className="font-medium">{item.produtoNome}</span>
                    <span className="text-muted-foreground ml-2">{item.quantidade}x {formatCurrency(item.precoUnitario)}</span>
                  </div>
                  <span className="font-medium">{formatCurrency(item.subtotal)}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Parcelas</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-2 font-medium text-muted-foreground">Parcela</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Vencimento</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Valor</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Status</th>
                  <th className="text-left py-2 font-medium text-muted-foreground">Pagamento</th>
                  <th className="text-right py-2 font-medium text-muted-foreground">Acao</th>
                </tr>
              </thead>
              <tbody>
                {parcelas.map((p) => (
                  <tr key={p.id} className="border-b last:border-0">
                    <td className="py-3">{p.numero}/{p.totalParcelas}</td>
                    <td className="py-3">{p.dataVencimento}</td>
                    <td className="py-3 font-medium">{formatCurrency(p.valor)}</td>
                    <td className="py-3">
                      <Badge className={statusColors[p.status]}>{p.status}</Badge>
                    </td>
                    <td className="py-3 text-muted-foreground">{p.dataPagamento || "-"}</td>
                    <td className="py-3 text-right">
                      {p.status !== "paga" && p.status !== "cancelada" && (
                        <Button
                          variant="outline"
                          size="sm"
                          className="gap-1"
                          onClick={() => handleMarcarPaga(p.id)}
                          disabled={updateParcela.isPending}
                        >
                          <CheckCircle className="w-3 h-3" /> Pagar
                        </Button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
