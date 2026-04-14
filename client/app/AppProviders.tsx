import type { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { HelmetProvider } from "../lib/helmet";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SiteSettingsProvider } from "../contexts/SiteSettingsContext";
import GlobalScripts from "../components/layout/GlobalScripts";

interface AppProvidersProps {
  children: ReactNode;
  queryClient: QueryClient;
  helmetContext?: Record<string, unknown>;
}

export default function AppProviders({
  children,
  queryClient,
  helmetContext,
}: AppProvidersProps) {
  return (
    <HelmetProvider context={helmetContext}>
      <QueryClientProvider client={queryClient}>
        <SiteSettingsProvider>
          <GlobalScripts />
          <TooltipProvider>
            <Toaster />
            <Sonner />
            {children}
          </TooltipProvider>
        </SiteSettingsProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
}
