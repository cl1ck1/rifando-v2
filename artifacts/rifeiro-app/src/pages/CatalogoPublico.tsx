import { useState, useEffect } from "react";
import { useParams, Link } from "wouter";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Search, ShoppingBag, MapPin, MessageCircle, Store, ArrowLeft, Package, ChevronLeft, ChevronRight } from "lucide-react";

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

function hexToRgba(hex: string, alpha: number): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(37,99,235,${alpha})`;
  return `rgba(${parseInt(result[1], 16)},${parseInt(result[2], 16)},${parseInt(result[3], 16)},${alpha})`;
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

function BannerCarousel({ banners, corPrincipal }: { banners: Banner[]; corPrincipal: string | null }) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const primaryColor = corPrincipal || "#2563eb";

  const goTo = (index: number) => setCurrentIndex(((index % banners.length) + banners.length) % banners.length);
  const goPrev = () => goTo(currentIndex - 1);
  const goNext = () => goTo(currentIndex + 1);

  useEffect(() => {
    if (banners.length <= 1) return;
    const timer = setInterval(goNext, 4500);
    return () => clearInterval(timer);
  }, [banners.length, currentIndex]);

  if (banners.length === 0) return null;

  const current = banners[currentIndex];

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
          <button
            onClick={goPrev}
            className="absolute left-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            aria-label="Anterior"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            onClick={goNext}
            className="absolute right-2 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center transition-colors"
            aria-label="Proximo"
          >
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

function ProductCard({ produto, whatsappPhone, corPrincipal }: { produto: Produto; whatsappPhone: string | null; corPrincipal: string | null }) {
  const primaryColor = corPrincipal || "#2563eb";

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
        {produto.estoque <= 0 && (
          <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] flex items-center justify-center">
            <span className="bg-destructive text-destructive-foreground text-xs font-semibold px-2 py-1 rounded-full">Esgotado</span>
          </div>
        )}
      </div>

      <div className="p-3 space-y-2">
        <h3 className="font-semibold text-sm leading-tight line-clamp-2 text-foreground">{produto.nome}</h3>
        {produto.descricao && (
          <p className="text-xs text-muted-foreground line-clamp-2">{produto.descricao}</p>
        )}
        <div className="pt-1">
          <span className="text-lg font-bold" style={{ color: primaryColor }}>
            {formatCurrency(produto.precoVenda)}
          </span>
        </div>
        {isValidWhatsAppPhone(whatsappPhone) && produto.estoque > 0 && (
          <a
            href={buildWhatsAppUrl(whatsappPhone!, produto.nome, produto.precoVenda)}
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
        if (res.status === 404) { setNotFound(true); setLoading(false); return null; }
        if (!res.ok) { if (!isRefresh) setServerError(true); setLoading(false); return null; }
        return res.json();
      })
      .then((json) => {
        if (json) setData(json);
        setLoading(false);
      })
      .catch(() => { if (!isRefresh) setServerError(true); setLoading(false); });
  };

  useEffect(() => { fetchCatalog(); }, [slug]);
  useEffect(() => {
    if (!data || notFound || serverError) return;
    const interval = setInterval(() => fetchCatalog(true), 60000);
    return () => clearInterval(interval);
  }, [slug, data, notFound, serverError]);

  if (loading) return <LoadingSkeleton />;
  if (notFound) return <LojaNotFound />;
  if (serverError || !data) return <ServerErrorView onRetry={() => fetchCatalog()} />;

  const { loja, banners, categorias, produtos } = data;
  const primaryColor = loja.corPrincipal || "#2563eb";

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
              <h1 className="text-xl md:text-2xl font-bold text-white drop-shadow truncate">
                {loja.nomeNegocio}
              </h1>
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

      <div className="max-w-6xl mx-auto px-4 py-4 space-y-4">
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
                  <span
                    className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ backgroundColor: isSelected ? "rgba(255,255,255,0.8)" : catColor }}
                  />
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
            {filteredProdutos.map((produto) => (
              <ProductCard
                key={produto.id}
                produto={produto}
                whatsappPhone={loja.telefoneWhatsapp}
                corPrincipal={loja.corPrincipal}
              />
            ))}
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
    </div>
  );
}
