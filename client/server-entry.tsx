import { QueryClient } from "@tanstack/react-query";
import { renderToString } from "react-dom/server";
import { StaticRouter } from "react-router-dom/server";
import AppProviders from "./app/AppProviders";
import AppRouteTree from "./app/AppRouteTree";
import { type CmsPreloadedState, setServerPreloadedState } from "./lib/cms/preloadedState";
import Index from "./pages/Index";
import AboutUs from "./pages/AboutUs";
import PracticeAreas from "./pages/PracticeAreas";
import PracticeAreaPage from "./pages/PracticeAreaPage";
import ContactPage from "./pages/ContactPage";
import BlogIndex from "./pages/BlogIndex";
import BlogPost from "./pages/BlogPost";
import AdminRoutes from "./pages/AdminRoutes";
import DynamicPage from "./pages/DynamicPage";

interface RenderCmsPageResult {
  html: string;
  helmetContext: Record<string, unknown>;
}

export function renderCmsPage(
  urlPath: string,
  preloadedState: CmsPreloadedState,
): RenderCmsPageResult {
  const queryClient = new QueryClient();
  const helmetContext: Record<string, unknown> = {};

  try {
    setServerPreloadedState(preloadedState);

    const html = renderToString(
      <AppProviders queryClient={queryClient} helmetContext={helmetContext}>
        <StaticRouter location={urlPath}>
          <AppRouteTree
            useSuspense={false}
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
        </StaticRouter>
      </AppProviders>,
    );

    return { html, helmetContext };
  } finally {
    setServerPreloadedState(null);
    queryClient.clear();
  }
}
