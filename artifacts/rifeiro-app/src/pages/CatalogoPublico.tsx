import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingBag, MapPin, MessageCircle, Store, ArrowLeft, Package } from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Loja {
  nomeNegocio: string;
  logoUrl: string | null;
  cidade: string | null;
  estado: string | null;
  telefoneWhatsapp: string | null;
  mensagemBoasVindas: string | null;
}

interface Categoria {
  id: number;
  nome: string;
}

interface Produto {
  id: number;
  nome: string;
  descricao: string | null;
  precoVenda: number;
  imagemUrl: string | null;
  categoriaId: number | null;
  categoriaNome: string | null;
  estoque: number;
}

interface CatalogoData {
  loja: Loja;
  categorias: Categoria[];
  produtos: Produto[];
}

function formatCurrency(value: number): string {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value);
}

function cleanPhoneNumber(phone: string): string {
  return phone.replace(/\D/g, "");
}

function isValidWhatsAppPhone(phone: string | null): boolean {
  if (!phone) return false;
  return cleanPhoneNumber(phone).length >= 10;
}

function buildWhatsAppUrl(phone: string, productName: string, price: number): string {
  const cleanPhone = cleanPhoneNumber(phone);
  const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;
  const message = encodeURIComponent(
    `Ola! Tenho interesse no produto: *${productName}* (${formatCurrency(price)}). Podemos conversar?`
  );
  return `https://wa.me/${phoneWithCountry}?text=${message}`;
}

function LojaNotFound() {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <Store className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Loja nao encontrada</h1>
        <p className="text-muted-foreground mb-6">
          Este catalogo nao existe ou foi desativado pelo vendedor.
        </p>
        <Link href="/">
          <Button variant="outline">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar ao inicio
          </Button>
        </Link>
      </div>
    </div>
  );
}

