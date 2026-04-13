import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Bell, MessageSquare, Send, CheckCircle, ExternalLink, Clock } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

interface CobrancaParcela {
  id: number;
  vendaId: number;
  clienteId: number;
  clienteNome: string;
  clienteTelefone: string | null;
  numero: number;
  totalParcelas: number;
  valor: number;
  dataVencimento: string;
  status: string;
  cobrancas: Array<{
    id: number;
    tipo: string;
    status: string;
    mensagem: string | null;
    enviadoEm: string;
    resposta: string | null;
  }>;
}

export default function Cobrancas() {
  const queryClient = useQueryClient();
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [msgDialog, setMsgDialog] = useState<{ open: boolean; parcelaId?: number; isLote?: boolean }>({ open: false });
  const [customMsg, setCustomMsg] = useState("");
  const [lastResult, setLastResult] = useState<{ type: "success" | "error"; message: string } | null>(null);

  const { data: inadimplentes, isLoading } = useQuery<CobrancaParcela[]>({
    queryKey: ["cobrancas"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/cobrancas`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro ao carregar inadimplentes");
      return res.json();
    },
  });

  const cobrarMutation = useMutation({
    mutationFn: async ({ parcelaId, mensagem }: { parcelaId: number; mensagem?: string }) => {
      const res = await fetch(`${API_BASE}/cobrancas/cobrar`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ parcelaId, mensagem }),
      });
      if (!res.ok) throw new Error("Erro ao gerar cobrança");
      return res.json();
    },
    onSuccess: (data) => {
      window.open(data.whatsappLink, "_blank");
      setLastResult({ type: "success", message: `Cobrança enviada para ${data.cobrancaLog?.id ? "parcela" : "cliente"}` });
      queryClient.invalidateQueries({ queryKey: ["cobrancas"] });
    },
    onError: () => setLastResult({ type: "error", message: "Erro ao enviar cobrança" }),
  });

  const cobrarLoteMutation = useMutation({
    mutationFn: async ({ parcelaIds, mensagem }: { parcelaIds: number[]; mensagem?: string }) => {
      const res = await fetch(`${API_BASE}/cobrancas/cobrar-lote`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ parcelaIds, mensagem }),
      });
      if (!res.ok) throw new Error("Erro ao gerar cobranças em lote");
      return res.json();
    },
    onSuccess: (data) => {
      // Abrir todos os links do WhatsApp
      data.cobrancas?.forEach((c: { whatsappLink: string }, i: number) => {
        setTimeout(() => window.open(c.whatsappLink, "_blank"), i * 500);
      });
      setLastResult({ type: "success", message: `${data.total} cobranças geradas` });
      queryClient.invalidateQueries({ queryKey: ["cobrancas"] });
      setSelected(new Set());
    },
    onError: () => setLastResult({ type: "error", message: "Erro ao enviar cobranças em lote" }),
  });

  const toggleSelect = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id); else next.add(id);
    setSelected(next);
  };

  const toggleAll = () => {
    if (selected.size === inadimplentes?.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(inadimplentes?.map(p => p.id) || []));
    }
  };

  const handleCobrar = (parcelaId: number) => {
    if (customMsg) {
      cobrarMutation.mutate({ parcelaId, mensagem: customMsg });
    } else {
      cobrarMutation.mutate({ parcelaId });
    }
    setMsgDialog({ open: false });
    setCustomMsg("");
  };

  const handleCobrarLote = () => {
    if (customMsg) {
      cobrarLoteMutation.mutate({ parcelaIds: Array.from(selected), mensagem: customMsg });
    } else {
      cobrarLoteMutation.mutate({ parcelaIds: Array.from(selected) });
    }
    setMsgDialog({ open: false });
    setCustomMsg("");
  };

  const totalEmAtraso = inadimplentes?.reduce((acc, p) => acc + p.valor, 0) || 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Cobranças</h1>
          <p className="text-muted-foreground">Parcelas inadimplentes e cobranças</p>
        </div>
        {selected.size > 0 && (
          <Button onClick={() => setMsgDialog({ open: true, isLote: true })} className="gap-2">
            <Send className="w-4 h-4" />
            Cobrar {selected.size} selecionados
          </Button>
        )}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Inadimplentes</p>
            <p className="text-lg font-bold text-red-600">{inadimplentes?.length || 0}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Total em Atraso</p>
            <p className="text-lg font-bold text-red-600">{formatCurrency(totalEmAtraso)}</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground mb-1">Cobranças Enviadas</p>
            <p className="text-lg font-bold">{inadimplentes?.reduce((acc, p) => acc + p.cobrancas.length, 0) || 0}</p>
          </CardContent>
        </Card>
      </div>

      {lastResult && (
        <Alert variant={lastResult.type === "error" ? "destructive" : "default"}>
          <AlertDescription>{lastResult.message}</AlertDescription>
        </Alert>
      )}

      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map(i => <Skeleton key={i} className="h-24 w-full" />)}
        </div>
      ) : inadimplentes && inadimplentes.length > 0 ? (
        <>
          <div className="flex items-center gap-2">
            <Checkbox
              checked={selected.size === inadimplentes.length && inadimplentes.length > 0}
              onCheckedChange={toggleAll}
            />
            <span className="text-sm text-muted-foreground">Selecionar todos</span>
          </div>
          <div className="space-y-3">
            {inadimplentes.map(p => (
              <Card key={p.id}>
                <CardContent className="p-4">
                  <div className="flex items-start gap-3">
                    <Checkbox
                      checked={selected.has(p.id)}
                      onCheckedChange={() => toggleSelect(p.id)}
                      className="mt-1"
                    />
                    <div className="flex-1">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-foreground">{p.clienteNome}</p>
                          <p className="text-sm text-muted-foreground">
                            Parcela {p.numero}/{p.totalParcelas} — Venc: {p.dataVencimento}
                          </p>
                          {p.clienteTelefone && (
                            <p className="text-xs text-muted-foreground">{p.clienteTelefone}</p>
                          )}
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="text-right">
                            <p className="font-semibold">{formatCurrency(p.valor)}</p>
                            <Badge className="bg-red-100 text-red-800">{p.status}</Badge>
                          </div>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => setMsgDialog({ open: true, parcelaId: p.id })}
                            className="gap-1"
                          >
                            <MessageSquare className="w-4 h-4" />
                            Cobrar
                          </Button>
                        </div>
                      </div>
                      {p.cobrancas.length > 0 && (
                        <div className="mt-2 pt-2 border-t">
                          <p className="text-xs font-medium text-muted-foreground mb-1">Histórico de cobranças:</p>
                          {p.cobrancas.map(c => (
                            <div key={c.id} className="flex items-center gap-2 text-xs text-muted-foreground">
                              <Clock className="w-3 h-3" />
                              <span>{new Date(c.enviadoEm).toLocaleString("pt-BR")}</span>
                              <Badge variant="outline" className="text-xs">{c.tipo}</Badge>
                              <Badge variant="outline" className="text-xs">{c.status}</Badge>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="p-12 text-center">
            <CheckCircle className="w-12 h-12 mx-auto text-green-500/40 mb-4" />
            <p className="text-muted-foreground">Nenhum inadimplente no momento 🎉</p>
          </CardContent>
        </Card>
      )}

      <Dialog open={msgDialog.open} onOpenChange={(open) => { setMsgDialog({ ...msgDialog, open }); if (!open) setCustomMsg(""); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {msgDialog.isLote ? `Cobrar ${selected.size} inadimplentes` : "Enviar cobrança via WhatsApp"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              Mensagem personalizada (deixe vazio para usar o template padrão):
            </p>
            <Textarea
              placeholder="Olá {clienteNome}! Você tem uma parcela pendente de R$ {valor}..."
              value={customMsg}
              onChange={(e) => setCustomMsg(e.target.value)}
              rows={4}
            />
            <p className="text-xs text-muted-foreground">
              Variáveis: {"{clienteNome}"}, {"{valor}"}, {"{vencimento}"}, {"{parcela}"}
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setMsgDialog({ open: false })}>Cancelar</Button>
            <Button
              onClick={() => msgDialog.isLote ? handleCobrarLote() : msgDialog.parcelaId && handleCobrar(msgDialog.parcelaId)}
              disabled={cobrarMutation.isPending || cobrarLoteMutation.isPending}
              className="gap-2"
            >
              <Send className="w-4 h-4" />
              Enviar via WhatsApp
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
