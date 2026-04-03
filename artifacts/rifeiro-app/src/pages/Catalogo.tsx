import { useState } from "react";
import { useListProdutos, useCreateProduto, useUpdateProduto, useDeleteProduto, useListCategorias, useCreateCategoria, getListProdutosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Package, Trash2, Edit } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function Catalogo() {
  const queryClient = useQueryClient();
  const { data: produtos, isLoading } = useListProdutos();
  const { data: categorias } = useListCategorias();
  const createProduto = useCreateProduto();
  const deleteProduto = useDeleteProduto();
  const createCategoria = useCreateCategoria();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [newCategoria, setNewCategoria] = useState("");
  const [form, setForm] = useState({
    nome: "", descricao: "", precoCusto: "", precoVenda: "",
    categoriaId: "", estoque: "0", imagemUrl: "",
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = () => {
    if (!form.nome || !form.precoVenda) return;
    createProduto.mutate({ data: {
      nome: form.nome,
      descricao: form.descricao || undefined,
      precoCusto: form.precoCusto ? parseFloat(form.precoCusto) : undefined,
      precoVenda: parseFloat(form.precoVenda),
      categoriaId: form.categoriaId ? parseInt(form.categoriaId, 10) : undefined,
      estoque: parseInt(form.estoque, 10),
      imagemUrl: form.imagemUrl || undefined,
    }}, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListProdutosQueryKey() });
        setDialogOpen(false);
        setForm({ nome: "", descricao: "", precoCusto: "", precoVenda: "", categoriaId: "", estoque: "0", imagemUrl: "" });
      },
    });
  };

  const handleDelete = (id: number) => {
    deleteProduto.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProdutosQueryKey() }),
    });
  };

  const handleAddCategoria = () => {
    if (!newCategoria) return;
    createCategoria.mutate({ data: { nome: newCategoria } }, {
      onSuccess: () => {
        setNewCategoria("");
        queryClient.invalidateQueries({ queryKey: ["listCategorias"] });
      },
    });
  };

  const margem = (custo: number | null, venda: number) => {
    if (!custo || custo === 0) return null;
    return ((venda - custo) / custo * 100).toFixed(0);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Produtos</h1>
          <p className="text-muted-foreground">Gerencie seu catalogo de produtos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Produto</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Produto</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={handleChange("nome")} placeholder="Nome do produto" />
              </div>
              <div>
                <Label>Descricao</Label>
                <Input value={form.descricao} onChange={handleChange("descricao")} placeholder="Descricao do produto" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Preco de Custo (R$)</Label>
                  <Input type="number" step="0.01" value={form.precoCusto} onChange={handleChange("precoCusto")} placeholder="0.00" />
                </div>
                <div>
                  <Label>Preco de Venda (R$) *</Label>
                  <Input type="number" step="0.01" value={form.precoVenda} onChange={handleChange("precoVenda")} placeholder="0.00" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Categoria</Label>
                  <Select value={form.categoriaId} onValueChange={(v) => setForm({ ...form, categoriaId: v })}>
                    <SelectTrigger><SelectValue placeholder="Selecionar" /></SelectTrigger>
                    <SelectContent>
                      {categorias?.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>{c.nome}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Estoque</Label>
                  <Input type="number" min="0" value={form.estoque} onChange={handleChange("estoque")} />
                </div>
              </div>
              <div>
                <Label>URL da Imagem</Label>
                <Input value={form.imagemUrl} onChange={handleChange("imagemUrl")} placeholder="https://..." />
              </div>
              <div className="border-t pt-4">
                <Label>Nova Categoria</Label>
                <div className="flex gap-2 mt-1">
                  <Input value={newCategoria} onChange={(e) => setNewCategoria(e.target.value)} placeholder="Nome da categoria" />
                  <Button type="button" variant="outline" onClick={handleAddCategoria}>Adicionar</Button>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={!form.nome || !form.precoVenda || createProduto.isPending}>
                {createProduto.isPending ? "Salvando..." : "Cadastrar Produto"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-40 w-full" />)}
        </div>
      ) : produtos && produtos.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {produtos.map((p) => {
            const m = margem(p.precoCusto, p.precoVenda);
            return (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-md bg-primary/10 flex items-center justify-center">
                        <Package className="w-5 h-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{p.nome}</p>
                        {p.categoriaNome && <Badge variant="outline" className="text-xs mt-1">{p.categoriaNome}</Badge>}
                      </div>
                    </div>
                    <Button variant="ghost" size="icon" onClick={() => handleDelete(p.id)} className="text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  {p.descricao && <p className="text-sm text-muted-foreground mb-3">{p.descricao}</p>}
                  <div className="flex items-center justify-between text-sm">
                    <div>
                      {p.precoCusto !== null && (
                        <p className="text-muted-foreground">Custo: {formatCurrency(p.precoCusto)}</p>
                      )}
                      <p className="font-semibold text-foreground text-lg">{formatCurrency(p.precoVenda)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-muted-foreground">Estoque: {p.estoque}</p>
                      {m && <p className="text-green-600 font-medium">+{m}% margem</p>}
                    </div>
                  </div>
                  {!p.ativo && <Badge variant="secondary" className="mt-2">Inativo</Badge>}
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Package className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhum produto cadastrado</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
