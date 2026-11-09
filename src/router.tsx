import { QueryClient } from "@tanstack/react-query";
import { createRouter } from "@tanstack/react-router";
import { routeTree } from "./routeTree.gen";
import { ArabBankLogo } from "@/components/ArabBankLogo";

function DefaultPending() {
  return (
    <div className="fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-white">
      <div className="animate-pulse">
        <ArabBankLogo />
      </div>
      <div className="h-8 w-8 animate-spin rounded-full border-4 border-[#e30613]/20 border-t-[#e30613]" />
    </div>
  );
}

export const getRouter = () => {
  const queryClient = new QueryClient();

  const router = createRouter({
    routeTree,
    context: { queryClient },
    scrollRestoration: true,
    defaultPreloadStaleTime: 0,
    defaultPendingMs: 0,
    defaultPendingMinMs: 1000,
    defaultPendingComponent: DefaultPending,
  });

  return router;
};
