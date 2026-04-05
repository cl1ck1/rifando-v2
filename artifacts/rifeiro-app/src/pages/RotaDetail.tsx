import { useState, useRef, useCallback } from "react";
import { useRoute, Link } from "wouter";
import {
  useGetRota,
  useUpdateRota,
  useCreateRotaParada,
  useUpdateRotaParada,
  useDeleteRotaParada,
  useGetRotaClientes,
  getGetRotaQueryKey,
  getListRotasQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { GoogleMap, LoadScript, Marker, Autocomplete } from "@react-google-maps/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import {
  ArrowLeft,
  MapPin,
  Plus,
  Trash2,
  Users,
  Navigation,
  Eye,
  Pencil,
  Map,
  Info,
} from "lucide-react";

const GOOGLE_MAPS_API_KEY = import.meta.env.VITE_GOOGLE_MAPS_API_KEY as string | undefined;
const MAPS_LIBRARIES: ("places")[] = ["places"];

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

const mapContainerStyle = { width: "100%", height: "400px" };
const defaultCenter = { lat: -15.7801, lng: -47.9292 };

function MapaRotas({
  paradas,
  cor,
}: {
  paradas: { id: number; nome: string; lat?: number | null; lng?: number | null; ordem: number }[];
  cor: string;
}) {
  const paradasComCoordenadas = paradas.filter((p) => p.lat && p.lng);
  const center =
    paradasComCoordenadas.length > 0
      ? { lat: paradasComCoordenadas[0].lat!, lng: paradasComCoordenadas[0].lng! }
      : defaultCenter;

  return (
    <GoogleMap
      mapContainerStyle={mapContainerStyle}
      center={center}
      zoom={paradasComCoordenadas.length > 0 ? 10 : 5}
    >
      {paradasComCoordenadas.map((p, idx) => (
        <Marker
          key={p.id}
          position={{ lat: p.lat!, lng: p.lng! }}
          label={{
            text: String(idx + 1),
            color: "#fff",
            fontWeight: "bold",
            fontSize: "12px",
          }}
          title={p.nome}
          icon={{
            path: "M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z",
            fillColor: cor,
            fillOpacity: 1,
            strokeColor: "#fff",
            strokeWeight: 2,
            scale: 1.5,
            anchor: { x: 12, y: 22 } as unknown as google.maps.Point,
          }}
        />
      ))}
    </GoogleMap>
  );
}

function BuscaParadaGoogleMaps({ onAdd }: { onAdd: (parada: { nome: string; estado?: string; enderecoCompleto?: string; lat?: number; lng?: number }) => void }) {
  const autocompleteRef = useRef<google.maps.places.Autocomplete | null>(null);
  const [inputValue, setInputValue] = useState("");

  const onPlaceChanged = () => {
    if (!autocompleteRef.current) return;
    const place = autocompleteRef.current.getPlace();
    if (!place.geometry?.location) return;

    const lat = place.geometry.location.lat();
    const lng = place.geometry.location.lng();
    const addressComponents = place.address_components || [];

    let estado = "";
    for (const comp of addressComponents) {
      if (comp.types.includes("administrative_area_level_1")) {
        estado = comp.short_name;
        break;
      }
    }

    onAdd({
      nome: place.name || place.formatted_address || inputValue,
      estado,
      enderecoCompleto: place.formatted_address || "",
      lat,
      lng,
    });
    setInputValue("");
  };

  return (
    <div className="space-y-2">
      <Label>Buscar local (cidade, bairro, endereco)</Label>
      <Autocomplete
        onLoad={(ac) => { autocompleteRef.current = ac; }}
        onPlaceChanged={onPlaceChanged}
        options={{ componentRestrictions: { country: "br" } }}
      >
        <Input
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          placeholder="Digite o nome da cidade ou endereco..."
        />
      </Autocomplete>
    </div>
  );
}

