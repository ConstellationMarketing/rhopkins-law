import "./global.css";
import { lazy, Suspense, useEffect } from "react";
import { Toaster } from "@/components/ui/toaster";
import { createRoot } from "react-dom/client";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { HelmetProvider } from "react-helmet-async";
import { SiteSettingsProvider } from "./contexts/SiteSettingsContext";
import Index from "./pages/Index";
import ScrollToTop from "./components/ScrollToTop";
import TrailingSlashEnforcer from "./components/TrailingSlashEnforcer";
import WcDniManager from "./components/layout/WcDniManager";

// Lazy-loaded routes (everything except the home page)
const AboutUs = lazy(() => import("./pages/AboutUs"));
const PracticeAreas = lazy(() => import("./pages/PracticeAreas"));
const ContactPage = lazy(() => import("./pages/ContactPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const DynamicPage = lazy(() => import("./pages/DynamicPage"));
const AdminRoutes = lazy(() => import("./pages/AdminRoutes"));
const BlogIndex = lazy(() => import("./pages/BlogIndex"));
const BlogPost = lazy(() => import("./pages/BlogPost"));
const PracticeAreaPage = lazy(() => import("./pages/PracticeAreaPage"));

const queryClient = new QueryClient();
const VITE_CHUNK_RELOAD_KEY = "vite-chunk-reload-attempted";

const App = () => {
  useEffect(() => {
    const handlePreloadError = (event: Event) => {
      const preloadEvent = event as Event & {
        payload?: { message?: string };
        preventDefault: () => void;
      };
      const hasRetried = sessionStorage.getItem(VITE_CHUNK_RELOAD_KEY) === "true";

      if (hasRetried) {
        sessionStorage.removeItem(VITE_CHUNK_RELOAD_KEY);
        return;
      }

      sessionStorage.setItem(VITE_CHUNK_RELOAD_KEY, "true");
      preloadEvent.preventDefault();
      window.location.reload();
    };

    window.addEventListener("vite:preloadError", handlePreloadError as EventListener);
    return () => {
      window.removeEventListener("vite:preloadError", handlePreloadError as EventListener);
    };
  }, []);

  return (
    <HelmetProvider>
      <QueryClientProvider client={queryClient}>
        <SiteSettingsProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <TrailingSlashEnforcer />
              <WcDniManager />
              <Suspense fallback={null}>
                <Routes>
                  <Route path="/" element={<Index />} />
                  <Route path="/about/" element={<AboutUs />} />
                  <Route path="/practice-areas/" element={<PracticeAreas />} />
                  <Route path="/practice-areas/:slug/" element={<PracticeAreaPage />} />
                  <Route path="/contact/" element={<ContactPage />} />
                  <Route path="/blog/" element={<BlogIndex />} />
                  <Route path="/blog/:slug/" element={<BlogPost />} />
                  <Route path="/admin/*" element={<AdminRoutes />} />
                  {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                  <Route path="*" element={<DynamicPage />} />
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </SiteSettingsProvider>
      </QueryClientProvider>
    </HelmetProvider>
  );
};

// Guard against HMR re-executing createRoot on the same container
const container = document.getElementById("root")!;
const root =
  (container as any).__reactRoot ??
  ((container as any).__reactRoot = createRoot(container));
root.render(<App />);
