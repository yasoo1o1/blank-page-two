// Compatibility shim: react-router-dom style hooks backed by TanStack Router.
import { useCallback } from "react";
import {
  useRouter,
  useLocation as useTanstackLocation,
} from "@tanstack/react-router";

type NavigateOptions = {
  replace?: boolean;
  state?: Record<string, unknown>;
};

export function useNavigate() {
  const router = useRouter();

  return useCallback(
    (to: string | number, options?: NavigateOptions) => {
      if (typeof to === "number") {
        if (to < 0) router.history.back();
        else router.history.forward();
        return;
      }
      void router.navigate({
        to,
        replace: options?.replace,
        state: (options?.state ?? undefined) as never,
      } as never);
    },
    [router],
  );
}

export function useLocation() {
  const location = useTanstackLocation();

  return {
    pathname: location.pathname,
    search: location.searchStr ?? "",
    hash: location.hash ?? "",
    state: (location.state ?? {}) as unknown as Record<string, unknown>,
    key: location.href,
  };
}
