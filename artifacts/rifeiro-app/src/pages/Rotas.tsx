import { useState } from "react";
import {
  useListRotas,
  useCreateRota,
  useUpdateRota,
  useDeleteRota,
  getListRotasQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Plus, MapPin, Users, Eye, Pencil, Trash2, Navigation } from "lucide-react";

type RotaStatus = "planejada" | "em_andamento" | "concluida" | "cancelada";

const statusLabels: Record<RotaStatus, string> = {
  planejada: "Planejada",
  em_andamento: "Em andamento",
  concluida: "Concluida",
  cancelada: "Cancelada",
};

const statusVariants: Record<RotaStatus, string> = {
  planejada: "bg-blue-100 text-blue-800",
  em_andamento: "bg-amber-100 text-amber-800",
  concluida: "bg-green-100 text-green-800",
  cancelada: "bg-red-100 text-red-800",
};

const CORES_PREDEFINIDAS = [
  "#3b82f6",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
  "#06b6d4",
  "#84cc16",
  "#f97316",
  "#6366f1",
];

const defaultForm = {
  nome: "",
  descricao: "",
  cor: "#3b82f6",
  status: "planejada" as RotaStatus,
};

export default function Rotas() {
  const queryClient = useQueryClient();
  const { data: rotas, isLoading } = useListRotas();
  const createRota = useCreateRota();
  const updateRota = useUpdateRota();
  const deleteRota = useDeleteRota();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (rota: { id: number; nome: string; descricao?: string | null; cor: string; status: string }) => {
    setEditingId(rota.id);
    setForm({
      nome: rota.nome,
      descricao: rota.descricao || "",
      cor: rota.cor,
      status: rota.status as RotaStatus,
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.nome) return;

    if (editingId !== null) {
      updateRota.mutate(
        { id: editingId, data: { nome: form.nome, descricao: form.descricao || undefined, cor: form.cor, status: form.status } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListRotasQueryKey() });
            setDialogOpen(false);
          },
        }
      );
    } else {
      createRota.mutate(
        { data: { nome: form.nome, descricao: form.descricao || undefined, cor: form.cor, status: form.status } },
        {
          onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: getListRotasQueryKey() });
            setDialogOpen(false);
            setForm(defaultForm);
          },
        }
      );
    }
  };

  const handleDelete = () => {
    if (deleteId === null) return;
    deleteRota.mutate(
      { id: deleteId },
      {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListRotasQueryKey() });
          setDeleteId(null);
        },
      }
    );
  };

  const totaisPorStatus = rotas
    ? {
        planejada: rotas.filter((r) => r.status === "planejada").length,
        em_andamento: rotas.filter((r) => r.status === "em_andamento").length,
        concluida: rotas.filter((r) => r.status === "concluida").length,
        cancelada: rotas.filter((r) => r.status === "cancelada").length,
      }
    : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Rotas</h1>
          <p className="text-muted-foreground">Organize suas rotas de venda porta a porta</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Nova Rota
        </Button>
      </div>

      {totaisPorStatus && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {(["planejada", "em_andamento", "concluida", "cancelada"] as RotaStatus[]).map((status) => (
            <Card key={status}>
              <CardContent className="p-4 text-center">
                <p className="text-2xl font-bold text-foreground">{totaisPorStatus[status]}</p>
                <p className="text-xs text-muted-foreground mt-1">{statusLabels[status]}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : rotas && rotas.length > 0 ? (
        <div className="space-y-3">
          {rotas.map((rota) => (
            <Card key={rota.id} className="overflow-hidden">
              <CardContent className="p-0 flex">
                <div
                  className="w-1.5 shrink-0"
                  style={{ backgroundColor: rota.cor }}
                />
                <div className="flex-1 p-4 flex items-center justify-between gap-4">
                  <div className="flex items-center gap-4">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
                      style={{ backgroundColor: rota.cor + "20" }}
                    >
                      <Navigation className="w-5 h-5" style={{ color: rota.cor }} />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-foreground">{rota.nome}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusVariants[rota.status as RotaStatus]}`}>
                          {statusLabels[rota.status as RotaStatus]}
                        </span>
                      </div>
                      {rota.descricao && (
                        <p className="text-sm text-muted-foreground mt-0.5">{rota.descricao}</p>
                      )}
                      <div className="flex items-center gap-4 mt-1">
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <MapPin className="w-3 h-3" />
                          {rota.totalParadas ?? 0} parada{(rota.totalParadas ?? 0) !== 1 ? "s" : ""}
                        </span>
                        <span className="text-xs text-muted-foreground flex items-center gap-1">
                          <Users className="w-3 h-3" />
                          {rota.totalClientes ?? 0} cliente{(rota.totalClientes ?? 0) !== 1 ? "s" : ""}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <Link href={`/rotas/${rota.id}`}>
                      <Button variant="ghost" size="icon" title="Ver rota">
                        <Eye className="w-4 h-4" />
                      </Button>
                    </Link>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Editar rota"
                      onClick={() => openEdit(rota)}
                    >
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      title="Excluir rota"
                      className="text-destructive"
                      onClick={() => setDeleteId(rota.id)}
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <Navigation className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground font-medium">Nenhuma rota cadastrada</p>
            <p className="text-sm text-muted-foreground mt-1">
              Crie sua primeira rota para organizar suas visitas
            </p>
            <Button className="mt-4 gap-2" onClick={openCreate}>
              <Plus className="w-4 h-4" /> Criar primeira rota
            </Button>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Rota" : "Nova Rota"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome da Rota *</Label>
              <Input
                value={form.nome}
                onChange={(e) => setForm({ ...form, nome: e.target.value })}
                placeholder="Ex: Rota Centro - Bairro Norte"
              />
            </div>
            <div>
              <Label>Descricao</Label>
              <Textarea
                value={form.descricao}
                onChange={(e) => setForm({ ...form, descricao: e.target.value })}
                placeholder="Detalhes sobre esta rota..."
                rows={2}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select value={form.status} onValueChange={(v) => setForm({ ...form, status: v as RotaStatus })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="planejada">Planejada</SelectItem>
                  <SelectItem value="em_andamento">Em andamento</SelectItem>
                  <SelectItem value="concluida">Concluida</SelectItem>
                  <SelectItem value="cancelada">Cancelada</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Cor da Rota</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {CORES_PREDEFINIDAS.map((cor) => (
                  <button
                    key={cor}
                    type="button"
                    className={`w-8 h-8 rounded-full border-2 transition-all ${
                      form.cor === cor ? "border-foreground scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: cor }}
                    onClick={() => setForm({ ...form, cor })}
                  />
                ))}
                <input
                  type="color"
                  value={form.cor}
                  onChange={(e) => setForm({ ...form, cor: e.target.value })}
                  className="w-8 h-8 rounded-full cursor-pointer border border-border"
                  title="Cor personalizada"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.nome || createRota.isPending || updateRota.isPending}
            >
              {createRota.isPending || updateRota.isPending ? "Salvando..." : editingId ? "Salvar" : "Criar Rota"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteId !== null} onOpenChange={(open) => !open && setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir Rota</AlertDialogTitle>
            <AlertDialogDescription>
              Esta acao ira excluir a rota e todas as suas paradas. Os clientes vinculados a esta rota nao serao excluidos, apenas o vinculo sera removido. Esta acao nao pode ser desfeita.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
