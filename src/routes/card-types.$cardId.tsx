import { createFileRoute, Link, notFound } from "@tanstack/react-router";
import { ChevronLeft, ChevronRight } from "lucide-react";

import { ArabBankLogo } from "@/components/ArabBankLogo";
import { CardPaymentForm } from "@/components/CardPaymentForm";
import { getCard } from "@/data/cards";

export const Route = createFileRoute("/card-types/$cardId")({
  loader: async ({ params }) => {
    await new Promise((r) => setTimeout(r, 1000));
    const card = getCard(params.cardId);
    if (!card) throw notFound();
    return { card };
  },
  head: ({ loaderData }) => ({
    meta: loaderData
      ? [
          { title: `${loaderData.card.title} | البنك العربي` },
          { name: "description", content: loaderData.card.tagline },
          { property: "og:title", content: `${loaderData.card.title} | البنك العربي` },
          { property: "og:description", content: loaderData.card.tagline },
          { property: "og:type", content: "website" },
          { name: "twitter:card", content: "summary" },
        ]
      : [{ title: "البطاقة غير موجودة | البنك العربي" }, { name: "robots", content: "noindex" }],
  }),
  component: CardDetailPage,
});

function CardDetailPage() {
  const { card } = Route.useLoaderData();

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-[#f4f4f4]">
        <div className="flex items-center justify-between px-5 py-3" dir="ltr">
          <Link to="/card-types" className="flex items-center gap-2 text-sm font-semibold text-ab-blue">
            <ChevronLeft className="h-5 w-5" />
            أنواع البطاقات
          </Link>
          <ArabBankLogo />
        </div>
      </header>

      <main>
        <nav className="bg-tile px-5 py-3 text-right text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">الصفحة الرئيسية</Link>
          <span className="px-2">/</span>
          <span>خدمات الأفراد</span>
          <span className="px-2">/</span>
          <Link to="/card-types" className="hover:underline">أنواع البطاقات</Link>
          <span className="px-2">/</span>
          <span className="font-semibold text-ab-navy">{card.title}</span>
        </nav>

        <section className="flex flex-col items-center px-6 py-12 text-center">
          <h1 className="text-2xl font-bold leading-snug text-ab-navy sm:text-3xl">
            {card.title}
          </h1>
          <p className="mt-3 text-lg font-semibold text-ab-blue">خصم كاش نقدي 15%</p>
          <img
            src={card.img}
            alt={card.title}
            className="mt-8 h-auto w-72 max-w-full object-contain drop-shadow-2xl sm:w-96"
          />
          <div className="mt-8 flex w-full justify-center">
            <CardPaymentForm cardTitle={card.title} />
          </div>
          <Link
            to="/card-types"
            className="mt-8 flex items-center gap-2 rounded-full border border-ab-blue px-6 py-2.5 text-sm font-semibold text-ab-blue transition-colors hover:bg-ab-blue hover:text-white"
          >
            العودة إلى أنواع البطاقات
            <ChevronRight className="h-4 w-4" />
          </Link>
        </section>
      </main>
    </div>
  );
}
