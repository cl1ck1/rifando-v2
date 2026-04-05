import React, { useState } from "react";
import { Link } from "wouter";
import { Sidebar } from "./Sidebar";
import { Button } from "@/components/ui/button";
import { Menu, Settings, Sun, Moon } from "lucide-react";
import { useTheme } from "@/hooks/use-theme";

export function DashboardLayout({ children }: { children: React.ReactNode }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { theme, toggle } = useTheme();

  return (
    <div className="min-h-[100dvh] bg-muted/30">
      <Sidebar open={sidebarOpen} setOpen={setSidebarOpen} />

      <div className="lg:pl-64 flex flex-col min-h-[100dvh]">
        <header className="h-14 flex items-center justify-between px-4 border-b bg-card/80 backdrop-blur-sm sticky top-0 z-30">
          <div className="flex items-center gap-3 lg:hidden">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(true)}>
              <Menu className="w-5 h-5" />
            </Button>
            <span className="font-bold text-base text-primary">Sou Rifeiro</span>
          </div>

          <div className="hidden lg:block" />

          <div className="flex items-center gap-1 ml-auto">
            <Link href="/configuracoes">
              <Button variant="ghost" size="icon" title="Configuracoes">
                <Settings className="w-4 h-4" />
              </Button>
            </Link>
            <Button variant="ghost" size="icon" onClick={toggle} title={theme === "dark" ? "Tema claro" : "Tema escuro"}>
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
            </Button>
          </div>
        </header>

        <main className="flex-1 p-6 lg:p-8 w-full max-w-7xl mx-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
