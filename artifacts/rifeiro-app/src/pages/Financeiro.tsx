import { useState } from "react";
import { useListPagamentos, useCreatePagamento, useUpdatePagamento, getListPagamentosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CreditCard, Search, Filter, Plus, FileText, CheckCircle2, Clock, XCircle, AlertCircle } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

export default function Financeiro() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form
  const [valor, setValor] = useState("");
  const [metodo, setMetodo] = useState<any>("pix");
  const [dataVencimento, setDataVencimento] = useState("");

  const queryParams = statusFilter !== "all" ? { status: statusFilter as any } : undefined;
  const { data: pagamentos, isLoading } = useListPagamentos(queryParams);
  const createPagamento = useCreatePagamento();
  const updatePagamento = useUpdatePagamento();

  const handleCreate = () => {
    if (!valor || !dataVencimento || !metodo) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    createPagamento.mutate({
      data: {
        valor: parseFloat(valor),
        metodo,
        dataVencimento: new Date(dataVencimento).toISOString(),
        status: "pendente"
      }
    }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Pagamento registrado." });
        setIsCreateOpen(false);
        setValor(""); setDataVencimento("");
        queryClient.invalidateQueries({ queryKey: getListPagamentosQueryKey() });
      }
    });
  };

  const handleUpdateStatus = (id: number, status: any) => {
    updatePagamento.mutate({
      id,
      data: { status, dataPagamento: status === 'pago' ? new Date().toISOString() : undefined }
    }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Status do pagamento atualizado." });
        queryClient.invalidateQueries({ queryKey: getListPagamentosQueryKey() });
      }
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pago': return { color: "bg-green-500/10 text-green-600 border-green-200", icon: CheckCircle2, label: "Pago" };
      case 'pendente': return { color: "bg-yellow-500/10 text-yellow-600 border-yellow-200", icon: Clock, label: "Pendente" };
      case 'atrasado': return { color: "bg-red-500/10 text-red-600 border-red-200", icon: AlertCircle, label: "Atrasado" };
      case 'cancelado': return { color: "bg-muted text-muted-foreground border-border", icon: XCircle, label: "Cancelado" };
      default: return { color: "bg-muted text-muted-foreground", icon: FileText, label: status };
    }
  };

  const getMethodBadge = (metodo: string) => {
    switch (metodo) {
      case 'pix': return <Badge variant="outline" className="border-teal-200 text-teal-700 bg-teal-50">PIX</Badge>;
      case 'cartao': return <Badge variant="outline" className="border-blue-200 text-blue-700 bg-blue-50">Cartão</Badge>;
      case 'promissoria': return <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50">Promissória</Badge>;
      default: return <Badge variant="outline">{metodo}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Financeiro</h1>
          <p className="text-muted-foreground mt-1">Controle de recebimentos e inadimplência.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Novo Recebimento
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[400px]">
            <DialogHeader>
              <DialogTitle>Registrar Pagamento</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Valor (R$) *</Label>
                <Input type="number" step="0.01" value={valor} onChange={e => setValor(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Método *</Label>
                <Select value={metodo} onValueChange={setMetodo}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="pix">PIX</SelectItem>
                    <SelectItem value="cartao">Cartão de Crédito</SelectItem>
                    <SelectItem value="promissoria">Promissória</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <Label>Data de Vencimento *</Label>
                <Input type="date" value={dataVencimento} onChange={e => setDataVencimento(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={createPagamento.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="pendente">Pendentes</SelectItem>
              <SelectItem value="pago">Pagos</SelectItem>
              <SelectItem value="atrasado">Atrasados</SelectItem>
              <SelectItem value="cancelado">Cancelados</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
              <tr>
                <th className="py-3 px-4 font-medium">Cliente / Viagem</th>
                <th className="py-3 px-4 font-medium">Valor</th>
                <th className="py-3 px-4 font-medium">Vencimento</th>
                <th className="py-3 px-4 font-medium">Método</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 text-right">Ação</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 px-4"><Skeleton className="h-10 w-[200px]" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-[80px]" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-[100px]" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-6 w-[80px] rounded-full" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-6 w-[80px] rounded-full" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-8 w-24 rounded-md ml-auto" /></td>
                  </tr>
                ))
              ) : pagamentos?.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-muted-foreground">
                    <CreditCard className="h-10 w-10 opacity-20 mx-auto mb-3" />
                    <p>Nenhum pagamento encontrado.</p>
                  </td>
                </tr>
              ) : (
                pagamentos?.map((pagamento) => {
                  const conf = getStatusConfig(pagamento.status);
                  const Icon = conf.icon;
                  
                  return (
                    <tr key={pagamento.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors">
                      <td className="py-3 px-4">
                        <div className="font-medium">{pagamento.clienteNome || 'Cliente não informado'}</div>
                        <div className="text-xs text-muted-foreground truncate max-w-[250px]">{pagamento.viagemDestino || 'Viagem não informada'}</div>
                      </td>
                      <td className="py-3 px-4 font-bold">
                        {formatCurrency(pagamento.valor)}
                        {pagamento.parcela && <div className="text-xs font-normal text-muted-foreground">Parc. {pagamento.parcela}/{pagamento.totalParcelas}</div>}
                      </td>
                      <td className="py-3 px-4 text-muted-foreground">
                        {format(new Date(pagamento.dataVencimento), "dd/MM/yyyy", { locale: ptBR })}
                      </td>
                      <td className="py-3 px-4">
                        {getMethodBadge(pagamento.metodo)}
                      </td>
                      <td className="py-3 px-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${conf.color}`}>
                          <Icon className="h-3.5 w-3.5" />
                          {conf.label}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        {pagamento.status !== 'pago' && pagamento.status !== 'cancelado' ? (
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button size="sm" variant="outline">Ações</Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => handleUpdateStatus(pagamento.id, 'pago')} className="text-green-600 focus:text-green-600">
                                Marcar como Pago
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleUpdateStatus(pagamento.id, 'cancelado')}>
                                Cancelar Cobrança
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        ) : (
                          <Button size="sm" variant="ghost" disabled>Finalizado</Button>
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}