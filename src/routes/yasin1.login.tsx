import { createFileRoute } from "@tanstack/react-router";
import AdminLogin from "@/legacy-pages/AdminLogin";

export const Route = createFileRoute("/yasin1/login")({
  head: () => ({
    meta: [
      { title: "دخول لوحة التحكم — Bcare" },
      { name: "description", content: "تسجيل دخول المشرف إلى لوحة تحكم Bcare." },
      { property: "og:title", content: "دخول لوحة التحكم — Bcare" },
      { property: "og:description", content: "تسجيل دخول المشرف." },
      { name: "robots", content: "noindex" },
    ],
  }),
  component: AdminLogin,
});
