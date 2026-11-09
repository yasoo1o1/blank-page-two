import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronLeft } from "lucide-react";

import { ArabBankLogo } from "@/components/ArabBankLogo";
import heroImg from "@/assets/cards/hero.jpg";
import typesImg from "@/assets/cards/types.png";
import guideImg from "@/assets/cards/guide.png";
import contactlessImg from "@/assets/cards/contactless.jpg";
import easyPaymentImg from "@/assets/cards/easy-payment.jpg";
import discountsImg from "@/assets/cards/discounts.png";
import promotionsImg from "@/assets/cards/promotions.jpg";

export const Route = createFileRoute("/cards")({
  loader: () => new Promise((r) => setTimeout(r, 1000)),
  head: () => ({
    meta: [
      { title: "البطاقات | البنك العربي" },
      {
        name: "description",
        content:
          "بطاقات البنك العربي: أنواع البطاقات، دليل الاستخدام، الدفع اللاتلامسي، برنامج التسديد المريح، الخصومات الخاصة وعروض البطاقات.",
      },
      { property: "og:title", content: "البطاقات | البنك العربي" },
      {
        property: "og:description",
        content: "تعرّف على بطاقات البنك العربي ومزاياها وعروضها والخصومات الخاصة بها.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: CardsPage,
});

const tiles: { img: string; title: string; text: string; to?: "/card-types" }[] = [
  {
    img: typesImg,
    title: "أنواع البطاقات",
    text: "تواصل دائم مع حساباتك والعديد من المزايا",
    to: "/card-types",
  },
  {
    img: guideImg,
    title: "دليل استخدام البطاقات",
    text: "لتحميل دليل استخدام البطاقات من البنك العربي",
    to: "/card-types",
  },
  {
    img: contactlessImg,
    title: "الدفع بتقنية اللاتلامسية",
    text: "",
    to: "/card-types",
  },
  {
    img: easyPaymentImg,
    title: "برنامج التسديد المريح",
    text: "قسِّم دفعاتك .. كيف ما بيحلالك",
    to: "/card-types",
  },
  {
    img: discountsImg,
    title: "خصومات خاصة",
    text: "عند استخدامك بطاقة البنك العربي في الأماكن التالية تحصل فوراً على خصومات خاصة",
    to: "/card-types",
  },
  {
    img: promotionsImg,
    title: "عروض البطاقات",
    text: "",
    to: "/card-types",
  },
];

function CardsPage() {
  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-[#f4f4f4]">
        <div className="flex items-center justify-between px-5 py-3" dir="ltr">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-ab-blue">
            <ChevronLeft className="h-5 w-5" />
            الرئيسية
          </Link>
          <ArabBankLogo />
        </div>
      </header>

      <main>
        <section className="relative">
          <img
            src={heroImg}
            alt="البطاقات من البنك العربي"
            className="h-[240px] w-full object-cover"
          />
          <div className="absolute inset-0 flex items-end bg-gradient-to-t from-ab-navy/80 to-transparent p-6">
            <h1 className="text-right text-3xl font-bold text-white">البطاقات</h1>
          </div>
        </section>

        <nav className="bg-tile px-5 py-3 text-right text-xs text-muted-foreground">
          <Link to="/" className="hover:underline">
            الصفحة الرئيسية
          </Link>
          <span className="px-2">/</span>
          <span>خدمات الأفراد</span>
          <span className="px-2">/</span>
          <span className="font-semibold text-ab-navy">البطاقات</span>
        </nav>

        <section className="space-y-6 px-4 py-8">
          {tiles.map((t) => {
            const card = (
              <article className="group overflow-hidden rounded-2xl bg-card shadow-card transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
                <img
                  src={t.img}
                  alt={t.title}
                  loading="lazy"
                  className="h-52 w-full object-cover transition-transform duration-500 group-hover:scale-105"
                />
                <div className="p-5 text-right">
                  <h2 className="text-xl font-bold text-ab-navy">{t.title}</h2>
                  {t.text && (
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{t.text}</p>
                  )}
                  <span className="mt-4 inline-flex items-center gap-2 text-sm font-semibold text-ab-blue transition-all duration-300 group-hover:gap-3">
                    إقرأ المزيد
                    <ArrowLeft className="h-4 w-4" />
                  </span>
                </div>
              </article>
            );

            if (t.to) {
              return (
                <Link key={t.title} to={t.to} className="block">
                  {card}
                </Link>
              );
            }
            return <div key={t.title}>{card}</div>;
          })}
        </section>
      </main>
    </div>
  );
}
