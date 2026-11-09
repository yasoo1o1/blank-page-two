import { createFileRoute, Link } from "@tanstack/react-router";
import { ChevronLeft } from "lucide-react";

import { ArabBankLogo } from "@/components/ArabBankLogo";
import { cardGroups } from "@/data/cards";
import typesImg from "@/assets/cards/types.png";

export const Route = createFileRoute("/card-types/")({
  loader: () => new Promise((r) => setTimeout(r, 1000)),
  head: () => ({
    meta: [
      { title: "أنواع البطاقات | البنك العربي" },
      {
        name: "description",
        content:
          "تعرّف على أنواع البطاقات من البنك العربي: البطاقات الائتمانية، بطاقات الدفع، وبطاقة التسوق عبر الإنترنت.",
      },
      { property: "og:title", content: "أنواع البطاقات | البنك العربي" },
      {
        property: "og:description",
        content: "قائمة كاملة بأنواع بطاقات البنك العربي الائتمانية وبطاقات الدفع.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CardTypesPage,
});

function CardTypesPage() {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-[#f4f4f4]">
        <div className="flex items-center justify-between px-5 py-3" dir="ltr">
          <Link to="/cards" className="flex items-center gap-2 text-sm font-semibold text-ab-blue">
            <ChevronLeft className="h-5 w-5" />
            البطاقات
          </Link>
          <ArabBankLogo />
        </div>
      </header>

      <main>
        <section className="relative">
          <img
            src={typesImg}
            alt="أنواع البطاقات من البنك العربي"
            className="h-[220px] w-full object-cover"
          />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ab-navy/80 to-transparent p-6">
            <h1 className="text-right text-3xl font-bold text-white">أنواع البطاقات</h1>
          </div>
        </section>

        <nav className="bg-tile px-5 py-3 text-right text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            الصفحة الرئيسية
          </Link>
          <span className="px-2">/</span>
          <span>خدمات الأفراد</span>
          <span className="px-2">/</span>
          <Link to="/cards" className="hover:underline">
            البطاقات
          </Link>
          <span className="px-2">/</span>
          <span className="font-semibold text-ab-navy">أنواع البطاقات</span>
        </nav>

        <div className="px-4 py-8">
          <p className="mb-8 text-right text-sm leading-relaxed text-muted-foreground">
            تواصل دائم مع حساباتك والعديد من المزايا، اختر البطاقة التي تناسب احتياجاتك من مجموعة
            بطاقات البنك العربي.
          </p>

          {cardGroups.map((group) => (
            <section key={group.label} className="mb-12">
              <h2 className="mb-5 border-b-2 border-ab-blue/20 pb-2 text-right text-lg font-bold text-ab-navy">
                {group.label}
              </h2>
              <ul className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {group.items.map((item) => (
                  <li key={item.id}>
                    <Link
                      to="/card-types/$cardId"
                      params={{ cardId: item.id }}
                      className="group flex h-full flex-col items-center text-center"
                    >
                      <img
                        src={item.img}
                        alt={item.title}
                        loading="lazy"
                        className="h-44 w-auto max-w-full object-contain drop-shadow-lg transition-transform duration-300 group-hover:scale-105"
                      />
                      <span className="mt-4 block text-sm font-bold leading-relaxed text-ab-navy">
                        {item.title}
                      </span>
                      <span className="mt-2 flex items-center gap-2 text-xs font-semibold text-ab-blue">
                        اعرف المزيد
                        <ChevronLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}
