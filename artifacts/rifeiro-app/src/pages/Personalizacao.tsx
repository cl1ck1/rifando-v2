import { useState, useEffect } from "react";
import {
  useGetConfiguracoes,
  useUpdateConfiguracoes,
  useListCategorias,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
  useListLojaBanners,
  useCreateLojaBanner,
  useUpdateLojaBanner,
  useDeleteLojaBanner,
  getGetConfiguracoesQueryKey,
  getListCategoriasQueryKey,
  getListLojaBannersQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ImageUploader } from "@/components/ui/ImageUploader";
import {
  Palette,
  Store,
  Image,
  Layers,
  Save,
  CheckCircle,
  Trash2,
  Plus,
  GripVertical,
  ExternalLink,
  Eye,
  EyeOff,
  ArrowUp,
  ArrowDown,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

export default function Personalizacao() {
  const queryClient = useQueryClient();

  const { data: config, isLoading: configLoading } = useGetConfiguracoes();
  const { data: categorias, isLoading: categoriasLoading } = useListCategorias();
  const { data: banners, isLoading: bannersLoading } = useListLojaBanners();

  const updateConfig = useUpdateConfiguracoes();
  const createCategoria = useCreateCategoria();
  const updateCategoria = useUpdateCategoria();
  const deleteCategoria = useDeleteCategoria();
  const createBanner = useCreateLojaBanner();
  const updateBanner = useUpdateLojaBanner();
  const deleteBanner = useDeleteLojaBanner();

  const [aparenciaForm, setAparenciaForm] = useState({
    logoUrl: "",
    bannerPrincipalUrl: "",
    corPrincipal: "#2563eb",
    corSecundaria: "#f59e0b",
    descricao: "",
    mensagemBoasVindas: "",
    nomeNegocio: "",
  });
  const [aparenciaSaved, setAparenciaSaved] = useState(false);

  const [newCategoriaNome, setNewCategoriaNome] = useState("");

  useEffect(() => {
    if (config) {
      setAparenciaForm({
        logoUrl: config.logoUrl || "",
        bannerPrincipalUrl: config.bannerPrincipalUrl || "",
        corPrincipal: config.corPrincipal || "#2563eb",
        corSecundaria: config.corSecundaria || "#f59e0b",
        descricao: config.descricao || "",
        mensagemBoasVindas: config.mensagemBoasVindas || "",
        nomeNegocio: config.nomeNegocio || "",
      });
    }
  }, [config]);

  const handleSaveAparencia = () => {
    updateConfig.mutate({
      data: {
        logoUrl: aparenciaForm.logoUrl || undefined,
        bannerPrincipalUrl: aparenciaForm.bannerPrincipalUrl || undefined,
        corPrincipal: aparenciaForm.corPrincipal || undefined,
        corSecundaria: aparenciaForm.corSecundaria || undefined,
        descricao: aparenciaForm.descricao || undefined,
        mensagemBoasVindas: aparenciaForm.mensagemBoasVindas || undefined,
        nomeNegocio: aparenciaForm.nomeNegocio || undefined,
      },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetConfiguracoesQueryKey() });
        setAparenciaSaved(true);
        setTimeout(() => setAparenciaSaved(false), 2500);
      },
    });
  };

  const handleAddCategoria = () => {
    if (!newCategoriaNome.trim()) return;
    createCategoria.mutate({
      data: { nome: newCategoriaNome.trim(), exibirNoCatalogo: true, ordem: (categorias?.length ?? 0) },
    }, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getListCategoriasQueryKey() });
        setNewCategoriaNome("");
      },
    });
  };

  const handleCategoriaCorChange = (id: number, cor: string) => {
    updateCategoria.mutate({ id, data: { cor } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCategoriasQueryKey() }),
    });
  };

  const handleCategoriaVisibilidade = (id: number, exibir: boolean) => {
    updateCategoria.mutate({ id, data: { exibirNoCatalogo: exibir } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCategoriasQueryKey() }),
    });
  };

  const handleDeleteCategoria = (id: number) => {
    deleteCategoria.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListCategoriasQueryKey() }),
    });
  };

  const handleBannerOrdem = (id: number, direction: "up" | "down", currentOrdem: number) => {
    const newOrdem = direction === "up" ? currentOrdem - 1 : currentOrdem + 1;
    updateBanner.mutate({ id, data: { ordem: newOrdem } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLojaBannersQueryKey() }),
    });
  };

  const handleBannerAtivo = (id: number, ativo: boolean) => {
    updateBanner.mutate({ id, data: { ativo } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLojaBannersQueryKey() }),
    });
  };

  const handleDeleteBanner = (id: number) => {
    deleteBanner.mutate({ id }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLojaBannersQueryKey() }),
    });
  };

  const handleAddBanner = (imageUrl: string) => {
    const nextOrdem = (banners?.length ?? 0);
    createBanner.mutate({
      data: { imageUrl, ordem: nextOrdem, ativo: true },
    }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLojaBannersQueryKey() }),
    });
  };

  const handleBannerTitulo = (id: number, titulo: string) => {
    updateBanner.mutate({ id, data: { titulo: titulo || null } }, {
      onSuccess: () => queryClient.invalidateQueries({ queryKey: getListLojaBannersQueryKey() }),
    });
  };

  const catalogoUrl = config?.catalogoSlug
    ? `${window.location.origin}${BASE}/catalogo/${config.catalogoSlug}`
    : null;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Personalizacao</h1>
        <p className="text-muted-foreground text-sm">Configure a aparencia e o conteudo do seu catalogo publico.</p>
      </div>

      {catalogoUrl && (
        <Card className="border-primary/20 bg-primary/5">
          <CardContent className="pt-4 pb-4 flex items-center justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-0.5">Link do seu catalogo publico</p>
              <a
                href={catalogoUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm font-medium text-primary hover:underline truncate block"
              >
                {catalogoUrl}
              </a>
            </div>
            <a href={catalogoUrl} target="_blank" rel="noopener noreferrer">
              <Button size="sm" variant="outline" className="gap-1.5 shrink-0">
                <ExternalLink className="w-3.5 h-3.5" />
                Abrir
              </Button>
            </a>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="aparencia">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="aparencia" className="gap-1.5">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Aparencia</span>
          </TabsTrigger>
          <TabsTrigger value="carrossel" className="gap-1.5">
            <Image className="w-4 h-4" />
            <span className="hidden sm:inline">Carrossel</span>
          </TabsTrigger>
          <TabsTrigger value="categorias" className="gap-1.5">
            <Layers className="w-4 h-4" />
            <span className="hidden sm:inline">Categorias</span>
          </TabsTrigger>
        </TabsList>

        {/* ── Aparencia ── */}
        <TabsContent value="aparencia" className="mt-4 space-y-4">
          {configLoading ? (
            <div className="space-y-4">
              <Skeleton className="h-32 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          ) : (
            <>
              <Card>
                <CardHeader>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Store className="w-4 h-4" />
                    Identidade da Loja
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    <ImageUploader
                      label="Logo da loja"
                      value={aparenciaForm.logoUrl}
                      onChange={(url) => setAparenciaForm(f => ({ ...f, logoUrl: url || "" }))}
                      aspectRatio="square"
                    />
                    <ImageUploader
                      label="Banner principal"
                      value={aparenciaForm.bannerPrincipalUrl}
                      onChange={(url) => setAparenciaForm(f => ({ ...f, bannerPrincipalUrl: url || "" }))}
                      aspectRatio="banner"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Cor principal</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={aparenciaForm.corPrincipal}
                          onChange={(e) => setAparenciaForm(f => ({ ...f, corPrincipal: e.target.value }))}
                          className="h-10 w-12 rounded border border-input cursor-pointer p-0.5"
                        />
                        <Input
                          value={aparenciaForm.corPrincipal}
                          onChange={(e) => setAparenciaForm(f => ({ ...f, corPrincipal: e.target.value }))}
                          placeholder="#2563eb"
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Cor secundaria</Label>
                      <div className="flex items-center gap-2">
                        <input
                          type="color"
                          value={aparenciaForm.corSecundaria}
                          onChange={(e) => setAparenciaForm(f => ({ ...f, corSecundaria: e.target.value }))}
                          className="h-10 w-12 rounded border border-input cursor-pointer p-0.5"
                        />
                        <Input
                          value={aparenciaForm.corSecundaria}
                          onChange={(e) => setAparenciaForm(f => ({ ...f, corSecundaria: e.target.value }))}
                          placeholder="#f59e0b"
                          className="font-mono text-sm"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="descricao">Descricao da loja</Label>
                    <Input
                      id="descricao"
                      value={aparenciaForm.descricao}
                      onChange={(e) => setAparenciaForm(f => ({ ...f, descricao: e.target.value }))}
                      placeholder="Ex: Produtos de qualidade com os melhores precos"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="boasVindas">Mensagem de boas-vindas</Label>
                    <Input
                      id="boasVindas"
                      value={aparenciaForm.mensagemBoasVindas}
                      onChange={(e) => setAparenciaForm(f => ({ ...f, mensagemBoasVindas: e.target.value }))}
                      placeholder="Ex: Bem-vindo ao nosso catalogo! Aproveite nossas ofertas."
                    />
                  </div>
                </CardContent>
              </Card>

              <div className="flex justify-end">
                <Button
                  onClick={handleSaveAparencia}
                  disabled={updateConfig.isPending}
                  className="gap-2"
                >
                  {aparenciaSaved ? (
                    <>
                      <CheckCircle className="w-4 h-4" />
                      Salvo
                    </>
                  ) : (
                    <>
                      <Save className="w-4 h-4" />
                      {updateConfig.isPending ? "Salvando..." : "Salvar aparencia"}
                    </>
                  )}
                </Button>
              </div>
            </>
          )}
        </TabsContent>

        {/* ── Carrossel ── */}
        <TabsContent value="carrossel" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Imagens do Carrossel</CardTitle>
              <CardDescription>
                Adicione imagens promocionais que apareceram como slide no seu catalogo publico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {bannersLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-24 w-full" />
                  <Skeleton className="h-24 w-full" />
                </div>
              ) : (
                <>
                  {banners && banners.length > 0 ? (
                    <div className="space-y-3">
                      {[...banners].sort((a, b) => a.ordem - b.ordem).map((banner, idx) => (
                        <div key={banner.id} className="flex items-start gap-3 p-3 rounded-lg border bg-card">
                          <div className="flex flex-col gap-1 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              disabled={idx === 0}
                              onClick={() => handleBannerOrdem(banner.id, "up", banner.ordem)}
                            >
                              <ArrowUp className="w-3 h-3" />
                            </Button>
                            <GripVertical className="w-4 h-4 text-muted-foreground mx-auto" />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-6 w-6"
                              disabled={idx === (banners?.length ?? 1) - 1}
                              onClick={() => handleBannerOrdem(banner.id, "down", banner.ordem)}
                            >
                              <ArrowDown className="w-3 h-3" />
                            </Button>
                          </div>

                          <div className="w-24 h-16 rounded-md overflow-hidden border bg-muted shrink-0">
                            <img src={banner.imageUrl} alt="" className="w-full h-full object-cover" />
                          </div>

                          <div className="flex-1 min-w-0 space-y-2">
                            <Input
                              placeholder="Titulo (opcional)"
                              defaultValue={banner.titulo || ""}
                              onBlur={(e) => handleBannerTitulo(banner.id, e.target.value)}
                              className="h-8 text-sm"
                            />
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-muted-foreground"
                              title={banner.ativo ? "Desativar" : "Ativar"}
                              onClick={() => handleBannerAtivo(banner.id, !banner.ativo)}
                            >
                              {banner.ativo ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteBanner(banner.id)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <Image className="w-10 h-10 mx-auto mb-2 opacity-40" />
                      <p className="text-sm">Nenhum banner adicionado ainda</p>
                    </div>
                  )}

                  <div className="border-t pt-4">
                    <p className="text-sm font-medium mb-2">Adicionar novo banner</p>
                    <ImageUploader
                      aspectRatio="wide"
                      onChange={(url) => url && handleAddBanner(url)}
                    />
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Categorias ── */}
        <TabsContent value="categorias" className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Categorias de Produtos</CardTitle>
              <CardDescription>
                Gerencie as categorias, defina cores e controle quais aparecem no catalogo publico.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {categoriasLoading ? (
                <div className="space-y-2">
                  <Skeleton className="h-12 w-full" />
                  <Skeleton className="h-12 w-full" />
                </div>
              ) : (
                <>
                  {categorias && categorias.length > 0 ? (
                    <div className="space-y-2">
                      {categorias.map((cat) => (
                        <div key={cat.id} className="flex items-center gap-3 p-3 rounded-lg border bg-card">
                          <div
                            className="w-5 h-5 rounded-full border border-border shrink-0"
                            style={{ backgroundColor: cat.cor || "#6b7280" }}
                          />
                          <span className="flex-1 text-sm font-medium truncate">{cat.nome}</span>

                          <div className="flex items-center gap-1.5 shrink-0">
                            <input
                              type="color"
                              defaultValue={cat.cor || "#6b7280"}
                              onChange={(e) => handleCategoriaCorChange(cat.id, e.target.value)}
                              className="h-7 w-8 rounded border border-input cursor-pointer p-0.5"
                              title="Cor da categoria"
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-muted-foreground"
                              title={cat.exibirNoCatalogo ? "Ocultar no catalogo" : "Mostrar no catalogo"}
                              onClick={() => handleCategoriaVisibilidade(cat.id, !cat.exibirNoCatalogo)}
                            >
                              {cat.exibirNoCatalogo
                                ? <Eye className="w-3.5 h-3.5" />
                                : <EyeOff className="w-3.5 h-3.5 text-muted-foreground/50" />
                              }
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              className="h-7 w-7 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteCategoria(cat.id)}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground text-center py-4">Nenhuma categoria criada ainda.</p>
                  )}

                  <div className="flex gap-2 border-t pt-4">
                    <Input
                      placeholder="Nome da nova categoria"
                      value={newCategoriaNome}
                      onChange={(e) => setNewCategoriaNome(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleAddCategoria()}
                    />
                    <Button
                      onClick={handleAddCategoria}
                      disabled={!newCategoriaNome.trim() || createCategoria.isPending}
                      className="gap-1.5 shrink-0"
                    >
                      <Plus className="w-4 h-4" />
                      Adicionar
                    </Button>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
