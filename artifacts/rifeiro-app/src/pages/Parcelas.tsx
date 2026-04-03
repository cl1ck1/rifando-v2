import { useState } from "react";
import { useListParcelas, useUpdateParcela, getListParcelasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CalendarCheck, CheckCircle, Phone } from "lucide-react";
import { Link } from "wouter";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const statusColors: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800",
  paga: "bg-green-100 text-green-800",
  atrasada: "bg-red-100 text-red-800",
  cancelada: "bg-gray-100 text-gray-800",
};

export default function Parcelas() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("todos");
  const { data: parcelas, isLoading } = useListParcelas(
    statusFilter !== "todos" ? { status: statusFilter as "pendente" | "paga" | "atrasada" | "cancelada" } : {}
  );
  const updateParcela = useUpdateParcela();

  const handleMarcarPaga = (id: number, metodo: string) => {
    const today = new Date().toISOString().split("T")[0];
    updateParcela.mutate({
      id,
      data: { status: "paga", dataPagamento: today, metodoPagamento: metodo as "pix" | "dinheiro" | "cartao" | "promissoria" },
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListParcelasQueryKey() }),
    });
  };

  const totalPendente = parcelas?.filter((p) => p.status === "pendente" || p.status === "atrasada")
    .reduce((acc, p) => acc + p.valor, 0) || 0;
  const totalRecebido = parcelas?.filter((p) => p.status === "paga")
    .reduce((acc, p) => acc + p.valor, 0) || 0;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Parcelas</h1>
        <p className="text-muted-foreground">Controle de cobrancas e recebimentos</p>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total de Parcelas</p>
            <p className="text-lg font-bold">{parcelas?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Pendente</p>
            <p className="text-lg font-bold text-amber-600">{formatCurrency(totalPendente)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Recebido</p>
            <p className="text-lg font-bold text-green-600">{formatCurrency(totalRecebido)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Atrasadas</p>
            <p className="text-lg font-bold text-red-600">{parcelas?.filter((p) => p.status === "atrasada").length || 0}</p>
          </CardContent>
        </Card>
      </div>

      <div className="flex gap-2">
        {["todos", "pendente", "paga", "atrasada", "cancelada"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
            {s}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : parcelas && parcelas.length > 0 ? (
        <div className="space-y-3">
          {parcelas.map((p) => (
            <Card key={p.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <CalendarCheck className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <Link href={`/clientes/${p.clienteId}`} className="font-medium text-foreground hover:text-primary">
                      {p.clienteNome}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      Parcela {p.numero}/{p.totalParcelas} - Venc. {p.dataVencimento}
                    </p>
                    {p.clienteTelefone && (
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Phone className="w-3 h-3" /> {p.clienteTelefone}
                      </div>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(p.valor)}</p>
                    <Badge className={statusColors[p.status]}>{p.status}</Badge>
                    {p.dataPagamento && <p className="text-xs text-muted-foreground mt-1">Pago em {p.dataPagamento}</p>}
                  </div>
                  {(p.status === "pendente" || p.status === "atrasada") && (
                    <Select onValueChange={(metodo) => handleMarcarPaga(p.id, metodo)}>
                      <SelectTrigger className="w-auto gap-1">
                        <CheckCircle className="w-3 h-3" />
                        <SelectValue placeholder="Receber" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pix">Pix</SelectItem>
                        <SelectItem value="dinheiro">Dinheiro</SelectItem>
                        <SelectItem value="cartao">Cartao</SelectItem>
                        <SelectItem value="promissoria">Promissoria</SelectItem>
                      </SelectContent>
                    </Select>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CalendarCheck className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhuma parcela encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
