import { useEffect, useState } from "react";
import { useGetConfiguracoes, useUpdateConfiguracoes, getGetConfiguracoesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Skeleton } from "@/components/ui/skeleton";
import { Settings, Save, CheckCircle } from "lucide-react";

export default function Configuracoes() {
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useGetConfiguracoes();
  const updateConfig = useUpdateConfiguracoes();

  const [form, setForm] = useState({
    nomeNegocio: "",
    telefoneWhatsapp: "",
    logoUrl: "",
    catalogoSlug: "",
    catalogoAtivo: false,
    cidade: "",
    estado: "",
    chavePix: "",
    mensagemBoasVindas: "",
  });

  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (config) {
      setForm({
        nomeNegocio: config.nomeNegocio || "",
        telefoneWhatsapp: config.telefoneWhatsapp || "",
        logoUrl: config.logoUrl || "",
        catalogoSlug: config.catalogoSlug || "",
        catalogoAtivo: config.catalogoAtivo || false,
        cidade: config.cidade || "",
        estado: config.estado || "",
        chavePix: config.chavePix || "",
        mensagemBoasVindas: config.mensagemBoasVindas || "",
      });
    }
  }, [config]);

  const handleChange = (field: string) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, [field]: e.target.value });
    setSaved(false);
  };

  const handleSubmit = () => {
    updateConfig.mutate({ data: {
      nomeNegocio: form.nomeNegocio || undefined,
      telefoneWhatsapp: form.telefoneWhatsapp || undefined,
      logoUrl: form.logoUrl || undefined,
      catalogoSlug: form.catalogoSlug || undefined,
      catalogoAtivo: form.catalogoAtivo,
      cidade: form.cidade || undefined,
      estado: form.estado || undefined,
      chavePix: form.chavePix || undefined,
      mensagemBoasVindas: form.mensagemBoasVindas || undefined,
    }}, {
      onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: getGetConfiguracoesQueryKey() });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      },
    });
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full" />
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Configuracoes</h1>
        <p className="text-muted-foreground">Ajuste as configuracoes do seu negocio</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Settings className="w-4 h-4" />
            Dados do Negocio
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Nome do Negocio</Label>
            <Input value={form.nomeNegocio} onChange={handleChange("nomeNegocio")} placeholder="Ex: Maria Enxovais" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Telefone WhatsApp</Label>
              <Input value={form.telefoneWhatsapp} onChange={handleChange("telefoneWhatsapp")} placeholder="(99) 99999-9999" />
            </div>
            <div>
              <Label>Chave Pix</Label>
              <Input value={form.chavePix} onChange={handleChange("chavePix")} placeholder="CPF, email ou telefone" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Cidade</Label>
              <Input value={form.cidade} onChange={handleChange("cidade")} placeholder="Sua cidade" />
            </div>
            <div>
              <Label>Estado</Label>
              <Input value={form.estado} onChange={handleChange("estado")} placeholder="SP" />
            </div>
          </div>
          <div>
            <Label>URL do Logo</Label>
            <Input value={form.logoUrl} onChange={handleChange("logoUrl")} placeholder="https://..." />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Catalogo Virtual</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Catalogo Ativo</p>
              <p className="text-xs text-muted-foreground">Habilitar pagina publica do catalogo</p>
            </div>
            <Switch
              checked={form.catalogoAtivo}
              onCheckedChange={(checked) => { setForm({ ...form, catalogoAtivo: checked }); setSaved(false); }}
            />
          </div>
          <div>
            <Label>Slug do Catalogo</Label>
            <Input value={form.catalogoSlug} onChange={handleChange("catalogoSlug")} placeholder="meu-catalogo" />
            {form.catalogoSlug && (
              <p className="text-xs text-muted-foreground mt-1">URL: /catalogo/{form.catalogoSlug}</p>
            )}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">WhatsApp</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Mensagem de Boas-vindas</Label>
            <Input value={form.mensagemBoasVindas} onChange={handleChange("mensagemBoasVindas")} placeholder="Ola! Obrigado por entrar em contato..." />
          </div>
        </CardContent>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={handleSubmit} disabled={updateConfig.isPending} className="gap-2">
          <Save className="w-4 h-4" />
          {updateConfig.isPending ? "Salvando..." : "Salvar Configuracoes"}
        </Button>
        {saved && (
          <span className="text-sm text-green-600 flex items-center gap-1">
            <CheckCircle className="w-4 h-4" /> Salvo com sucesso!
          </span>
        )}
      </div>
    </div>
  );
}
