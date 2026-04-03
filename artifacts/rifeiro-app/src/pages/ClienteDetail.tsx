import { useGetCliente, useGetClienteHistory, getGetClienteQueryKey } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, Phone, Mail, MapPin, Calendar, CreditCard, Map, User, Bus } from "lucide-react";

export default function ClienteDetail() {
  const [, params] = useRoute("/clientes/:id");
  const id = Number(params?.id);

  const { data: cliente, isLoading: isLoadingCliente } = useGetCliente(id, { 
    query: { enabled: !!id, queryKey: getGetClienteQueryKey(id) } 
  });

  const { data: history, isLoading: isLoadingHistory } = useGetClienteHistory(id, {
    query: { enabled: !!id, queryKey: ['getClienteHistory', id] } // Using array as per normal convention, no explicit generated key provided in list for history
  });

  const formatCurrency = (val: number) => 
    new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(val);

  if (isLoadingCliente) {
    return <div className="space-y-6"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-64 w-full" /></div>;
  }

  if (!cliente) return <div>Cliente não encontrado.</div>;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link href="/clientes">
          <Button variant="ghost" size="icon" className="rounded-full">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="flex-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{cliente.nome}</h1>
            <Badge variant={cliente.status === 'ativo' ? 'default' : 'secondary'} className={cliente.status === 'ativo' ? 'bg-green-500' : ''}>
              {cliente.status === 'ativo' ? 'Ativo' : 'Inativo'}
            </Badge>
          </div>
          <p className="text-muted-foreground mt-1 flex items-center gap-2">
            <Calendar className="h-4 w-4" /> 
            Cliente desde {format(new Date(cliente.createdAt), "MMMM 'de' yyyy", { locale: ptBR })}
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        {/* Profile Info */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Informações de Contato</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3 text-sm">
                <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                  <Phone className="h-4 w-4" />
                </div>
                <div>
                  <p className="text-muted-foreground text-xs">Telefone</p>
                  <p className="font-medium">{cliente.telefone}</p>
                </div>
              </div>
              
              {cliente.email && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <Mail className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">E-mail</p>
                    <p className="font-medium">{cliente.email}</p>
                  </div>
                </div>
              )}

              {(cliente.cidade || cliente.estado) && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <MapPin className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">Localização</p>
                    <p className="font-medium">{[cliente.cidade, cliente.estado].filter(Boolean).join(" - ")}</p>
                  </div>
                </div>
              )}

              {cliente.cpf && (
                <div className="flex items-center gap-3 text-sm">
                  <div className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center shrink-0">
                    <User className="h-4 w-4" />
                  </div>
                  <div>
                    <p className="text-muted-foreground text-xs">CPF</p>
                    <p className="font-medium">{cliente.cpf}</p>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {cliente.observacoes && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Observações</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{cliente.observacoes}</p>
              </CardContent>
            </Card>
          )}
        </div>

        {/* History */}
        <div className="md:col-span-2 space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <Map className="h-8 w-8 text-primary mb-2 opacity-80" />
                <p className="text-2xl font-bold">{cliente.totalCompras}</p>
                <p className="text-sm text-muted-foreground">Viagens Realizadas</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                <CreditCard className="h-8 w-8 text-green-500 mb-2 opacity-80" />
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(history?.pagamentos?.filter(p => p.status === 'pago').reduce((acc, p) => acc + p.valor, 0) || 0)}
                </p>
                <p className="text-sm text-muted-foreground">Total Investido</p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Histórico de Viagens</CardTitle>
              <CardDescription>Excursões que este cliente participou</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoadingHistory ? (
                <div className="space-y-4">
                  <Skeleton className="h-16 w-full" />
                  <Skeleton className="h-16 w-full" />
                </div>
              ) : history?.viagens && history.viagens.length > 0 ? (
                <div className="space-y-4">
                  {history.viagens.map((viagem) => (
                    <div key={viagem.id} className="flex items-center justify-between p-4 rounded-lg border bg-muted/20">
                      <div className="flex items-center gap-4">
                        <div className="h-10 w-10 bg-primary/10 rounded-full flex items-center justify-center">
                          <Bus className="h-5 w-5 text-primary" />
                        </div>
                        <div>
                          <Link href={`/viagens/${viagem.id}`} className="font-medium hover:text-primary transition-colors">
                            {viagem.destino}
                          </Link>
                          <p className="text-sm text-muted-foreground">
                            {format(new Date(viagem.dataPartida), "dd MMM yyyy", { locale: ptBR })}
                          </p>
                        </div>
                      </div>
                      <Badge variant={viagem.status === 'concluida' ? 'outline' : 'default'}>
                        {viagem.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-muted-foreground">
                  <p>Nenhuma viagem registrada.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}