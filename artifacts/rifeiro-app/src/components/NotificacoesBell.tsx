import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Bell, Check, Clock, AlertTriangle, ShoppingBag } from "lucide-react";

const API_BASE = import.meta.env.VITE_API_URL || "/api";

interface Notificacao {
  id: number;
  tipo: string;
  titulo: string;
  descricao: string | null;
  referenciaId: number | null;
  lida: boolean;
  createdAt: string;
}

const tipoIcons: Record<string, React.ReactNode> = {
  parcela_vencendo: <Clock className="w-4 h-4 text-amber-500" />,
  cobranca_pendente: <AlertTriangle className="w-4 h-4 text-red-500" />,
  venda_nova: <ShoppingBag className="w-4 h-4 text-green-500" />,
};

export function NotificacoesBell() {
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data } = useQuery<{ naoLidas: number; notificacoes: Notificacao[] }>({
    queryKey: ["notificacoes"],
    queryFn: async () => {
      const res = await fetch(`${API_BASE}/notificacoes`, { credentials: "include" });
      if (!res.ok) throw new Error("Erro");
      return res.json();
    },
    refetchInterval: 60000, // refresh a cada minuto
  });

  const marcarLida = useMutation({
    mutationFn: async (id: number) => {
      await fetch(`${API_BASE}/notificacoes/${id}/lida`, { method: "POST", credentials: "include" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
  });

  const marcarTodasLidas = useMutation({
    mutationFn: async () => {
      await fetch(`${API_BASE}/notificacoes/lida-todas`, { method: "POST", credentials: "include" });
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["notificacoes"] }),
  });

  const naoLidas = data?.naoLidas || 0;
  const notificacoes = data?.notificacoes || [];

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="w-5 h-5" />
          {naoLidas > 0 && (
            <Badge className="absolute -top-1 -right-1 w-5 h-5 p-0 flex items-center justify-center text-[10px] bg-red-500 text-white">
              {naoLidas > 9 ? "9+" : naoLidas}
            </Badge>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0" align="end">
        <div className="p-3 border-b flex items-center justify-between">
          <p className="font-semibold text-sm">Notificações</p>
          {naoLidas > 0 && (
            <Button variant="ghost" size="sm" className="text-xs h-auto p-1" onClick={() => marcarTodasLidas.mutate()}>
              Marcar todas como lidas
            </Button>
          )}
        </div>
        <div className="max-h-64 overflow-y-auto">
          {notificacoes.length === 0 ? (
            <p className="p-4 text-sm text-muted-foreground text-center">Nenhuma notificação</p>
          ) : (
            notificacoes.map(n => (
              <div
                key={n.id}
                className={`p-3 border-b last:border-0 cursor-pointer hover:bg-muted/50 ${!n.lida ? "bg-muted/30" : ""}`}
                onClick={() => !n.lida && marcarLida.mutate(n.id)}
              >
                <div className="flex items-start gap-2">
                  {tipoIcons[n.tipo] || <Bell className="w-4 h-4" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{n.titulo}</p>
                    {n.descricao && <p className="text-xs text-muted-foreground">{n.descricao}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(n.createdAt).toLocaleString("pt-BR")}
                    </p>
                  </div>
                  {!n.lida && <div className="w-2 h-2 rounded-full bg-blue-500 mt-1" />}
                </div>
              </div>
            ))
          )}
        </div>
      </PopoverContent>
    </Popover>
  );
}
