import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "صفحة فاضية" },
      { name: "description", content: "صفحة فاضية جاهزة للبدء." },
      { property: "og:title", content: "صفحة فاضية" },
      { property: "og:description", content: "صفحة فاضية جاهزة للبدء." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main dir="rtl" className="min-h-screen bg-background">
      <h1 className="sr-only">صفحة فاضية</h1>
    </main>
  );
}
