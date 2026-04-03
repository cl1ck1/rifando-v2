import { useState } from "react";
import { useListClientes, useCreateCliente, useDeleteCliente, getListClientesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Users, Search, Eye, Trash2 } from "lucide-react";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

export default function Clientes() {
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const { data: clientes, isLoading } = useListClientes({ search: search || undefined });
  const createCliente = useCreateCliente();
  const deleteCliente = useDeleteCliente();

  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({
    nome: "", telefone: "", email: "", cpf: "",
    endereco: "", bairro: "", cidade: "", estado: "",
    referencia: "", observacoes: "",
  });

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value });
  };

  const handleSubmit = () => {
    if (!form.nome || !form.telefone) return;
    createCliente.mutate({ data: {
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
    }}, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListClientesQueryKey() });
        setDialogOpen(false);
        setForm({ nome: "", telefone: "", email: "", cpf: "", endereco: "", bairro: "", cidade: "", estado: "", referencia: "", observacoes: "" });
      },
    });
  };

  const handleDelete = (id: number) => {
    deleteCliente.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListClientesQueryKey() }),
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Clientes</h1>
          <p className="text-muted-foreground">Gerencie seus clientes e contatos</p>
        </div>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="gap-2"><Plus className="w-4 h-4" /> Novo Cliente</Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Novo Cliente</DialogTitle>
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
            </div>
            <DialogFooter>
              <Button onClick={handleSubmit} disabled={!form.nome || !form.telefone || createCliente.isPending}>
                {createCliente.isPending ? "Salvando..." : "Cadastrar"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar por nome ou telefone..."
          className="pl-9"
        />
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
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="text-right">
                    <p className="text-sm font-semibold text-foreground">{formatCurrency(c.totalCompras)}</p>
                    <Badge variant={c.status === "ativo" ? "default" : "secondary"}>{c.status}</Badge>
                  </div>
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
    </div>
  );
}