function BuscaParadaManual({ onAdd }: { onAdd: (parada: { nome: string; estado?: string; enderecoCompleto?: string }) => void }) {
  const [nome, setNome] = useState("");
  const [estado, setEstado] = useState("");
  const [endereco, setEndereco] = useState("");

  const handleAdd = () => {
    if (!nome) return;
    onAdd({ nome, estado: estado || undefined, enderecoCompleto: endereco || undefined });
    setNome("");
    setEstado("");
    setEndereco("");
  };

  return (
    <div className="space-y-3">
      <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-2 text-sm text-amber-800">
        <Info className="w-4 h-4 shrink-0 mt-0.5" />
        <span>
          Para usar o mapa interativo com busca automatica de enderecos, adicione a variavel{" "}
          <code className="font-mono bg-amber-100 px-1 rounded">VITE_GOOGLE_MAPS_API_KEY</code> nas configuracoes do projeto.
        </span>
      </div>
      <div className="grid grid-cols-3 gap-3">
        <div className="col-span-2">
          <Label>Nome da Parada *</Label>
          <Input value={nome} onChange={(e) => setNome(e.target.value)} placeholder="Ex: Sao Paulo - Centro" />
        </div>
        <div>
          <Label>UF</Label>
          <Input value={estado} onChange={(e) => setEstado(e.target.value)} placeholder="SP" maxLength={2} />
        </div>
      </div>
      <div>
        <Label>Endereco Completo</Label>
        <Input value={endereco} onChange={(e) => setEndereco(e.target.value)} placeholder="Rua, bairro, cidade..." />
      </div>
      <Button onClick={handleAdd} disabled={!nome} className="gap-2">
        <Plus className="w-4 h-4" /> Adicionar Parada
      </Button>
    </div>
  );
}

