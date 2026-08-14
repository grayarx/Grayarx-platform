import { trpc } from "@/lib/trpc";
import { UNAUTHED_ERR_MSG } from '@shared/const';
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, TRPCClientError } from "@trpc/client";
import { createRoot } from "react-dom/client";
import superjson from "superjson";
import App from "./App";
import { UpgradeModalProvider } from "./contexts/UpgradeModalContext";
import { getLoginUrl } from "./const";
import { ToastProvider } from "./components/ToastNotification";
import "./index.css";

// Optional client-side error tracking — no-ops when VITE_SENTRY_DSN isn't
// set, so nothing breaks before the founder creates a Sentry account.
const sentryDsn = import.meta.env.VITE_SENTRY_DSN;
if (sentryDsn) {
  import("@sentry/react")
    .then(Sentry => {
      Sentry.init({
        dsn: sentryDsn,
        environment: import.meta.env.MODE,
        // Errors only — no performance tracing, to stay well within the free tier.
        tracesSampleRate: 0,
      });
    })
    .catch(err => console.warn("[Sentry] client init skipped:", err));
}

const queryClient = new QueryClient();

/** Marketing / public paths must never bounce anonymous visitors to /login. */
function isPublicUnauthedPath(path: string): boolean {
  if (path === "/") return true;
  const prefixes = [
    "/login",
    "/signup",
    "/forgot-password",
    "/reset-password",
    "/check-email",
    "/onboarding",
    "/for-dealers",
    "/showroom",
    "/compare",
    "/trade-in",
    "/finance",
    "/help",
    "/legal",
    "/privacy-policy",
    "/terms",
    "/ai-ethics",
    "/dpa",
    "/aup",
    "/sla",
    "/credit-disclaimer",
    "/book/",
    "/apply/",
    "/verify-email",
    "/email-preferences",
    "/wizard",
  ];
  return prefixes.some((p) => {
    if (p.endsWith("/")) return path.startsWith(p);
    return path === p || path.startsWith(`${p}/`);
  });
}

const redirectToLoginIfUnauthorized = (error: unknown) => {
  if (!(error instanceof TRPCClientError)) return;
  if (typeof window === "undefined") return;

  const isUnauthorized = error.message === UNAUTHED_ERR_MSG;

  if (!isUnauthorized) return;

  const path = window.location.pathname;
  if (isPublicUnauthedPath(path)) {
    return;
  }

  window.location.href = getLoginUrl();
};

queryClient.getQueryCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.query.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Query Error]", error);
  }
});

queryClient.getMutationCache().subscribe(event => {
  if (event.type === "updated" && event.action.type === "error") {
    const error = event.mutation.state.error;
    redirectToLoginIfUnauthorized(error);
    console.error("[API Mutation Error]", error);
  }
});

const trpcClient = trpc.createClient({
  links: [
    httpBatchLink({
      url: "/api/trpc",
      transformer: superjson,
      fetch(input, init) {
        return globalThis.fetch(input, {
          ...(init ?? {}),
          credentials: "include",
        });
      },
    }),
  ],
});

createRoot(document.getElementById("root")!).render(
  <trpc.Provider client={trpcClient} queryClient={queryClient}>
    <QueryClientProvider client={queryClient}>
      <ToastProvider position="bottom-right">
        <UpgradeModalProvider>
          <App />
        </UpgradeModalProvider>
      </ToastProvider>
    </QueryClientProvider>
  </trpc.Provider>
);
