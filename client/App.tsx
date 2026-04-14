import "./global.css";
import BrowserApp from "./app/BrowserApp";
import { createRoot, hydrateRoot } from "react-dom/client";
import { getCmsPreloadedState } from "./lib/cms/preloadedState";
import { normalizeCmsPath } from "./lib/cms/publicRoutes";

const container = document.getElementById("root")!;
const preloadedState = getCmsPreloadedState();
const hasPrerenderedMarkup = container.innerHTML.trim().length > 0;
const hasMatchingPreloadedState =
  !!preloadedState &&
  normalizeCmsPath(preloadedState.currentPath) ===
    normalizeCmsPath(window.location.pathname);
const shouldHydrate = hasPrerenderedMarkup && hasMatchingPreloadedState;
const existingRoot = (container as any).__reactRoot;

if (existingRoot) {
  existingRoot.render(<BrowserApp />);
} else if (shouldHydrate) {
  (container as any).__reactRoot = hydrateRoot(container, <BrowserApp />);
} else {
  const root = createRoot(container);
  (container as any).__reactRoot = root;
  root.render(<BrowserApp />);
}