export default function RotaDetail() {
  const [, params] = useRoute("/rotas/:id");
  const rotaId = parseInt(params?.id || "0", 10);
  const queryClient = useQueryClient();

  const { data: rotaData, isLoading } = useGetRota(rotaId);
  const { data: clientesData } = useGetRotaClientes(rotaId);
  const updateRota = useUpdateRota();
  const createParada = useCreateRotaParada();
  const updateParada = useUpdateRotaParada();
  const deleteParada = useDeleteRotaParada();

  const [editRotaOpen, setEditRotaOpen] = useState(false);
  const [editRotaForm, setEditRotaForm] = useState({ nome: "", status: "planejada" as RotaStatus });
  const [deleteParadaId, setDeleteParadaId] = useState<number | null>(null);
  const [mapsLoaded, setMapsLoaded] = useState(false);

  const invalidateRota = useCallback(() => {
    queryClient.invalidateQueries({ queryKey: getGetRotaQueryKey(rotaId) });
    queryClient.invalidateQueries({ queryKey: getListRotasQueryKey() });
  }, [queryClient, rotaId]);

  const openEditRota = () => {
    if (!rotaData) return;
    setEditRotaForm({ nome: rotaData.rota.nome, status: rotaData.rota.status as RotaStatus });
    setEditRotaOpen(true);
  };

  const handleUpdateRota = () => {
    updateRota.mutate(
      { id: rotaId, data: { nome: editRotaForm.nome, status: editRotaForm.status } },
      { onSuccess: () => { invalidateRota(); setEditRotaOpen(false); } }
    );
  };

  const handleAddParada = (parada: { nome: string; estado?: string; enderecoCompleto?: string; lat?: number; lng?: number }) => {
    createParada.mutate(
      { id: rotaId, data: { nome: parada.nome, estado: parada.estado, enderecoCompleto: parada.enderecoCompleto, lat: parada.lat, lng: parada.lng } },
      { onSuccess: () => invalidateRota() }
    );
  };

  const handleDeleteParada = () => {
    if (deleteParadaId === null) return;
    deleteParada.mutate(
      { id: rotaId, paradaId: deleteParadaId },
      { onSuccess: () => { invalidateRota(); setDeleteParadaId(null); } }
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-48 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  if (!rotaData) {
    return <p className="text-muted-foreground">Rota nao encontrada</p>;
  }

  const { rota, paradas } = rotaData;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 flex-wrap">
        <Link href="/rotas">
          <Button variant="ghost" size="icon"><ArrowLeft className="w-5 h-5" /></Button>
        </Link>
        <div className="flex items-center gap-3 flex-1">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
            style={{ backgroundColor: rota.cor + "20" }}
          >
            <Navigation className="w-5 h-5" style={{ color: rota.cor }} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{rota.nome}</h1>
            {rota.descricao && (
              <p className="text-muted-foreground text-sm">{rota.descricao}</p>
            )}
          </div>
          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusVariants[rota.status as RotaStatus]}`}>
            {statusLabels[rota.status as RotaStatus]}
          </span>
        </div>
        <Button variant="outline" size="sm" className="gap-2" onClick={openEditRota}>
          <Pencil className="w-4 h-4" /> Editar
        </Button>
      </div>

      <div className="grid grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{paradas.length}</p>
            <p className="text-xs text-muted-foreground mt-1">Paradas</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">{rota.totalClientes ?? 0}</p>
            <p className="text-xs text-muted-foreground mt-1">Clientes</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4 text-center">
            <p className="text-2xl font-bold text-foreground">
              {new Date(rota.createdAt).toLocaleDateString("pt-BR")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">Criada em</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="paradas">
        <TabsList>
          <TabsTrigger value="paradas" className="gap-2">
            <MapPin className="w-4 h-4" /> Paradas ({paradas.length})
          </TabsTrigger>
          <TabsTrigger value="clientes" className="gap-2">
            <Users className="w-4 h-4" /> Clientes ({rota.totalClientes ?? 0})
          </TabsTrigger>
          {GOOGLE_MAPS_API_KEY && (
            <TabsTrigger value="mapa" className="gap-2">
              <Map className="w-4 h-4" /> Mapa
            </TabsTrigger>
          )}
        </TabsList>

        <TabsContent value="paradas" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Adicionar Nova Parada</CardTitle>
            </CardHeader>
            <CardContent>
              {GOOGLE_MAPS_API_KEY ? (
                <LoadScript
                  googleMapsApiKey={GOOGLE_MAPS_API_KEY}
                  libraries={MAPS_LIBRARIES}
                  onLoad={() => setMapsLoaded(true)}
                >
                  {mapsLoaded ? (
                    <div className="space-y-3">
                      <BuscaParadaGoogleMaps onAdd={handleAddParada} />
                    </div>
                  ) : (
                    <Skeleton className="h-10 w-full" />
                  )}
                </LoadScript>
              ) : (
                <BuscaParadaManual onAdd={handleAddParada} />
              )}
            </CardContent>
          </Card>

          {paradas.length > 0 ? (
            <div className="space-y-2">
              {paradas.map((parada, idx) => (
                <Card key={parada.id}>
                  <CardContent className="p-4 flex items-center gap-4">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0"
                      style={{ backgroundColor: rota.cor }}
                    >
                      {idx + 1}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{parada.nome}</p>
                      {parada.enderecoCompleto && (
                        <p className="text-xs text-muted-foreground">{parada.enderecoCompleto}</p>
                      )}
                      {parada.estado && !parada.enderecoCompleto && (
                        <p className="text-xs text-muted-foreground">{parada.estado}</p>
                      )}
                      {(parada.lat && parada.lng) && (
                        <p className="text-xs text-muted-foreground">
                          {Number(parada.lat).toFixed(4)}, {Number(parada.lng).toFixed(4)}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive"
                        onClick={() => setDeleteParadaId(parada.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="p-8 text-center">
                <MapPin className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground">Nenhuma parada adicionada ainda</p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="clientes" className="mt-4">
          {clientesData ? (
            <div className="space-y-4">
              {clientesData.paradas.map(({ parada, clientes }) => (
                <Card key={parada.id}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm flex items-center gap-2">
                      <div
                        className="w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold"
                        style={{ backgroundColor: rota.cor }}
                      >
                        {paradas.findIndex((p) => p.id === parada.id) + 1}
                      </div>
                      {parada.nome}
                      <Badge variant="outline" className="ml-auto">{clientes.length} cliente{clientes.length !== 1 ? "s" : ""}</Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="pt-0">
                    {clientes.length > 0 ? (
                      <div className="space-y-2">
                        {clientes.map((c) => (
                          <div key={c.id} className="flex items-center justify-between py-2 border-b last:border-0">
                            <div>
                              <p className="text-sm font-medium">{c.nome}</p>
                              <p className="text-xs text-muted-foreground">{c.telefone}</p>
                              {c.tagLocalizacao && (
                                <span className="text-xs bg-primary/10 text-primary px-2 py-0.5 rounded-full">
                                  {c.tagLocalizacao}
                                </span>
                              )}
                            </div>
                            <Link href={`/clientes/${c.id}`}>
                              <Button variant="ghost" size="icon">
                                <Eye className="w-4 h-4" />
                              </Button>
                            </Link>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-xs text-muted-foreground py-2">Nenhum cliente nesta parada</p>
                    )}
                  </CardContent>
                </Card>
              ))}
              {clientesData.semParada && clientesData.semParada.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  {clientesData.semParada.length} cliente{clientesData.semParada.length !== 1 ? "s" : ""} sem parada vinculada
                </p>
              )}
              {clientesData.paradas.length === 0 && (
                <Card>
                  <CardContent className="p-8 text-center">
                    <Users className="w-10 h-10 mx-auto text-muted-foreground/40 mb-3" />
                    <p className="text-muted-foreground">Adicione paradas e vincule clientes a elas</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      Va em Clientes, edite um cliente e selecione a parada desta rota
                    </p>
                  </CardContent>
                </Card>
              )}
            </div>
          ) : (
            <Skeleton className="h-48 w-full" />
          )}
        </TabsContent>

        {GOOGLE_MAPS_API_KEY && (
          <TabsContent value="mapa" className="mt-4">
            <Card>
              <CardContent className="p-0 overflow-hidden rounded-lg">
                <LoadScript googleMapsApiKey={GOOGLE_MAPS_API_KEY} libraries={MAPS_LIBRARIES}>
                  <MapaRotas paradas={paradas} cor={rota.cor} />
                </LoadScript>
              </CardContent>
            </Card>
            {paradas.filter((p) => p.lat && p.lng).length === 0 && (
              <p className="text-sm text-muted-foreground text-center mt-3">
                As paradas com coordenadas aparecerao como marcadores no mapa
              </p>
            )}
          </TabsContent>
        )}
      </Tabs>

      <Dialog open={editRotaOpen} onOpenChange={setEditRotaOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Editar Rota</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Nome *</Label>
              <Input
                value={editRotaForm.nome}
                onChange={(e) => setEditRotaForm({ ...editRotaForm, nome: e.target.value })}
              />
            </div>
            <div>
              <Label>Status</Label>
              <Select
                value={editRotaForm.status}
                onValueChange={(v) => setEditRotaForm({ ...editRotaForm, status: v as RotaStatus })}
              >
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
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditRotaOpen(false)}>Cancelar</Button>
            <Button onClick={handleUpdateRota} disabled={!editRotaForm.nome || updateRota.isPending}>
              {updateRota.isPending ? "Salvando..." : "Salvar"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteParadaId !== null} onOpenChange={(open) => !open && setDeleteParadaId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remover Parada</AlertDialogTitle>
            <AlertDialogDescription>
              Esta parada sera removida da rota. Os clientes vinculados a ela nao serao excluidos.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteParada}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remover
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
