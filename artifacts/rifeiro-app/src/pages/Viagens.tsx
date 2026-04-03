import { useState } from "react";
import { useListViagens, useCreateViagem, useDeleteViagem, getListViagensQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { MapPin, Calendar, Users, Plus, MoreVertical, Search, Filter } from "lucide-react";
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
import { Textarea } from "@/components/ui/textarea";

export default function Viagens() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // Form State
  const [destino, setDestino] = useState("");
  const [descricao, setDescricao] = useState("");
  const [dataPartida, setDataPartida] = useState("");
  const [dataRetorno, setDataRetorno] = useState("");
  const [assentosTotal, setAssentosTotal] = useState("46");
  const [precoPorAssento, setPrecoPorAssento] = useState("");

  const queryParams = statusFilter !== "all" ? { status: statusFilter as any } : undefined;
  const { data: viagens, isLoading } = useListViagens(queryParams);
  const createViagem = useCreateViagem();
  const deleteViagem = useDeleteViagem();

  const handleCreate = () => {
    if (!destino || !dataPartida || !dataRetorno || !assentosTotal || !precoPorAssento) {
      toast({ title: "Erro", description: "Preencha todos os campos obrigatórios.", variant: "destructive" });
      return;
    }

    createViagem.mutate({
      data: {
        destino,
        descricao,
        dataPartida: new Date(dataPartida).toISOString(),
        dataRetorno: new Date(dataRetorno).toISOString(),
        assentosTotal: parseInt(assentosTotal, 10),
        precoPorAssento: parseFloat(precoPorAssento),
        status: "planejada"
      }
    }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Viagem criada com sucesso." });
        setIsCreateOpen(false);
        setDestino(""); setDescricao(""); setDataPartida(""); setDataRetorno(""); setPrecoPorAssento("");
        queryClient.invalidateQueries({ queryKey: getListViagensQueryKey() });
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível criar a viagem.", variant: "destructive" });
      }
    });
  };

  const handleDelete = (id: number) => {
    if (!confirm("Tem certeza que deseja excluir esta viagem?")) return;
    
    deleteViagem.mutate({ id }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Viagem excluída." });
        queryClient.invalidateQueries({ queryKey: getListViagensQueryKey() });
      },
      onError: () => {
        toast({ title: "Erro", description: "Não foi possível excluir.", variant: "destructive" });
      }
    });
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'planejada': return <Badge variant="secondary" className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">Planejada</Badge>;
      case 'ativa': return <Badge className="bg-green-500 hover:bg-green-600">Ativa</Badge>;
      case 'concluida': return <Badge variant="outline" className="text-muted-foreground">Concluída</Badge>;
      case 'cancelada': return <Badge variant="destructive">Cancelada</Badge>;
      default: return <Badge variant="secondary">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Viagens</h1>
          <p className="text-muted-foreground mt-1">Gerencie suas excursões, roteiros e assentos.</p>
        </div>
        
        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button className="w-full sm:w-auto">
              <Plus className="mr-2 h-4 w-4" /> Nova Viagem
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Criar Nova Viagem</DialogTitle>
              <DialogDescription>
                Preencha os dados da nova excursão. Você poderá adicionar mais detalhes depois.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="destino">Destino *</Label>
                <Input id="destino" value={destino} onChange={e => setDestino(e.target.value)} placeholder="Ex: Aparecida do Norte - SP" />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="descricao">Descrição (opcional)</Label>
                <Textarea id="descricao" value={descricao} onChange={e => setDescricao(e.target.value)} placeholder="Detalhes do roteiro..." />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="partida">Data Partida *</Label>
                  <Input id="partida" type="datetime-local" value={dataPartida} onChange={e => setDataPartida(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="retorno">Data Retorno *</Label>
                  <Input id="retorno" type="datetime-local" value={dataRetorno} onChange={e => setDataRetorno(e.target.value)} />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="assentos">Total Assentos *</Label>
                  <Input id="assentos" type="number" value={assentosTotal} onChange={e => setAssentosTotal(e.target.value)} />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="preco">Preço / Assento (R$) *</Label>
                  <Input id="preco" type="number" step="0.01" value={precoPorAssento} onChange={e => setPrecoPorAssento(e.target.value)} />
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsCreateOpen(false)}>Cancelar</Button>
              <Button onClick={handleCreate} disabled={createViagem.isPending}>
                {createViagem.isPending ? "Salvando..." : "Salvar Viagem"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 items-center bg-card p-4 rounded-lg border shadow-sm">
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Buscar destino..." className="pl-9" />
        </div>
        
        <div className="flex items-center gap-2 w-full sm:w-auto ml-auto">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="Filtrar por status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os Status</SelectItem>
              <SelectItem value="planejada">Planejada</SelectItem>
              <SelectItem value="ativa">Ativa</SelectItem>
              <SelectItem value="concluida">Concluída</SelectItem>
              <SelectItem value="cancelada">Cancelada</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* List */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {isLoading ? (
          Array.from({ length: 6 }).map((_, i) => (
            <Card key={i} className="overflow-hidden">
              <Skeleton className="h-32 w-full rounded-none" />
              <CardContent className="p-4 space-y-3">
                <Skeleton className="h-6 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
                <div className="pt-4 flex justify-between">
                  <Skeleton className="h-8 w-20" />
                  <Skeleton className="h-8 w-20" />
                </div>
              </CardContent>
            </Card>
          ))
        ) : viagens?.length === 0 ? (
          <div className="col-span-full flex flex-col items-center justify-center p-12 text-center border rounded-lg border-dashed bg-muted/10">
            <MapPin className="h-12 w-12 text-muted-foreground mb-4 opacity-50" />
            <h3 className="text-lg font-medium">Nenhuma viagem encontrada</h3>
            <p className="text-muted-foreground mt-1 max-w-sm">
              Você ainda não tem viagens com este status. Clique em "Nova Viagem" para começar.
            </p>
          </div>
        ) : (
          viagens?.map((viagem) => {
            const ocupacao = Math.round((viagem.assentosVendidos / viagem.assentosTotal) * 100) || 0;
            
            return (
              <Card key={viagem.id} className="overflow-hidden flex flex-col hover-elevate shadow-sm transition-all group">
                <div className="h-32 bg-muted relative border-b">
                  {viagem.imagemUrl ? (
                    <img src={viagem.imagemUrl} alt={viagem.destino} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-primary/5 flex items-center justify-center text-primary">
                      <MapPin className="h-10 w-10 opacity-50" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    {getStatusBadge(viagem.status)}
                  </div>
                </div>
                
                <CardContent className="p-5 flex-1 flex flex-col">
                  <div className="flex justify-between items-start mb-2">
                    <Link href={`/viagens/${viagem.id}`} className="font-bold text-lg leading-tight hover:text-primary transition-colors line-clamp-2">
                      {viagem.destino}
                    </Link>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8 -mr-2 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Ações</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem asChild>
                          <Link href={`/viagens/${viagem.id}`}>Ver Detalhes</Link>
                        </DropdownMenuItem>
                        <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleDelete(viagem.id)}>
                          Excluir Viagem
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                  
                  <div className="space-y-2 text-sm text-muted-foreground flex-1 mt-2">
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 shrink-0" />
                      <span className="truncate">{format(new Date(viagem.dataPartida), "dd MMM yyyy", { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4 shrink-0" />
                      <span>{viagem.assentosVendidos} / {viagem.assentosTotal} assentos ({ocupacao}%)</span>
                    </div>
                  </div>
                  
                  <div className="mt-4 pt-4 border-t flex items-center justify-between">
                    <div>
                      <span className="text-xs text-muted-foreground block">Valor</span>
                      <span className="font-bold text-foreground">{formatCurrency(viagem.precoPorAssento)}</span>
                    </div>
                    <Link href={`/viagens/${viagem.id}`}>
                      <Button variant="secondary" size="sm">Gerenciar</Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            );
          })
        )}
      </div>
    </div>
  );
}