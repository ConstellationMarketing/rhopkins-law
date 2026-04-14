import { lazy, useEffect } from "react";
import { QueryClient } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import AppProviders from "./AppProviders";
import AppRouteTree from "./AppRouteTree";
import Index from "../pages/Index";

const AboutUs = lazy(() => import("../pages/AboutUs"));
const PracticeAreas = lazy(() => import("../pages/PracticeAreas"));
const ContactPage = lazy(() => import("../pages/ContactPage"));
const DynamicPage = lazy(() => import("../pages/DynamicPage"));
const AdminRoutes = lazy(() => import("../pages/AdminRoutes"));
const BlogIndex = lazy(() => import("../pages/BlogIndex"));
const BlogPost = lazy(() => import("../pages/BlogPost"));
const PracticeAreaPage = lazy(() => import("../pages/PracticeAreaPage"));

const queryClient = new QueryClient();
const VITE_CHUNK_RELOAD_KEY = "vite-chunk-reload-attempted";

export default function BrowserApp() {
  useEffect(() => {
    const handlePreloadError = (event: Event) => {
      const preloadEvent = event as Event & {
        payload?: { message?: string };
        preventDefault: () => void;
      };
      const hasRetried =
        sessionStorage.getItem(VITE_CHUNK_RELOAD_KEY) === "true";

      if (hasRetried) {
        sessionStorage.removeItem(VITE_CHUNK_RELOAD_KEY);
        return;
      }

      sessionStorage.setItem(VITE_CHUNK_RELOAD_KEY, "true");
      preloadEvent.preventDefault();
      window.location.reload();
    };

    window.addEventListener(
      "vite:preloadError",
      handlePreloadError as EventListener,
    );
    return () => {
      window.removeEventListener(
        "vite:preloadError",
        handlePreloadError as EventListener,
      );
    };
  }, []);

  return (
    <AppProviders queryClient={queryClient}>
      <BrowserRouter>
        <AppRouteTree
          useSuspense
          components={{
            Index,
            AboutUs,
            PracticeAreas,
            PracticeAreaPage,
            ContactPage,
            BlogIndex,
            BlogPost,
            AdminRoutes,
            DynamicPage,
          }}
        />
      </BrowserRouter>
    </AppProviders>
  );
}
