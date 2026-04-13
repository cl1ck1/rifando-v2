import React from "react";
import { Link, useLocation } from "wouter";
import {
  LayoutDashboard,
  ShoppingBag,
  Users,
  CalendarCheck,
  Package,
  Settings,
  LogOut,
  X,
  MapPin,
  Palette,
  Bell
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useClerk, useUser } from "@clerk/react";

const isDemoMode = !import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;

const navItems = [
  { name: "Painel", href: "/painel", icon: LayoutDashboard },
  { name: "Vendas", href: "/vendas", icon: ShoppingBag },
  { name: "Rotas", href: "/rotas", icon: MapPin },
  { name: "Clientes", href: "/clientes", icon: Users },
  { name: "Parcelas", href: "/parcelas", icon: CalendarCheck },
  { name: "Cobranças", href: "/cobrancas", icon: Bell },
  { name: "Produtos", href: "/catalogo", icon: Package },
];

function ClerkUserSection() {
  const { signOut } = useClerk();
  const { user } = useUser();

  const handleSignOut = () => {
    signOut({ redirectUrl: "/" });
  };

  return (
    <div className="mt-4 pt-4 border-t border-sidebar-border flex items-center gap-3">
      <Avatar className="w-10 h-10 border border-border">
        <AvatarImage src={user?.imageUrl} />
        <AvatarFallback>{user?.firstName?.charAt(0) || "U"}</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">
          {user?.fullName || "Usuario"}
        </p>
        <p className="text-xs text-muted-foreground truncate">
          {user?.primaryEmailAddress?.emailAddress}
        </p>
      </div>
      <Button variant="ghost" size="icon" onClick={handleSignOut} title="Sair" className="shrink-0 text-muted-foreground hover:text-destructive">
        <LogOut className="w-5 h-5" />
      </Button>
    </div>
  );
}

function DemoUserSection() {
  return (
    <div className="mt-4 pt-4 border-t border-sidebar-border flex items-center gap-3">
      <Avatar className="w-10 h-10 border border-border">
        <AvatarFallback>D</AvatarFallback>
      </Avatar>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">Demo</p>
        <p className="text-xs text-muted-foreground truncate">demo@rifando.com</p>
      </div>
    </div>
  );
}

export function Sidebar({ open, setOpen }: { open: boolean; setOpen: (open: boolean) => void }) {
  const [location] = useLocation();

  return (
    <>
      {open && (
        <div 
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 bg-sidebar border-r border-sidebar-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 flex flex-col ${
          open ? "translate-x-0" : "-translate-x-full"
        }`}
      >
        <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
          <Link href="/painel" className="flex items-center gap-2 font-bold text-xl text-primary">
            <ShoppingBag className="w-6 h-6" />
            <span>Sou Rifeiro</span>
          </Link>
          <Button variant="ghost" size="icon" className="lg:hidden" onClick={() => setOpen(false)}>
            <X className="w-5 h-5" />
          </Button>
        </div>

        <nav className="flex-1 overflow-y-auto py-6 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive = location === item.href || (item.href !== "/painel" && location.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
                  isActive 
                    ? "bg-sidebar-primary text-sidebar-primary-foreground" 
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                }`}
                onClick={() => setOpen(false)}
              >
                <item.icon className="w-5 h-5" />
                {item.name}
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-sidebar-border">
          <Link
            href="/personalizacao"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors ${
              location.startsWith("/personalizacao")
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
            onClick={() => setOpen(false)}
          >
            <Palette className="w-5 h-5" />
            Personalizacao
          </Link>
          <Link
            href="/configuracoes"
            className={`flex items-center gap-3 px-3 py-2.5 rounded-md text-sm font-medium transition-colors mt-1 ${
              location.startsWith("/configuracoes")
                ? "bg-sidebar-primary text-sidebar-primary-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
            }`}
            onClick={() => setOpen(false)}
          >
            <Settings className="w-5 h-5" />
            Configuracoes
          </Link>

          {isDemoMode ? <DemoUserSection /> : <ClerkUserSection />}
        </div>
      </aside>
    </>
  );
}
