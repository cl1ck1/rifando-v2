import { useListProdutos, useCreateProduto, useUpdateProduto, useDeleteProduto, getListProdutosQueryKey } from "@workspace/api-client-react";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { formatCurrency } from "@/lib/utils";
import { Plus, Package, Image as ImageIcon, Trash2, Edit } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

export default function Catalogo() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: produtos, isLoading } = useListProdutos();
  const createProduto = useCreateProduto();
  const updateProduto = useUpdateProduto();
  const deleteProduto = useDeleteProduto();

  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [nome, setNome] = useState("");
  const [preco, setPreco] = useState("");
  const [descricao, setDescricao] = useState("");

  const handleCreate = () => {
    if (!nome || !preco) {
      toast({ title: "Erro", description: "Nome e preço são obrigatórios.", variant: "destructive" });
      return;
    }

    createProduto.mutate({
      data: {
        nome,
        preco: parseFloat(preco),
        descricao,
        ativo: true
      }
    }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Produto adicionado ao catálogo." });
        setIsCreateOpen(false);
        setNome(""); setPreco(""); setDescricao("");
        queryClient.invalidateQueries({ queryKey: getListProdutosQueryKey() });
      }
    });
  };

  const handleToggleAtivo = (id: number, ativo: boolean) => {
    updateProduto.mutate({ id, data: { ativo } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProdutosQueryKey() })
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Excluir produto?")) return;
    deleteProduto.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListProdutosQueryKey() })
    });
  };

  const fmtCurrency = (val: number) => new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Catálogo</h1>
          <p className="text-muted-foreground mt-1">Produtos e serviços extras vendidos aos passageiros.</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" /> Adicionar Produto
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader><DialogTitle>Novo Produto</DialogTitle></DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label>Nome *</Label>
                <Input value={nome} onChange={e => setNome(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Preço (R$) *</Label>
                <Input type="number" step="0.01" value={preco} onChange={e => setPreco(e.target.value)} />
              </div>
              <div className="grid gap-2">
                <Label>Descrição</Label>
                <Input value={descricao} onChange={e => setDescricao(e.target.value)} />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={createProduto.isPending}>Salvar</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-40 w-full rounded-none" />
              <CardContent className="p-4 space-y-2">
                <Skeleton className="h-5 w-3/4" />
                <Skeleton className="h-6 w-1/2" />
              </CardContent>
            </Card>
          ))
        ) : produtos?.length === 0 ? (
          <div className="col-span-full py-12 text-center text-muted-foreground border rounded-lg bg-card border-dashed">
            <Package className="h-12 w-12 mx-auto mb-4 opacity-20" />
            <p>Seu catálogo está vazio.</p>
          </div>
        ) : (
          produtos?.map((prod) => (
            <Card key={prod.id} className={`overflow-hidden hover-elevate transition-all ${!prod.ativo ? 'opacity-60 grayscale' : ''}`}>
              <div className="h-40 bg-muted flex items-center justify-center relative border-b">
                {prod.imagemUrl ? (
                  <img src={prod.imagemUrl} alt={prod.nome} className="w-full h-full object-cover" />
                ) : (
                  <ImageIcon className="h-10 w-10 text-muted-foreground opacity-30" />
                )}
                <div className="absolute top-2 right-2 bg-background/80 backdrop-blur-sm px-2 py-1 rounded-md flex items-center gap-2">
                  <span className="text-xs font-medium">{prod.ativo ? 'Ativo' : 'Inativo'}</span>
                  <Switch checked={prod.ativo} onCheckedChange={(v) => handleToggleAtivo(prod.id, v)} />
                </div>
              </div>
              <CardContent className="p-4">
                <h3 className="font-semibold text-lg truncate" title={prod.nome}>{prod.nome}</h3>
                <p className="text-xl font-bold text-primary mt-1">{fmtCurrency(prod.preco)}</p>
                <div className="flex justify-end gap-2 mt-4 pt-4 border-t">
                  <Button variant="ghost" size="sm" className="text-destructive hover:bg-destructive/10" onClick={() => handleDelete(prod.id)}>
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}