import { Suspense, type ComponentType } from "react";
import { Route, Routes } from "react-router-dom";
import ScrollToTop from "../components/ScrollToTop";
import TrailingSlashEnforcer from "../components/TrailingSlashEnforcer";
import WcDniManager from "../components/layout/WcDniManager";

export interface AppRouteComponents {
  Index: ComponentType;
  AboutUs: ComponentType;
  PracticeAreas: ComponentType;
  PracticeAreaPage: ComponentType;
  ContactPage: ComponentType;
  BlogIndex: ComponentType;
  BlogPost: ComponentType;
  AdminRoutes: ComponentType;
  DynamicPage: ComponentType;
}

interface AppRouteTreeProps {
  components: AppRouteComponents;
  useSuspense: boolean;
}

export default function AppRouteTree({
  components,
  useSuspense,
}: AppRouteTreeProps) {
  const routeTree = (
    <Routes>
      <Route path="/" element={<components.Index />} />
      <Route path="/about/" element={<components.AboutUs />} />
      <Route path="/practice-areas/" element={<components.PracticeAreas />} />
      <Route
        path="/practice-areas/:slug/"
        element={<components.PracticeAreaPage />}
      />
      <Route path="/contact/" element={<components.ContactPage />} />
      <Route path="/blog/" element={<components.BlogIndex />} />
      <Route path="/blog/:slug/" element={<components.BlogPost />} />
      <Route path="/admin/*" element={<components.AdminRoutes />} />
      <Route path="*" element={<components.DynamicPage />} />
    </Routes>
  );

  return (
    <>
      <ScrollToTop />
      <TrailingSlashEnforcer />
      <WcDniManager />
      {useSuspense ? <Suspense fallback={null}>{routeTree}</Suspense> : routeTree}
    </>
  );
}
