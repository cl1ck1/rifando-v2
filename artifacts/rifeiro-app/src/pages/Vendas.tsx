import { useState } from "react";
import { useListVendas, useCreateVenda, useDeleteVenda, useListClientes, useListProdutos, getListVendasQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Trash2, Eye, ShoppingBag } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const statusColors: Record<string, string> = {
  pendente: "bg-amber-100 text-amber-800",
  parcial: "bg-blue-100 text-blue-800",
  quitada: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
};

interface CartItem {
  produtoId: number;
  produtoNome: string;
  quantidade: number;
  precoUnitario: number;
}

export default function Vendas() {
  const queryClient = useQueryClient();
  const { data: vendas, isLoading } = useListVendas();
  const { data: clientes } = useListClientes();
  const { data: produtos } = useListProdutos();
  const createVenda = useCreateVenda();
  const deleteVenda = useDeleteVenda();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [clienteId, setClienteId] = useState("");
  const [formaPagamento, setFormaPagamento] = useState("parcelado");
  const [numeroParcelas, setNumeroParcelas] = useState("3");
  const [desconto, setDesconto] = useState("0");
  const [observacoes, setObservacoes] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [selectedProduto, setSelectedProduto] = useState("");
  const [quantidade, setQuantidade] = useState("1");
  const [statusFilter, setStatusFilter] = useState("todos");

  const addToCart = () => {
    if (!selectedProduto) return;
    const prod = produtos?.find((p) => p.id === parseInt(selectedProduto, 10));
    if (!prod) return;

    const existing = cart.find((c) => c.produtoId === prod.id);
    if (existing) {
      setCart(cart.map((c) => c.produtoId === prod.id ? { ...c, quantidade: c.quantidade + parseInt(quantidade, 10) } : c));
    } else {
      setCart([...cart, {
        produtoId: prod.id,
        produtoNome: prod.nome,
        quantidade: parseInt(quantidade, 10),
        precoUnitario: prod.precoVenda,
      }]);
    }
    setSelectedProduto("");
    setQuantidade("1");
  };

  const removeFromCart = (produtoId: number) => {
    setCart(cart.filter((c) => c.produtoId !== produtoId));
  };

  const subtotal = cart.reduce((acc, item) => acc + item.precoUnitario * item.quantidade, 0);
  const total = subtotal - parseFloat(desconto || "0");

  const handleSubmit = () => {
    if (!clienteId || cart.length === 0) return;
    createVenda.mutate({ data: {
      clienteId: parseInt(clienteId, 10),
      itens: cart.map((c) => ({ produtoId: c.produtoId, quantidade: c.quantidade, precoUnitario: c.precoUnitario })),
      desconto: parseFloat(desconto || "0"),
      formaPagamento: formaPagamento as "avista" | "parcelado",
      numeroParcelas: formaPagamento === "avista" ? 1 : parseInt(numeroParcelas, 10),
      observacoes,
    }}, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListVendasQueryKey() });
        setDialogOpen(false);
        resetForm();
      },
    });
  };

  const resetForm = () => {
    setClienteId("");
    setFormaPagamento("parcelado");
    setNumeroParcelas("3");
    setDesconto("0");
    setObservacoes("");
    setCart([]);
  };

  const handleDelete = (id: number) => {
    deleteVenda.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListVendasQueryKey() }),
    });
  };

  const filteredVendas = vendas?.filter((v) => statusFilter === "todos" || v.status === statusFilter);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Vendas</h1>
          <p className="text-muted-foreground">Gerencie suas vendas e pedidos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Nova Venda</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nova Venda</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Cliente</Label>
                <Select value={clienteId} onValueChange={setClienteId}>
                  <SelectTrigger><SelectValue placeholder="Selecione um cliente" /></SelectTrigger>
                  <SelectContent>
                    {clientes?.map((c) => (
                      <SelectItem key={c.id} value={String(c.id)}>{c.nome} - {c.telefone}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="border rounded-md p-3 space-y-3">
                <Label>Adicionar Produto</Label>
                <div className="flex gap-2">
                  <Select value={selectedProduto} onValueChange={setSelectedProduto}>
                    <SelectTrigger className="flex-1"><SelectValue placeholder="Produto" /></SelectTrigger>
                    <SelectContent>
                      {produtos?.filter((p) => p.ativo).map((p) => (
                        <SelectItem key={p.id} value={String(p.id)}>{p.nome} - {formatCurrency(p.precoVenda)}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input type="number" min="1" value={quantidade} onChange={(e) => setQuantidade(e.target.value)} className="w-20" placeholder="Qtd" />
                  <Button type="button" variant="outline" onClick={addToCart}>+</Button>
                </div>

                {cart.length > 0 && (
                  <div className="space-y-2">
                    {cart.map((item) => (
                      <div key={item.produtoId} className="flex items-center justify-between text-sm border-b pb-2">
                        <div>
                          <span className="font-medium">{item.produtoNome}</span>
                          <span className="text-muted-foreground ml-2">{item.quantidade}x {formatCurrency(item.precoUnitario)}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{formatCurrency(item.precoUnitario * item.quantidade)}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(item.produtoId)}>
                            <Trash2 className="w-3 h-3 text-destructive" />
                          </Button>
                        </div>
                      </div>
                    ))}
                    <div className="text-right font-semibold text-sm">
                      Subtotal: {formatCurrency(subtotal)}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Forma de Pagamento</Label>
                  <Select value={formaPagamento} onValueChange={setFormaPagamento}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="parcelado">Parcelado</SelectItem>
                      <SelectItem value="avista">A Vista</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {formaPagamento === "parcelado" && (
                  <div>
                    <Label>N. Parcelas</Label>
                    <Input type="number" min="1" max="24" value={numeroParcelas} onChange={(e) => setNumeroParcelas(e.target.value)} />
                  </div>
                )}
              </div>

              <div>
                <Label>Desconto (R$)</Label>
                <Input type="number" min="0" step="0.01" value={desconto} onChange={(e) => setDesconto(e.target.value)} />
              </div>

              <div>
                <Label>Observacoes</Label>
                <Input value={observacoes} onChange={(e) => setObservacoes(e.target.value)} placeholder="Observacoes sobre a venda..." />
              </div>

              <div className="text-right text-lg font-bold">
                Total: {formatCurrency(total)}
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={!clienteId || cart.length === 0 || createVenda.isPending}>
                {createVenda.isPending ? "Salvando..." : "Registrar Venda"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex gap-2">
        {["todos", "pendente", "parcial", "quitada", "cancelada"].map((s) => (
          <Button key={s} variant={statusFilter === s ? "default" : "outline"} size="sm" onClick={() => setStatusFilter(s)} className="capitalize">
            {s}
          </Button>
        ))}
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : filteredVendas && filteredVendas.length > 0 ? (
        <div className="space-y-3">
          {filteredVendas.map((v) => (
            <Card key={v.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <ShoppingBag className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{v.clienteNome}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(v.createdAt).toLocaleDateString("pt-BR")} - {v.numeroParcelas}x {formatCurrency(v.valorFinal / v.numeroParcelas)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="font-semibold text-foreground">{formatCurrency(v.valorFinal)}</p>
                    <Badge className={statusColors[v.status]}>{v.status}</Badge>
                  </div>
                  <Link href={`/vendas/${v.id}`}>
                    <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(v.id)} className="text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <ShoppingBag className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhuma venda encontrada</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
