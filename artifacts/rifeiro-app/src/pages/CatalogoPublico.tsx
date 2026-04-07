import { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Search, ShoppingBag, MapPin, MessageCircle, Store, ArrowLeft, Package,
  ChevronLeft, ChevronRight, ShoppingCart, Plus, Minus, X, Trash2, CheckCheck,
} from "lucide-react";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface Loja {
  nomeNegocio: string;
  logoUrl: string | null;
  bannerPrincipalUrl: string | null;
  corPrincipal: string | null;
  corSecundaria: string | null;
  descricao: string | null;
  cidade: string | null;
  estado: string | null;
  telefoneWhatsapp: string | null;
  mensagemBoasVindas: string | null;
}

interface Banner {
  id: number;
  imageUrl: string;
  titulo: string | null;
  linkUrl: string | null;
  ordem: number;
}

interface Categoria {
  id: number;
  nome: string;
  cor: string | null;
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
  banners: Banner[];
  categorias: Categoria[];
  produtos: Produto[];
}

interface CartItem {
  produto: Produto;
  quantidade: number;
}

// ── Formatters ──────────────────────────────────────────────────────────────

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

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(37,99,235,${alpha})`;
  return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`;
}

function buildCartWhatsAppUrl(phone: string, lojaNome: string, items: CartItem[]): string {
  const cleanPhone = cleanPhoneNumber(phone);
  const phoneWithCountry = cleanPhone.startsWith("55") ? cleanPhone : `55${cleanPhone}`;

  const linhas = items.map((item) => {
    const subtotal = formatCurrency(item.produto.precoVenda * item.quantidade);
    return `• ${item.quantidade}x ${item.produto.nome} — ${subtotal}`;
  });

  const total = items.reduce((acc, item) => acc + item.produto.precoVenda * item.quantidade, 0);

  const message = [
    `Ola, ${lojaNome}! Gostaria de fazer um pedido:`,
    ``,
    `*MEUS PRODUTOS:*`,
    ...linhas,
    ``,
    `*Total: ${formatCurrency(total)}*`,
    ``,
    `Podemos finalizar?`,
  ].join("\n");

  return `https://wa.me/${phoneWithCountry}?text=${encodeURIComponent(message)}`;
}

// ── Static Views ─────────────────────────────────────────────────────────────

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
      <Skeleton className="h-48 md:h-64 w-full rounded-none" />
      <div className="max-w-6xl mx-auto px-4 py-6 space-y-4">
        <Skeleton className="h-10 w-full" />
        <div className="flex gap-2">
          {Array.from({ length: 4 }).map((_, i) => <Skeleton key={i} className="h-8 w-20 rounded-full" />)}
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

// ── Banner Carousel ──────────────────────────────────────────────────────────

