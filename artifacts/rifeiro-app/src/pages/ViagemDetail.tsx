import { useGetViagem, useGetViagemOccupancy, useUpdateViagem, getGetViagemQueryKey, getGetViagemOccupancyQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Calendar, MapPin, Users, DollarSign, Clock, Settings, Save, AlertCircle } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function ViagemDetail() {
  const [, params] = useRoute("/viagens/:id");
  const id = Number(params?.id);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<any>({});

  const { data: viagem, isLoading: isLoadingViagem } = useGetViagem(id, { 
    query: { enabled: !!id, queryKey: getGetViagemQueryKey(id) } 
  });
  
  const { data: occupancy, isLoading: isLoadingOccupancy } = useGetViagemOccupancy(id, {
    query: { enabled: !!id, queryKey: getGetViagemOccupancyQueryKey(id) }
  });

  const updateViagem = useUpdateViagem();

  useEffect(() => {
    if (viagem && !isEditing) {
      setEditForm({
        destino: viagem.destino,
        descricao: viagem.descricao || "",
        precoPorAssento: viagem.precoPorAssento,
        status: viagem.status,
        dataPartida: viagem.dataPartida ? new Date(viagem.dataPartida).toISOString().slice(0, 16) : "",
        dataRetorno: viagem.dataRetorno ? new Date(viagem.dataRetorno).toISOString().slice(0, 16) : "",
        assentosTotal: viagem.assentosTotal,
        paradasRota: viagem.paradasRota || ""
      });
    }
  }, [viagem, isEditing]);

  const handleSave = () => {
    updateViagem.mutate({
      id,
      data: {
        ...editForm,
        dataPartida: new Date(editForm.dataPartida).toISOString(),
        dataRetorno: new Date(editForm.dataRetorno).toISOString(),
        precoPorAssento: Number(editForm.precoPorAssento),
        assentosTotal: Number(editForm.assentosTotal)
      }
    }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Viagem atualizada com sucesso." });
        setIsEditing(false);
        queryClient.invalidateQueries({ queryKey: getGetViagemQueryKey(id) });
        queryClient.invalidateQueries({ queryKey: getGetViagemOccupancyQueryKey(id) });
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao atualizar viagem.", variant: "destructive" });
      }
    });
  };

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (isLoadingViagem || isLoadingOccupancy) {
    return <div className="space-y-6"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!viagem) return <div>Viagem não encontrada.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/viagens">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{viagem.destino}</h1>
            {!isEditing && <Badge variant={viagem.status === 'ativa' ? 'default' : 'secondary'}>{viagem.status}</Badge>}
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> 
            {format(new Date(viagem.dataPartida), "dd 'de' MMMM, yyyy", { locale: ptBR })}
          </p>
        </div>
        
        {!isEditing ? (
          <Button onClick={() => setIsEditing(true)} variant="outline">
            <Settings className="mr-2 h-4 w-4" /> Editar Roteiro
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button onClick={() => setIsEditing(false)} variant="ghost">Cancelar</Button>
            <Button onClick={handleSave} disabled={updateViagem.isPending}>
              <Save className="mr-2 h-4 w-4" /> Salvar
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Main Content Area */}
        <div className="md:col-span-2 space-y-6">
          {isEditing ? (
            <Card>
              <CardHeader>
                <CardTitle>Editar Detalhes</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-2">
                  <Label>Destino</Label>
                  <Input value={editForm.destino} onChange={e => setEditForm({...editForm, destino: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Status</Label>
                  <Select value={editForm.status} onValueChange={v => setEditForm({...editForm, status: v})}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="planejada">Planejada</SelectItem>
                      <SelectItem value="ativa">Ativa</SelectItem>
                      <SelectItem value="concluida">Concluída</SelectItem>
                      <SelectItem value="cancelada">Cancelada</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Data Partida</Label>
                    <Input type="datetime-local" value={editForm.dataPartida} onChange={e => setEditForm({...editForm, dataPartida: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Data Retorno</Label>
                    <Input type="datetime-local" value={editForm.dataRetorno} onChange={e => setEditForm({...editForm, dataRetorno: e.target.value})} />
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label>Descrição / Roteiro</Label>
                  <Textarea className="min-h-[120px]" value={editForm.descricao} onChange={e => setEditForm({...editForm, descricao: e.target.value})} />
                </div>
                <div className="grid gap-2">
                  <Label>Paradas / Locais de Embarque</Label>
                  <Textarea value={editForm.paradasRota} onChange={e => setEditForm({...editForm, paradasRota: e.target.value})} />
                </div>
              </CardContent>
            </Card>
          ) : (
            <>
              {viagem.descricao && (
                <Card>
                  <CardHeader><CardTitle>Sobre o Roteiro</CardTitle></CardHeader>
                  <CardContent className="whitespace-pre-wrap text-muted-foreground leading-relaxed">
                    {viagem.descricao}
                  </CardContent>
                </Card>
              )}
              
              {viagem.paradasRota && (
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <MapPin className="h-5 w-5 text-primary" /> Locais de Embarque
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="whitespace-pre-wrap text-muted-foreground">
                    {viagem.paradasRota}
                  </CardContent>
                </Card>
              )}

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" /> Datas e Horários
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 gap-6">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Partida</span>
                      <span className="font-medium text-lg">{format(new Date(viagem.dataPartida), "dd/MM/yyyy 'às' HH:mm")}</span>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-sm text-muted-foreground">Retorno (Previsão)</span>
                      <span className="font-medium text-lg">{format(new Date(viagem.dataRetorno), "dd/MM/yyyy 'às' HH:mm")}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </>
          )}
        </div>

        {/* Sidebar Stats Area */}
        <div className="space-y-6">
          <Card>
            <CardHeader className="pb-4">
              <CardTitle>Ocupação</CardTitle>
              <CardDescription>Gerenciamento de poltronas</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isEditing ? (
                <div className="space-y-4 pt-2">
                  <div className="grid gap-2">
                    <Label>Total de Assentos</Label>
                    <Input type="number" value={editForm.assentosTotal} onChange={e => setEditForm({...editForm, assentosTotal: e.target.value})} />
                  </div>
                  <div className="grid gap-2">
                    <Label>Preço por Assento (R$)</Label>
                    <Input type="number" step="0.01" value={editForm.precoPorAssento} onChange={e => setEditForm({...editForm, precoPorAssento: e.target.value})} />
                  </div>
                </div>
              ) : (
                <>
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm font-medium">
                      <span>{occupancy?.assentosVendidos || 0} vendidos</span>
                      <span className="text-muted-foreground">{occupancy?.assentosTotal || viagem.assentosTotal} total</span>
                    </div>
                    <Progress value={occupancy?.percentualOcupacao || 0} className="h-3" />
                    <p className="text-xs text-right text-muted-foreground">{occupancy?.assentosDisponiveis || 0} poltronas livres</p>
                  </div>

                  <div className="pt-4 border-t grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <Users className="h-3 w-3" /> Preço Unit.
                      </p>
                      <p className="font-semibold">{formatCurrency(viagem.precoPorAssento)}</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground flex items-center gap-1 mb-1">
                        <DollarSign className="h-3 w-3" /> Receita Total
                      </p>
                      <p className="font-semibold text-green-600">{formatCurrency(occupancy?.receitaTotal || 0)}</p>
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>

          {!isEditing && (
            <Card className="border-dashed bg-muted/30">
              <CardContent className="p-6 text-center space-y-4">
                <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center text-primary">
                  <Users className="h-6 w-6" />
                </div>
                <div>
                  <h3 className="font-semibold text-lg">Lista de Passageiros</h3>
                  <p className="text-sm text-muted-foreground mt-1">Gerencie os passageiros e pagamentos desta viagem.</p>
                </div>
                <Link href={`/financeiro?viagemId=${viagem.id}`}>
                  <Button className="w-full" variant="outline">Ver Passageiros</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}