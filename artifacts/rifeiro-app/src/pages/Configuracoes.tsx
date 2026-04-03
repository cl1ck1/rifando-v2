import { useEffect, useState } from "react";
import { useGetConfiguracoes, useUpdateConfiguracoes, getGetConfiguracoesQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { Save, Store, Link as LinkIcon, Smartphone, MapPin } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Switch } from "@/components/ui/switch";

export default function Configuracoes() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useGetConfiguracoes();
  const updateConfig = useUpdateConfiguracoes();

  const [form, setForm] = useState<any>({
    nomeNegocio: "",
    telefoneWhatsapp: "",
    cidade: "",
    estado: "",
    chavePix: "",
    catalogoAtivo: false,
    catalogoSlug: ""
  });

  useEffect(() => {
    if (config) {
      setForm({
        nomeNegocio: config.nomeNegocio || "",
        telefoneWhatsapp: config.telefoneWhatsapp || "",
        cidade: config.cidade || "",
        estado: config.estado || "",
        chavePix: config.chavePix || "",
        catalogoAtivo: config.catalogoAtivo || false,
        catalogoSlug: config.catalogoSlug || ""
      });
    }
  }, [config]);

  const handleSave = () => {
    updateConfig.mutate({
      data: form
    }, {
      onSuccess: () => {
        toast({ title: "Sucesso", description: "Configurações salvas." });
        queryClient.invalidateQueries({ queryKey: getGetConfiguracoesQueryKey() });
      },
      onError: () => {
        toast({ title: "Erro", description: "Falha ao salvar as configurações.", variant: "destructive" });
      }
    });
  };

  if (isLoading) {
    return <div className="space-y-6 max-w-2xl"><Skeleton className="h-10 w-1/3" /><Skeleton className="h-[400px]" /></div>;
  }

  return (
    <div className="space-y-6 max-w-3xl">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Configurações</h1>
        <p className="text-muted-foreground mt-1">Gerencie os dados da sua empresa e preferências do sistema.</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><Store className="h-5 w-5" /> Dados do Negócio</CardTitle>
          <CardDescription>Informações que aparecerão para seus clientes.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <Label>Nome da Agência / Excursão</Label>
            <Input value={form.nomeNegocio} onChange={e => setForm({...form, nomeNegocio: e.target.value})} placeholder="Sua Empresa Turismo" />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2"><Smartphone className="h-4 w-4" /> WhatsApp</Label>
              <Input value={form.telefoneWhatsapp} onChange={e => setForm({...form, telefoneWhatsapp: e.target.value})} placeholder="(11) 99999-9999" />
            </div>
            <div className="grid gap-2">
              <Label>Chave PIX Principal</Label>
              <Input value={form.chavePix} onChange={e => setForm({...form, chavePix: e.target.value})} placeholder="CNPJ, E-mail ou Telefone" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Cidade Sede</Label>
              <Input value={form.cidade} onChange={e => setForm({...form, cidade: e.target.value})} placeholder="São Paulo" />
            </div>
            <div className="grid gap-2">
              <Label>Estado (UF)</Label>
              <Input value={form.estado} onChange={e => setForm({...form, estado: e.target.value})} placeholder="SP" maxLength={2} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2"><LinkIcon className="h-5 w-5" /> Link do Catálogo</CardTitle>
          <CardDescription>Sua página pública onde clientes podem ver viagens abertas.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between border p-4 rounded-lg">
            <div className="space-y-0.5">
              <Label className="text-base">Catálogo Online</Label>
              <p className="text-sm text-muted-foreground">Ativar página pública da sua agência</p>
            </div>
            <Switch checked={form.catalogoAtivo} onCheckedChange={v => setForm({...form, catalogoAtivo: v})} />
          </div>
          
          <div className="grid gap-2">
            <Label>Identificador do Link (Slug)</Label>
            <div className="flex items-center">
              <span className="bg-muted border border-r-0 rounded-l-md px-3 py-2 text-sm text-muted-foreground">sourifeiro.com.br/c/</span>
              <Input 
                className="rounded-l-none" 
                value={form.catalogoSlug} 
                onChange={e => setForm({...form, catalogoSlug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '')})} 
                placeholder="sua-agencia" 
                disabled={!form.catalogoAtivo}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={updateConfig.isPending} size="lg">
          <Save className="h-4 w-4 mr-2" /> Salvar Configurações
        </Button>
      </div>
    </div>
  );
}