import { useState } from "react";
import {
  useListClientes,
  useCreateCliente,
  useDeleteCliente,
  useUpdateCliente,
  useListRotas,
  useListRotaParadas,
  getListClientesQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, Search, Eye, Trash2, Tag, MapPin, Filter } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

const defaultForm = {
  nome: "", telefone: "", email: "", cpf: "",
  endereco: "", bairro: "", cidade: "", estado: "",
  referencia: "", observacoes: "",
  tagLocalizacao: "", rotaId: "", rotaParadaId: "",
};

function ParadasSelector({ rotaId, value, onChange }: { rotaId: number; value: string; onChange: (id: string) => void }) {
  const { data: paradas, isLoading } = useListRotaParadas(rotaId);

  if (isLoading) return <Skeleton className="h-10 w-full" />;

  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger>
        <SelectValue placeholder="Selecione a parada..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="nenhuma">Nenhuma parada especifica</SelectItem>
        {paradas?.map((p) => (
          <SelectItem key={p.id} value={String(p.id)}>
            {p.ordem}. {p.nome} {p.estado ? `- ${p.estado}` : ""}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export default function Clientes() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const [filtroRotaId, setFiltroRotaId] = useState("");
  const [filtroTag, setFiltroTag] = useState("");
  const [filtroRotaParadaId, setFiltroRotaParadaId] = useState<number | undefined>();

  const { data: clientes, isLoading } = useListClientes({
    search: search || undefined,
    rotaParadaId: filtroRotaParadaId,
    tagLocalizacao: filtroTag || undefined,
  } as Parameters<typeof useListClientes>[0]);

  const { data: rotas } = useListRotas();
  const createCliente = useCreateCliente();
  const updateCliente = useUpdateCliente();
  const deleteCliente = useDeleteCliente();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState(defaultForm);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(defaultForm);
    setDialogOpen(true);
  };

  const openEdit = (c: typeof clientes extends (infer T)[] | undefined ? T : never) => {
    if (!c) return;
    setEditingId((c as { id: number }).id);
    setForm({
      nome: (c as { nome: string }).nome,
      telefone: (c as { telefone: string }).telefone,
      email: (c as { email?: string | null }).email || "",
      cpf: (c as { cpf?: string | null }).cpf || "",
      endereco: (c as { endereco?: string | null }).endereco || "",
      bairro: (c as { bairro?: string | null }).bairro || "",
      cidade: (c as { cidade?: string | null }).cidade || "",
      estado: (c as { estado?: string | null }).estado || "",
      referencia: (c as { referencia?: string | null }).referencia || "",
      observacoes: (c as { observacoes?: string | null }).observacoes || "",
      tagLocalizacao: (c as { tagLocalizacao?: string | null }).tagLocalizacao || "",
      rotaId: "",
      rotaParadaId: (c as { rotaParadaId?: number | null }).rotaParadaId ? String((c as { rotaParadaId?: number | null }).rotaParadaId) : "",
    });
    setDialogOpen(true);
  };

  const handleSubmit = () => {
    if (!form.nome || !form.telefone) return;

    const paradaId = form.rotaParadaId && form.rotaParadaId !== "nenhuma"
      ? parseInt(form.rotaParadaId, 10)
      : undefined;

    const payload = {
      nome: form.nome,
      telefone: form.telefone,
      email: form.email || undefined,
      cpf: form.cpf || undefined,
      endereco: form.endereco || undefined,
      bairro: form.bairro || undefined,
      cidade: form.cidade || undefined,
      estado: form.estado || undefined,
      referencia: form.referencia || undefined,
      observacoes: form.observacoes || undefined,
      tagLocalizacao: form.tagLocalizacao || undefined,
      rotaParadaId: paradaId,
    } as Parameters<typeof createCliente.mutate>[0]["data"];

    if (editingId !== null) {
      updateCliente.mutate({ id: editingId, data: payload as Parameters<typeof updateCliente.mutate>[0]["data"] }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientesQueryKey() });
          setDialogOpen(false);
        },
      });
    } else {
      createCliente.mutate({ data: payload }, {
        onSuccess: () => {
          queryClient.invalidateQueries({ queryKey: getListClientesQueryKey() });
          setDialogOpen(false);
          setForm(defaultForm);
        },
      });
    }
  };

  const handleDelete = (id: number) => {
    deleteCliente.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListClientesQueryKey() }),
    });
  };

  const temFiltro = filtroRotaId || filtroTag || filtroRotaParadaId;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e contatos</p>
        </div>
        <Button className="gap-2" onClick={openCreate}>
          <Plus className="w-4 h-4" /> Novo Cliente
        </Button>
      </div>

      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Buscar por nome ou telefone..."
            className="pl-9"
          />
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
          <Input
            value={filtroTag}
            onChange={(e) => setFiltroTag(e.target.value)}
            placeholder="Filtrar por TAG..."
            className="w-40"
          />
          <Select
            value={filtroRotaId}
            onValueChange={(v) => {
              setFiltroRotaId(v);
              setFiltroRotaParadaId(undefined);
            }}
          >
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Filtrar por rota..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todas">Todas as rotas</SelectItem>
              {rotas?.map((r) => (
                <SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {filtroRotaId && filtroRotaId !== "todas" && (
            <div className="w-48">
              <ParadasSelector
                rotaId={parseInt(filtroRotaId, 10)}
                value={filtroRotaParadaId ? String(filtroRotaParadaId) : ""}
                onChange={(v) => setFiltroRotaParadaId(v && v !== "nenhuma" ? parseInt(v, 10) : undefined)}
              />
            </div>
          )}
          {temFiltro && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => { setFiltroRotaId(""); setFiltroTag(""); setFiltroRotaParadaId(undefined); }}
            >
              Limpar filtros
            </Button>
          )}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-20 w-full" />)}
        </div>
      ) : clientes && clientes.length > 0 ? (
        <div className="space-y-3">
          {clientes.map((c) => (
            <Card key={c.id}>
              <CardContent className="p-4 flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="w-5 h-5 text-primary" />
                  </div>
                  <div>
                    <p className="font-medium text-foreground">{c.nome}</p>
                    <p className="text-sm text-muted-foreground">
                      {c.telefone} {c.cidade ? `- ${c.cidade}/${c.estado}` : ""}
                    </p>
                    {(c as { tagLocalizacao?: string | null }).tagLocalizacao && (
                      <span className="inline-flex items-center gap-1 text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full mt-1">
                        <Tag className="w-3 h-3" />
                        {(c as { tagLocalizacao?: string | null }).tagLocalizacao}
                      </span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(c.totalCompras)}</p>
                    <Badge variant={c.status === "ativo" ? "default" : "secondary"}>{c.status}</Badge>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => openEdit(c)} title="Editar">
                    <MapPin className="w-4 h-4" />
                  </Button>
                  <Link href={`/clientes/${c.id}`}>
                    <Button variant="ghost" size="icon"><Eye className="w-4 h-4" /></Button>
                  </Link>
                  <Button variant="ghost" size="icon" onClick={() => handleDelete(c.id)} className="text-destructive">
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
            <Users className="w-12 h-12 mx-auto text-muted-foreground/40 mb-4" />
            <p className="text-muted-foreground">Nenhum cliente encontrado</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? "Editar Cliente" : "Novo Cliente"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Nome *</Label>
                <Input value={form.nome} onChange={handleChange("nome")} placeholder="Nome completo" />
              </div>
              <div>
                <Label>Telefone *</Label>
                <Input value={form.telefone} onChange={handleChange("telefone")} placeholder="(99) 99999-9999" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Email</Label>
                <Input value={form.email} onChange={handleChange("email")} placeholder="email@exemplo.com" />
              </div>
              <div>
                <Label>CPF</Label>
                <Input value={form.cpf} onChange={handleChange("cpf")} placeholder="000.000.000-00" />
              </div>
            </div>
            <div>
              <Label>Endereco</Label>
              <Input value={form.endereco} onChange={handleChange("endereco")} placeholder="Rua, numero" />
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <Label>Bairro</Label>
                <Input value={form.bairro} onChange={handleChange("bairro")} />
              </div>
              <div>
                <Label>Cidade</Label>
                <Input value={form.cidade} onChange={handleChange("cidade")} />
              </div>
              <div>
                <Label>Estado</Label>
                <Input value={form.estado} onChange={handleChange("estado")} placeholder="SP" />
              </div>
            </div>
            <div>
              <Label>Referencia</Label>
              <Input value={form.referencia} onChange={handleChange("referencia")} placeholder="Ponto de referencia para entrega" />
            </div>
            <div>
              <Label>Observacoes</Label>
              <Input value={form.observacoes} onChange={handleChange("observacoes")} placeholder="Notas sobre o cliente..." />
            </div>

            <div className="border-t pt-4 space-y-3">
              <p className="text-sm font-medium text-foreground">Localizacao na Rota</p>
              <div>
                <Label className="flex items-center gap-1"><Tag className="w-3 h-3" /> TAG de Localizacao</Label>
                <Input
                  value={form.tagLocalizacao}
                  onChange={handleChange("tagLocalizacao")}
                  placeholder="Ex: Centro, Bairro Norte, Vila A..."
                />
                <p className="text-xs text-muted-foreground mt-1">Identificador livre para agrupar clientes por local</p>
              </div>
              <div>
                <Label className="flex items-center gap-1"><MapPin className="w-3 h-3" /> Rota</Label>
                <Select value={form.rotaId} onValueChange={(v) => setForm({ ...form, rotaId: v, rotaParadaId: "" })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione a rota..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="nenhuma">Sem rota</SelectItem>
                    {rotas?.map((r) => (
                      <SelectItem key={r.id} value={String(r.id)}>{r.nome}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {form.rotaId && form.rotaId !== "nenhuma" && (
                <div>
                  <Label>Parada da Rota</Label>
                  <ParadasSelector
                    rotaId={parseInt(form.rotaId, 10)}
                    value={form.rotaParadaId}
                    onChange={(v) => setForm({ ...form, rotaParadaId: v })}
                  />
                </div>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancelar</Button>
            <Button
              onClick={handleSubmit}
              disabled={!form.nome || !form.telefone || createCliente.isPending || updateCliente.isPending}
            >
              {createCliente.isPending || updateCliente.isPending ? "Salvando..." : editingId ? "Salvar" : "Cadastrar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