function BannerCarousel({ banners, corPrincipal }: { banners: Banner[]; corPrincipal: string | null }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const primaryColor = corPrincipal || "#2563eb";

  const goTo = useCallback((index: number) => {
    setCurrentIndex(((index % banners.length) + banners.length) % banners.length);
  }, [banners.length]);

  const goPrev = () => goTo(currentIndex - 1);
  const goNext = useCallback(() => goTo(currentIndex + 1), [currentIndex, goTo]);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(goNext, 4500);
    return () => clearInterval(timer);
  }, [banners.length, goNext]);

  if (banners.length === 0) return null;

  return (
    <div className="relative overflow-hidden bg-black">
      <div
        className="flex transition-transform duration-500 ease-in-out"
        style={{ transform: `translateX(-${currentIndex * 100}%)`, width: `${banners.length * 100}%` }}
      >
        {banners.map((banner) => {
          const itemStyle = { width: `${100 / banners.length}%`, flexShrink: 0 as const };
          const inner = (
            <>
              <img src={banner.imageUrl} alt={banner.titulo || "Banner"} className="w-full h-52 md:h-80 object-cover" />
              {banner.titulo && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-4">
                  <p className="text-white font-semibold text-sm md:text-base drop-shadow">{banner.titulo}</p>
                </div>
              )}
            </>
          );
          return banner.linkUrl ? (
            <a key={banner.id} href={banner.linkUrl} target="_blank" rel="noopener noreferrer" className="relative block" style={itemStyle}>
              {inner}
            </a>
          ) : (
            <div key={banner.id} className="relative" style={itemStyle}>
              {inner}
            </div>
          );
        })}
      </div>

      {banners.length > 1 && (
        <>
          <button onClick={goPrev} className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors" aria-label="Anterior">
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button onClick={goNext} className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors" aria-label="Proximo">
            <ChevronRight className="w-5 h-5" />
          </button>
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 flex gap-1.5">
            {banners.map((_, idx) => (
              <button
                key={idx}
                onClick={() => goTo(idx)}
                className="w-2 h-2 rounded-full transition-all duration-200"
                style={{
                  backgroundColor: idx === currentIndex ? primaryColor : "rgba(255,255,255,0.5)",
                  transform: idx === currentIndex ? "scale(1.25)" : "scale(1)",
                }}
                aria-label={`Ir para slide ${idx + 1}`}
              />
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ── Product Card ─────────────────────────────────────────────────────────────

function ProductCard({
  produto,
  corPrincipal,
  quantidadeNoCarrinho,
  onAdd,
  onRemove,
}: {
  produto: Produto;
  corPrincipal: string | null;
  quantidadeNoCarrinho: number;
  onAdd: (produto: Produto) => void;
  onRemove: (produtoId: number) => void;
}) {
  const primaryColor = corPrincipal || "#2563eb";
  const esgotado = produto.estoque <= 0;

  return (
    <div className="group rounded-xl border bg-card overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 flex flex-col">
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
        {esgotado && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded-full">Esgotado</span>
          </div>
        )}
        {quantidadeNoCarrinho > 0 && (
          <div
            className="absolute top-2 right-2 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold shadow"
            style={{ backgroundColor: primaryColor }}
          >
            {quantidadeNoCarrinho}
          </div>
        )}
      </div>

      <div className="p-3 space-y-2 flex-1 flex flex-col">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">{produto.nome}</h3>
        {produto.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2">{produto.descricao}</p>
        )}
        <div className="flex-1" />
        <div className="pt-1">
          <span className="text-lg font-bold" style={{ color: primaryColor }}>
            {formatCurrency(produto.precoVenda)}
          </span>
        </div>

        {!esgotado && (
          quantidadeNoCarrinho === 0 ? (
            <button
              onClick={() => onAdd(produto)}
              className="flex items-center justify-center gap-2 w-full rounded-lg text-white text-sm font-medium py-2.5 transition-all active:scale-95"
              style={{ backgroundColor: primaryColor }}
            >
              <Plus className="w-4 h-4" />
              Adicionar
            </button>
          ) : (
            <div className="flex items-center justify-between gap-2">
              <button
                onClick={() => onRemove(produto.id)}
                className="w-9 h-9 rounded-lg border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
              >
                <Minus className="w-4 h-4" />
              </button>
              <span className="flex-1 text-center font-semibold text-sm" style={{ color: primaryColor }}>
                {quantidadeNoCarrinho}
              </span>
              <button
                onClick={() => onAdd(produto)}
                className="w-9 h-9 rounded-lg flex items-center justify-center text-white transition-all active:scale-95"
                style={{ backgroundColor: primaryColor }}
              >
                <Plus className="w-4 h-4" />
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ── Cart Drawer ───────────────────────────────────────────────────────────────

function CartDrawer({
  isOpen,
  onClose,
  cart,
  loja,
  corPrincipal,
  onAdd,
  onRemove,
  onRemoveAll,
  onClear,
}: {
  isOpen: boolean;
  onClose: () => void;
  cart: CartItem[];
  loja: Loja;
  corPrincipal: string;
  onAdd: (produto: Produto) => void;
  onRemove: (produtoId: number) => void;
  onRemoveAll: (produtoId: number) => void;
  onClear: () => void;
}) {
  const total = cart.reduce((acc, item) => acc + item.produto.precoVenda * item.quantidade, 0);
  const totalItens = cart.reduce((acc, item) => acc + item.quantidade, 0);
  const canFinish = isValidWhatsAppPhone(loja.telefoneWhatsapp) && cart.length > 0;

  function handleFinish() {
    if (!canFinish) return;
    const url = buildCartWhatsAppUrl(loja.telefoneWhatsapp!, loja.nomeNegocio, cart);
    window.open(url, "_blank", "noopener,noreferrer");
  }

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-40 transition-opacity"
          onClick={onClose}
        />
      )}

      <div
        className={`fixed bottom-0 left-0 right-0 md:right-0 md:left-auto md:top-0 md:bottom-0 md:w-96 bg-background z-50 flex flex-col shadow-2xl transition-transform duration-300 ease-in-out rounded-t-2xl md:rounded-none`}
        style={{
          transform: isOpen ? "translateY(0)" : "translateY(100%)",
          maxHeight: "85dvh",
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-4 border-b flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5" style={{ color: corPrincipal }} />
            <span className="font-bold text-foreground">Meu carrinho</span>
            <span
              className="text-xs font-semibold text-white px-1.5 py-0.5 rounded-full"
              style={{ backgroundColor: corPrincipal }}
            >
              {totalItens}
            </span>
          </div>
          <div className="flex items-center gap-2">
            {cart.length > 0 && (
              <button
                onClick={onClear}
                className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1 transition-colors"
              >
                <Trash2 className="w-3 h-3" />
                Limpar
              </button>
            )}
            <button
              onClick={onClose}
              className="w-8 h-8 rounded-full hover:bg-muted flex items-center justify-center transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Items */}
        <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 gap-3">
              <ShoppingCart className="w-12 h-12 text-muted-foreground/30" />
              <p className="text-muted-foreground text-sm">Seu carrinho esta vazio</p>
              <button
                onClick={onClose}
                className="text-sm font-medium underline underline-offset-2"
                style={{ color: corPrincipal }}
              >
                Continuar comprando
              </button>
            </div>
          ) : (
            cart.map((item) => (
              <div key={item.produto.id} className="flex items-center gap-3 bg-muted/30 rounded-xl p-3">
                <div className="w-14 h-14 rounded-lg overflow-hidden bg-muted flex-shrink-0">
                  {item.produto.imagemUrl ? (
                    <img src={item.produto.imagemUrl} alt={item.produto.nome} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Package className="w-6 h-6 text-muted-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium leading-tight line-clamp-1">{item.produto.nome}</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {formatCurrency(item.produto.precoVenda)} cada
                  </p>
                  <p className="text-sm font-bold mt-1" style={{ color: corPrincipal }}>
                    {formatCurrency(item.produto.precoVenda * item.quantidade)}
                  </p>
                </div>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => onRemove(item.produto.id)}
                      className="w-7 h-7 rounded-md border flex items-center justify-center text-muted-foreground hover:bg-muted transition-colors"
                    >
                      <Minus className="w-3 h-3" />
                    </button>
                    <span className="w-6 text-center text-sm font-semibold">{item.quantidade}</span>
                    <button
                      onClick={() => onAdd(item.produto)}
                      className="w-7 h-7 rounded-md flex items-center justify-center text-white transition-all"
                      style={{ backgroundColor: corPrincipal }}
                    >
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => onRemoveAll(item.produto.id)}
                    className="text-destructive/70 hover:text-destructive transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        {cart.length > 0 && (
          <div className="border-t px-4 py-4 space-y-3 flex-shrink-0">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{totalItens} {totalItens === 1 ? "item" : "itens"}</span>
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total</p>
                <p className="text-xl font-bold" style={{ color: corPrincipal }}>{formatCurrency(total)}</p>
              </div>
            </div>

            {canFinish ? (
              <button
                onClick={handleFinish}
                className="w-full py-3.5 rounded-xl text-white font-semibold flex items-center justify-center gap-2 text-sm transition-all active:scale-[0.98] shadow-md"
                style={{ backgroundColor: "#25D366" }}
              >
                <CheckCheck className="w-5 h-5" />
                Finalizar pedido via WhatsApp
              </button>
            ) : (
              <div className="w-full py-3.5 rounded-xl bg-muted text-muted-foreground text-sm text-center font-medium">
                WhatsApp nao disponivel
              </div>
            )}
          </div>
        )}
      </div>
    </>
  );
}

// ── Main Page ─────────────────────────────────────────────────────────────────

export default function CatalogoPublico() {
  const params = useParams<{ slug: string }>();
  const slug = params.slug;
  const [data, setData] = useState<CatalogoData | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [serverError, setServerError] = useState(false);
  const [search, setSearch] = useState("");
  const [selectedCategoria, setSelectedCategoria] = useState<number | null>(null);

  // Cart state
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  const fetchCatalog = useCallback((isRefresh = false) => {
    if (!slug) return;
    if (!isRefresh) {
      setLoading(true);
      setNotFound(false);
      setServerError(false);
    }

    fetch(`${BASE}/api/catalogo/${encodeURIComponent(slug)}`)
      .then((res) => {
        if (res.status === 404) { setNotFound(true); setLoading(false); return null; }
        if (!res.ok) { if (!isRefresh) setServerError(true); setLoading(false); return null; }
        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
        setLoading(false);
      })
      .catch(() => { if (!isRefresh) setServerError(true); setLoading(false); });
  }, [slug]);

  useEffect(() => { fetchCatalog(); }, [fetchCatalog]);
  useEffect(() => {
    if (!data || notFound || serverError) return;
    const interval = setInterval(() => fetchCatalog(true), 60000);
    return () => clearInterval(interval);
  }, [fetchCatalog, data, notFound, serverError]);

  // Cart helpers
  function addToCart(produto: Produto) {
    setCart((prev) => {
      const existing = prev.find((i) => i.produto.id === produto.id);
      if (existing) return prev.map((i) => i.produto.id === produto.id ? { ...i, quantidade: i.quantidade + 1 } : i);
      return [...prev, { produto, quantidade: 1 }];
    });
  }

  function removeFromCart(produtoId: number) {
    setCart((prev) => {
      const existing = prev.find((i) => i.produto.id === produtoId);
      if (!existing) return prev;
      if (existing.quantidade <= 1) return prev.filter((i) => i.produto.id !== produtoId);
      return prev.map((i) => i.produto.id === produtoId ? { ...i, quantidade: i.quantidade - 1 } : i);
    });
  }

  function removeAllFromCart(produtoId: number) {
    setCart((prev) => prev.filter((i) => i.produto.id !== produtoId));
  }

  function clearCart() {
    setCart([]);
  }

  if (loading) return <LoadingSkeleton />;
  if (notFound) return <LojaNotFound />;
  if (serverError || !data) return <ServerErrorView onRetry={() => fetchCatalog()} />;

  const { loja, banners, categorias, produtos } = data;
  const primaryColor = loja.corPrincipal || "#2563eb";
  const totalItensCarrinho = cart.reduce((acc, i) => acc + i.quantidade, 0);
  const totalCarrinho = cart.reduce((acc, i) => acc + i.produto.precoVenda * i.quantidade, 0);

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

      {/* Header */}
      <header className="relative overflow-hidden">
        {loja.bannerPrincipalUrl ? (
          <img src={loja.bannerPrincipalUrl} alt="Banner" className="w-full h-44 md:h-64 object-cover" />
        ) : (
          <div
            className="w-full h-32 md:h-48"
            style={{ background: `linear-gradient(135deg, ${primaryColor} 0%, ${hexToRgba(primaryColor, 0.7)} 100%)` }}
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/20 to-transparent" />
        <div className="absolute bottom-0 left-0 right-0 px-4 pb-4">
          <div className="max-w-6xl mx-auto flex items-end gap-3">
            {loja.logoUrl ? (
              <img
                src={loja.logoUrl}
                alt={loja.nomeNegocio}
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl object-cover border-2 border-white/80 shadow-md flex-shrink-0"
              />
            ) : (
              <div
                className="w-16 h-16 md:w-20 md:h-20 rounded-xl flex items-center justify-center flex-shrink-0 border-2 border-white/80 shadow-md"
                style={{ backgroundColor: primaryColor }}
              >
                <ShoppingBag className="w-7 h-7 md:w-9 md:h-9 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0 pb-1">
              <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow truncate">{loja.nomeNegocio}</h1>
              {location && (
                <p className="text-white/80 text-xs flex items-center gap-1 mt-0.5">
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
                <Button size="sm" className="gap-1.5 text-white shadow-md" style={{ backgroundColor: "#25D366" }}>
                  <MessageCircle className="w-4 h-4" />
                  <span className="hidden sm:inline">Falar conosco</span>
                </Button>
              </a>
            )}
          </div>
        </div>
      </header>

      {banners.length > 0 && (
        <BannerCarousel banners={banners} corPrincipal={loja.corPrincipal} />
      )}

      {(loja.mensagemBoasVindas || loja.descricao) && (
        <div className="border-b" style={{ backgroundColor: hexToRgba(primaryColor, 0.05) }}>
          <div className="max-w-6xl mx-auto px-4 py-3 space-y-1 text-center">
            {loja.mensagemBoasVindas && (
              <p className="text-sm font-medium text-foreground/90 italic">{loja.mensagemBoasVindas}</p>
            )}
            {loja.descricao && (
              <p className="text-xs text-muted-foreground">{loja.descricao}</p>
            )}
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4 pb-28">
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar produtos..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Category filter pills */}
        {categorias.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 -mx-4 px-4 scrollbar-hide">
            <button
              onClick={() => setSelectedCategoria(null)}
              className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-colors border"
              style={selectedCategoria === null
                ? { backgroundColor: primaryColor, color: "#fff", borderColor: primaryColor }
                : { backgroundColor: "transparent", color: "#6b7280", borderColor: "#e5e7eb" }
              }
            >
              Todos
            </button>
            {categorias.map((cat) => {
              const isSelected = selectedCategoria === cat.id;
              const catColor = cat.cor || primaryColor;
              return (
                <button
                  key={cat.id}
                  onClick={() => setSelectedCategoria(isSelected ? null : cat.id)}
                  className="flex-shrink-0 px-3 py-1.5 rounded-full text-sm font-medium transition-all border flex items-center gap-1.5"
                  style={isSelected
                    ? { backgroundColor: catColor, color: "#fff", borderColor: catColor }
                    : { backgroundColor: hexToRgba(catColor, 0.08), color: catColor, borderColor: hexToRgba(catColor, 0.3) }
                  }
                >
                  <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.8)" : catColor }} />
                  {cat.nome}
                </button>
              );
            })}
          </div>
        )}

        {/* Product grid */}
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
            {filteredProdutos.map((produto) => {
              const cartItem = cart.find((i) => i.produto.id === produto.id);
              return (
                <ProductCard
                  key={produto.id}
                  produto={produto}
                  corPrincipal={loja.corPrincipal}
                  quantidadeNoCarrinho={cartItem?.quantidade ?? 0}
                  onAdd={addToCart}
                  onRemove={removeFromCart}
                />
              );
            })}
          </div>
        )}

        <div className="text-center py-4 text-xs text-muted-foreground">
          {filteredProdutos.length} {filteredProdutos.length === 1 ? "produto" : "produtos"}
          {search || selectedCategoria !== null ? " encontrados" : " disponiveis"}
        </div>
      </div>

      <footer className="border-t bg-muted/30 mt-4">
        <div className="max-w-6xl mx-auto px-4 py-6 text-center">
          <p className="text-xs text-muted-foreground">Catalogo virtual de {loja.nomeNegocio}</p>
          <p className="text-[10px] text-muted-foreground/60 mt-1">Feito com Sou Rifeiro</p>
        </div>
      </footer>

      {/* Floating cart button */}
      {totalItensCarrinho > 0 && (
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-30">
          <button
            onClick={() => setCartOpen(true)}
            className="flex items-center gap-3 px-5 py-3.5 rounded-2xl text-white shadow-xl transition-all active:scale-95 hover:shadow-2xl"
            style={{ backgroundColor: primaryColor }}
          >
            <div className="relative">
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-2 -right-2 w-4 h-4 rounded-full bg-white text-[10px] font-bold flex items-center justify-center" style={{ color: primaryColor }}>
                {totalItensCarrinho}
              </span>
            </div>
            <div className="text-left">
              <p className="text-xs opacity-90 leading-none">Ver carrinho</p>
              <p className="text-sm font-bold leading-tight mt-0.5">{formatCurrency(totalCarrinho)}</p>
            </div>
          </button>
        </div>
      )}

      {/* Cart Drawer */}
      <CartDrawer
        isOpen={cartOpen}
        onClose={() => setCartOpen(false)}
        cart={cart}
        loja={loja}
        corPrincipal={primaryColor}
        onAdd={addToCart}
        onRemove={removeFromCart}
        onRemoveAll={removeAllFromCart}
        onClear={clearCart}
      />
    </div>
  );
}
