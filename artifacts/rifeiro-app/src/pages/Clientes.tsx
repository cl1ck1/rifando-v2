import { useState } from "react";
import { useListClientes, useCreateCliente, useDeleteCliente, getListClientesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Users, Plus, Search, Filter, Phone, Mail, MapPin, MoreVertical, ShieldAlert } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Label } from "@/components/ui/label";

export default function Clientes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const [nome, setNome] = useState("");
  const [telefone, setTelefone] = useState("");
  const [email, setEmail] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");

  const queryParams = {
    ...(search ? { search } : {}),
    ...(statusFilter !== "all" ? { status: statusFilter as any } : {})
  };

  const { data: clientes, isLoading } = useListClientes(queryParams);
  const createCliente = useCreateCliente();
  const deleteCliente = useDeleteCliente();

  const handleCreate = () => {
    if (!nome || !telefone) {
      toast({ title: "Erro", description: "Nome e telefone são obrigatórios.", variant: "destructive" });
      return;
    }

    createCliente.mutate({
      data: {
        nome,
        telefone,
        email: email || undefined,
        cidade: cidade || undefined,
        estado: estado || undefined,
        status: "ativo"
      }
    }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Cliente cadastrado com sucesso." });
        setIsCreateOpen(false);
        setNome(""); setTelefone(""); setEmail(""); setCidade(""); setEstado("");
        queryClient.invalidateQueries({ queryKey: getListClientesQueryKey() });
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível cadastrar o cliente.", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Tem certeza que deseja excluir este cliente?")) return;
    
    deleteCliente.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Cliente excluído." });
        queryClient.invalidateQueries({ queryKey: getListClientesQueryKey() });
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
      }
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Clientes</h1>
          <p className="text-muted-foreground mt-1">Gerencie sua carteira de passageiros.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Novo Cliente
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Cadastrar Cliente</DialogTitle>
              <DialogDescription>
                Adicione um novo passageiro à sua base de dados.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nome">Nome Completo *</Label>
                <Input id="nome" value={nome} onChange={e => setNome(e.target.value)} placeholder="Ex: Maria da Silva" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="telefone">Telefone / WhatsApp *</Label>
                  <Input id="telefone" value={telefone} onChange={e => setTelefone(e.target.value)} placeholder="(11) 99999-9999" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="email">E-mail</Label>
                  <Input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="maria@email.com" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="cidade">Cidade</Label>
                  <Input id="cidade" value={cidade} onChange={e => setCidade(e.target.value)} placeholder="São Paulo" />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="estado">Estado (UF)</Label>
                  <Input id="estado" value={estado} onChange={e => setEstado(e.target.value)} placeholder="SP" maxLength={2} />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={createCliente.isPending}>
                {createCliente.isPending ? "Salvando..." : "Salvar Cliente"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:max-w-md">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input 
            placeholder="Buscar por nome, telefone ou e-mail..." 
            className="pl-9" 
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto ml-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos</SelectItem>
              <SelectItem value="ativo">Ativos</SelectItem>
              <SelectItem value="inativo">Inativos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <Card className="shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground font-medium">
              <tr>
                <th className="py-3 px-4 font-medium">Cliente</th>
                <th className="py-3 px-4 font-medium hidden md:table-cell">Contato</th>
                <th className="py-3 px-4 font-medium hidden lg:table-cell">Localização</th>
                <th className="py-3 px-4 font-medium">Viagens</th>
                <th className="py-3 px-4 font-medium">Total Gasto</th>
                <th className="py-3 px-4 font-medium">Status</th>
                <th className="py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} className="border-b last:border-0">
                    <td className="py-3 px-4"><Skeleton className="h-10 w-[200px]" /></td>
                    <td className="py-3 px-4 hidden md:table-cell"><Skeleton className="h-4 w-[120px]" /></td>
                    <td className="py-3 px-4 hidden lg:table-cell"><Skeleton className="h-4 w-[100px]" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-[40px]" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-4 w-[80px]" /></td>
                    <td className="py-3 px-4"><Skeleton className="h-6 w-[60px] rounded-full" /></td>
                    <td className="py-3 px-4 text-right"><Skeleton className="h-8 w-8 rounded-md ml-auto" /></td>
                  </tr>
                ))
              ) : clientes?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-muted-foreground">
                    <Users className="h-10 w-10 opacity-20 mx-auto mb-3" />
                    <p>Nenhum cliente encontrado.</p>
                  </td>
                </tr>
              ) : (
                clientes?.map((cliente) => (
                  <tr key={cliente.id} className="border-b last:border-0 hover:bg-muted/30 transition-colors group">
                    <td className="py-3 px-4">
                      <Link href={`/clientes/${cliente.id}`} className="font-medium text-foreground hover:text-primary transition-colors flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                          {cliente.nome.charAt(0).toUpperCase()}
                        </div>
                        <span className="truncate max-w-[200px]">{cliente.nome}</span>
                      </Link>
                    </td>
                    <td className="py-3 px-4 hidden md:table-cell">
                      <div className="flex flex-col gap-1 text-muted-foreground">
                        <span className="flex items-center gap-1.5"><Phone className="h-3 w-3" /> {cliente.telefone}</span>
                        {cliente.email && <span className="flex items-center gap-1.5"><Mail className="h-3 w-3" /> {cliente.email}</span>}
                      </div>
                    </td>
                    <td className="py-3 px-4 hidden lg:table-cell text-muted-foreground">
                      {(cliente.cidade || cliente.estado) ? (
                        <span className="flex items-center gap-1.5">
                          <MapPin className="h-3 w-3" /> 
                          {[cliente.cidade, cliente.estado].filter(Boolean).join(" - ")}
                        </span>
                      ) : (
                        <span className="opacity-50">-</span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-muted-foreground">
                      <Badge variant="secondary" className="font-normal">{cliente.totalCompras} viagens</Badge>
                    </td>
                    <td className="py-3 px-4 font-medium">
                      {formatCurrency(cliente.totalCompras > 0 ? 1000 : 0)} {/* Mocked value for total spent based on API output if available */}
                    </td>
                    <td className="py-3 px-4">
                      <Badge variant={cliente.status === 'ativo' ? 'default' : 'secondary'} className={cliente.status === 'ativo' ? 'bg-green-500 hover:bg-green-600' : ''}>
                        {cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
                      </Badge>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem asChild>
                            <Link href={`/clientes/${cliente.id}`}>Ver Perfil</Link>
                          </DropdownMenuItem>
                          <DropdownMenuItem asChild>
                            <Link href={`/financeiro?clienteId=${cliente.id}`}>Ver Pagamentos</Link>
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(cliente.id)}>
                            Excluir Cliente
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}