function ServerErrorView({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-muted/50 to-background flex items-center justify-center p-4">
      <div className="text-center max-w-md">
        <div className="mx-auto w-20 h-20 rounded-full bg-muted flex items-center justify-center mb-6">
          <Package className="w-10 h-10 text-muted-foreground" />
        </div>
        <h1 className="text-2xl font-bold text-foreground mb-2">Erro temporario</h1>
        <p className="text-muted-foreground mb-6">
          Nao foi possivel carregar o catalogo. Tente novamente em alguns instantes.
        </p>
        <Button variant="outline" onClick={onRetry}>
          Tentar novamente
        </Button>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="min-h-[100dvh] bg-background">
      <div className="bg-primary/5 border-b">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Skeleton className="h-8 w-48 mb-2" />
          <Skeleton className="h-4 w-32" />
        </div>
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6">
        <div className="flex gap-2 mb-6">
          <Skeleton className="h-10 flex-1" />
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="rounded-xl border bg-card overflow-hidden">
              <Skeleton className="h-40 w-full" />
              <div className="p-3">
                <Skeleton className="h-4 w-3/4 mb-2" />
                <Skeleton className="h-5 w-1/2" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ProductCard({ produto, whatsappPhone }: { produto: Produto; whatsappPhone: string | null }) {
  return (
    <div className="group rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200">
      <div className="aspect-[4/3] bg-muted/50 relative overflow-hidden">
        {produto.imagemUrl ? (
          <img
            src={produto.imagemUrl}
            alt={produto.nome}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Package className="w-12 h-12 text-muted-foreground/40" />
          </div>
        )}
        {produto.categoriaNome && (
          <Badge
            variant="secondary"
            className="absolute top-2 left-2 text-[10px] px-1.5 py-0.5 bg-background/90 backdrop-blur-sm"
          >
            {produto.categoriaNome}
          </Badge>
        )}
        {produto.estoque <= 0 && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
            <Badge variant="destructive" className="text-xs">Esgotado</Badge>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">
          {produto.nome}
        </h3>
        {produto.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2">{produto.descricao}</p>
        )}
        <div className="flex items-center justify-between pt-1">
          <span className="text-lg font-bold text-primary">
            {formatCurrency(produto.precoVenda)}
          </span>
        </div>
        {isValidWhatsAppPhone(whatsappPhone) && produto.estoque > 0 && (
          <a
            href={buildWhatsAppUrl(whatsappPhone, produto.nome, produto.precoVenda)}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-center gap-2 w-full rounded-lg bg-[#25D366] hover:bg-[#20BD5A] text-white text-sm font-medium py-2.5 transition-colors"
          >
            <MessageCircle className="w-4 h-4" />
            Comprar via WhatsApp
          </a>
        )}
      </div>
    </div>
  );
}

export default function CatalogoPublico() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [data, setData] = useState<CatalogoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);

  const fetchCatalog = (isRefresh = false) => {
    if (!slug) return;
    if (!isRefresh) {
      setLoading(true);
      setNotFound(false);
      setServerError(false);
    }

    fetch(`${BASE}/api/catalogo/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (res.status === 404) {
          setNotFound(true);
          setLoading(false);
          return null;
        }
        if (!res.ok) {
          if (!isRefresh) setServerError(true);
          setLoading(false);
          return null;
        }
        return res.json();
      })
      .then((json) => {
        if (json) {
          setData(json);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!isRefresh) setServerError(true);
        setLoading(false);
      });
  };

  useEffect(() => {
    fetchCatalog();
  }, [slug]);

  useEffect(() => {
    if (!data || notFound || serverError) return;
    const interval = setInterval(() => fetchCatalog(true), 60000);
    return () => clearInterval(interval);
  }, [slug, data, notFound, serverError]);

  if (loading) return <LoadingSkeleton />;
  if (notFound) return <LojaNotFound />;
  if (serverError || !data) return <ServerErrorView onRetry={() => fetchCatalog()} />;

  const { loja, categorias, produtos } = data;

  const filteredProdutos = produtos.filter((p) => {
    const q = search.toLowerCase();
    const matchesSearch = !search ||
      p.nome.toLowerCase().includes(q) ||
      (p.descricao && p.descricao.toLowerCase().includes(q)) ||
      (p.categoriaNome && p.categoriaNome.toLowerCase().includes(q));
    const matchesCategoria = selectedCategoria === null || p.categoriaId === selectedCategoria;
    return matchesSearch && matchesCategoria;
  });

  const location = [loja.cidade, loja.estado].filter(Boolean).join(" - ");

  return (
    <div className="min-h-[100dvh] bg-background">
      <header className="bg-primary/5 border-b sticky top-0 z-10 backdrop-blur-sm bg-background/95">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            {loja.logoUrl ? (
              <img
                src={loja.logoUrl}
                alt={loja.nomeNegocio}
                className="w-12 h-12 rounded-full object-cover border-2 border-primary/20"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <ShoppingBag className="w-6 h-6 text-primary" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <h1 className="text-lg font-bold text-foreground truncate">{loja.nomeNegocio}</h1>
              {location && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {location}
                </p>
              )}
            </div>
            {isValidWhatsAppPhone(loja.telefoneWhatsapp) && (
              <a
                href={`https://wa.me/${cleanPhoneNumber(loja.telefoneWhatsapp!).startsWith("55") ? cleanPhoneNumber(loja.telefoneWhatsapp!) : `55${cleanPhoneNumber(loja.telefoneWhatsapp!)}`}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <Button size="sm" className="bg-[#25D366] hover:bg-[#20BD5A] text-white gap-1.5">
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Falar conosco</span>
                </Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {loja.mensagemBoasVindas && (
        <div className="bg-primary/5 border-b">
          <div className="max-w-6xl mx-auto px-4 py-3">
            <p className="text-sm text-muted-foreground text-center italic">
              {loja.mensagemBoasVindas}
            </p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {categorias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            <button
              onClick={() => setSelectedCategoria(null)}
              className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                selectedCategoria === null
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Todos
            </button>
            {categorias.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategoria(cat.id === selectedCategoria ? null : cat.id)}
                className={`flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  selectedCategoria === cat.id
                    ? "bg-primary text-primary-foreground"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                {cat.nome}
              </button>
            ))}
          </div>
        )}

        {filteredProdutos.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">
              {search || selectedCategoria !== null
                ? "Nenhum produto encontrado para essa busca"
                : "Nenhum produto disponivel no momento"}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {filteredProdutos.map((produto) => (
              <ProductCard
                key={produto.id}
                produto={produto}
                whatsappPhone={loja.telefoneWhatsapp}
              />
            ))}
          </div>
        )}

        <div className="text-center py-6 text-xs text-muted-foreground">
          {filteredProdutos.length} {filteredProdutos.length === 1 ? "produto" : "produtos"}
          {search || selectedCategoria !== null ? " encontrados" : " disponiveis"}
        </div>
      </div>

      <footer className="border-t bg-muted/30 mt-8">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">
            Catalogo virtual de {loja.nomeNegocio}
          </p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">
            Feito com Sou Rifeiro
          </p>
        </div>
      </footer>
    </div>
  );
}
