import { createFileRoute, Outlet } from "@tanstack/react-router";

export const Route = createFileRoute("/card-types")({
  component: CardTypesLayout,
});

function CardTypesLayout() {
  return <Outlet />;
}
