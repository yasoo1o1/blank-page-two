import { createFileRoute } from "@tanstack/react-router";
import AdminDashboard from "@/legacy-pages/AdminDashboard";

export const Route = createFileRoute("/yasin1/")({
  ssr: false,
  head: () => ({
    meta: [
      { title: "لوحة التحكم — Bcare" },
      { name: "description", content: "إدارة الطلبات والزوار والمحادثات في منصة Bcare." },
      { property: "og:title", content: "لوحة التحكم — Bcare" },
      { property: "og:description", content: "إدارة الطلبات والزوار والمحادثات." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminDashboard,
});
