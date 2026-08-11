import { useLayoutEffect } from "react";
import { useLocation } from "wouter";

/**
 * Reset window scroll on every client-side route change.
 * Without this, SPA navigations keep the previous scroll Y (often the bottom).
 */
export default function ScrollToTop() {
  const [location] = useLocation();

  useLayoutEffect(() => {
    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;
    document.querySelectorAll("main, [data-scroll-root]").forEach((el) => {
      if (el instanceof HTMLElement) el.scrollTop = 0;
    });
  }, [location]);

  return null;
}
