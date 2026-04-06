import { useRef, useState } from "react";
import { Upload, X, Image as ImageIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const BASE = import.meta.env.BASE_URL.replace(/\/$/, "");

interface ImageUploaderProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  label?: string;
  aspectRatio?: "square" | "banner" | "wide";
  className?: string;
}

export function ImageUploader({ value, onChange, label, aspectRatio = "square", className = "" }: ImageUploaderProps) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const aspectClass = aspectRatio === "banner"
    ? "aspect-[3/1]"
    : aspectRatio === "wide"
      ? "aspect-[16/9]"
      : "aspect-square";

  const handleClick = () => {
    if (!uploading) inputRef.current?.click();
  };

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Selecione uma imagem (JPG, PNG, GIF, WebP)");
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError("Imagem muito grande. Maximo: 10 MB");
      return;
    }

    setError(null);
    setUploading(true);

    try {
      const metaRes = await fetch(`${BASE}/api/storage/uploads/request-url`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: file.name, size: file.size, contentType: file.type }),
        credentials: "include",
      });

      if (!metaRes.ok) {
        throw new Error("Erro ao solicitar URL de upload");
      }

      const { uploadURL, objectPath } = await metaRes.json() as { uploadURL: string; objectPath: string };

      const uploadRes = await fetch(uploadURL, {
        method: "PUT",
        headers: { "Content-Type": file.type },
        body: file,
      });

      if (!uploadRes.ok) {
        throw new Error("Erro ao fazer upload da imagem");
      }

      const servingUrl = `${BASE}/api/storage${objectPath}`;
      onChange(servingUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Erro ao fazer upload");
    } finally {
      setUploading(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className={`flex flex-col gap-2 ${className}`}>
      {label && <span className="text-sm font-medium text-foreground">{label}</span>}
      <div
        onClick={handleClick}
        className={`${aspectClass} relative rounded-lg border-2 border-dashed border-border hover:border-primary/50 transition-colors cursor-pointer overflow-hidden bg-muted/30 group`}
      >
        {value ? (
          <>
            <img
              src={value}
              alt="Preview"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
              <span className="text-white text-xs font-medium">Trocar imagem</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 text-muted-foreground">
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin" />
            ) : (
              <>
                <ImageIcon className="w-8 h-8" />
                <span className="text-xs text-center px-4">Clique para fazer upload</span>
              </>
            )}
          </div>
        )}
        {uploading && (
          <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        )}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleClick}
          disabled={uploading}
          className="gap-1.5"
        >
          <Upload className="w-3.5 h-3.5" />
          {uploading ? "Enviando..." : value ? "Trocar" : "Upload"}
        </Button>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={(e) => { e.stopPropagation(); onChange(null); }}
            className="gap-1.5 text-muted-foreground hover:text-destructive"
          >
            <X className="w-3.5 h-3.5" />
            Remover
          </Button>
        )}
      </div>

      {error && <p className="text-xs text-destructive">{error}</p>}

      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={handleFile}
      />
    </div>
  );
}
