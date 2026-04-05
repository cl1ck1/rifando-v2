import { useEffect, useRef } from "react";
import { Switch, Route, Redirect, useLocation, Router as WouterRouter } from "wouter";
import { QueryClientProvider, useQueryClient } from "@tanstack/react-query";
import { ClerkProvider, SignIn, SignUp, Show, useClerk } from "@clerk/react";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { queryClient } from "@/lib/queryClient";
import NotFound from "@/pages/not-found";
import { DashboardLayout } from "@/components/layout/DashboardLayout";

import Home from "@/pages/Home";
import Painel from "@/pages/Painel";
import Vendas from "@/pages/Vendas";
import VendaDetail from "@/pages/VendaDetail";
import Clientes from "@/pages/Clientes";
import ClienteDetail from "@/pages/ClienteDetail";
import Parcelas from "@/pages/Parcelas";
import Catalogo from "@/pages/Catalogo";
import Configuracoes from "@/pages/Configuracoes";
import CatalogoPublico from "@/pages/CatalogoPublico";
import Rotas from "@/pages/Rotas";
import RotaDetail from "@/pages/RotaDetail";

const clerkPubKey = import.meta.env.VITE_CLERK_PUBLISHABLE_KEY;
const clerkProxyUrl = import.meta.env.VITE_CLERK_PROXY_URL;
const basePath = import.meta.env.BASE_URL.replace(/\/$/, "");

function stripBase(path: string): string {
  return basePath && path.startsWith(basePath)
    ? path.slice(basePath.length) || "/"
    : path;
}

if (!clerkPubKey) {
  throw new Error("Missing VITE_CLERK_PUBLISHABLE_KEY in .env file");
}

function SignInPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/30 p-4">
      <SignIn routing="path" path={`${basePath}/sign-in`} signUpUrl={`${basePath}/sign-up`} forceRedirectUrl={`${basePath}/painel`} />
    </div>
  );
}

function SignUpPage() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-muted/30 p-4">
      <SignUp routing="path" path={`${basePath}/sign-up`} signInUrl={`${basePath}/sign-in`} forceRedirectUrl={`${basePath}/painel`} />
    </div>
  );
}

function HomeRedirect() {
  return (
    <>
      <Show when="signed-in">
        <Redirect to="/painel" />
      </Show>
      <Show when="signed-out">
        <Home />
      </Show>
    </>
  );
}

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  return (
    <>
      <Show when="signed-in">
        <DashboardLayout>
          <Component />
        </DashboardLayout>
      </Show>
      <Show when="signed-out">
        <Redirect to="/sign-in" />
      </Show>
    </>
  );
}

function ClerkQueryClientCacheInvalidator() {
  const { addListener } = useClerk();
  const qc = useQueryClient();
  const prevUserIdRef = useRef<string | null | undefined>(undefined);

  useEffect(() => {
    const unsubscribe = addListener(({ user }) => {
      const userId = user?.id ?? null;
      if (
        prevUserIdRef.current !== undefined &&
        prevUserIdRef.current !== userId
      ) {
        qc.clear();
      }
      prevUserIdRef.current = userId;
    });
    return unsubscribe;
  }, [addListener, qc]);

  return null;
}

function AppRouter() {
  const [, setLocation] = useLocation();

  return (
    <ClerkProvider
      publishableKey={clerkPubKey}
      proxyUrl={clerkProxyUrl}
      routerPush={(to) => setLocation(stripBase(to))}
      routerReplace={(to) => setLocation(stripBase(to), { replace: true })}
    >
      <QueryClientProvider client={queryClient}>
        <ClerkQueryClientCacheInvalidator />
        <TooltipProvider>
          <Switch>
            <Route path="/" component={HomeRedirect} />
            <Route path="/sign-in/*?" component={SignInPage} />
            <Route path="/sign-up/*?" component={SignUpPage} />
            
            <Route path="/painel" component={() => <ProtectedRoute component={Painel} />} />
            <Route path="/vendas" component={() => <ProtectedRoute component={Vendas} />} />
            <Route path="/vendas/:id" component={() => <ProtectedRoute component={VendaDetail} />} />
            <Route path="/clientes" component={() => <ProtectedRoute component={Clientes} />} />
            <Route path="/clientes/:id" component={() => <ProtectedRoute component={ClienteDetail} />} />
            <Route path="/rotas" component={() => <ProtectedRoute component={Rotas} />} />
            <Route path="/rotas/:id" component={() => <ProtectedRoute component={RotaDetail} />} />
            <Route path="/parcelas" component={() => <ProtectedRoute component={Parcelas} />} />
            <Route path="/catalogo" component={() => <ProtectedRoute component={Catalogo} />} />
            <Route path="/configuracoes" component={() => <ProtectedRoute component={Configuracoes} />} />

            <Route path="/catalogo/:slug" component={CatalogoPublico} />

            <Route component={NotFound} />
          </Switch>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ClerkProvider>
  );
}

function App() {
  return (
    <WouterRouter base={basePath}>
      <AppRouter />
    </WouterRouter>
  );
}

export default App;
