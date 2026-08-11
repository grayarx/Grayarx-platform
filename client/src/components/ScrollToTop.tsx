import { useLayoutEffect } from "react";
import { useLocation } from "wouter";

/**
 * Reset window scroll on every client-side route change.
 * Without this, SPA navigations keep the previous scroll Y (often the bottom).
 */
export default function ScrollToTop() {
  const [location] = useLocation();

  useLayoutEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
    // Some layouts use a scrollable main pane instead of the window.
    const main = document.querySelector("main");
    if (main instanceof HTMLElement) {
      main.scrollTo({ top: 0, left: 0, behavior: "auto" });
    }
  }, [location]);

  return null;
}
