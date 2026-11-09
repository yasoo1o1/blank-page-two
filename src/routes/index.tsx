import { createFileRoute, Link, useRouter } from "@tanstack/react-router";
import { useEffect, useRef, useState, type ReactNode } from "react";

function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.15 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      ref={ref}
      style={{ transitionDelay: `${delay}ms` }}
      className={`transition-all duration-700 ease-out ${
        visible ? "translate-y-0 opacity-100" : "translate-y-10 opacity-0"
      } ${className}`}
    >
      {children}
    </div>
  );
}
import {
  Plus,
  ArrowLeft,
  ArrowUpRight,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Globe,
  Globe2,
  MessageSquare,
  Menu,
  Search,
  Instagram,
  Youtube,
  Linkedin,
  Facebook,
} from "lucide-react";

import { ArabBankLogo } from "@/components/ArabBankLogo";
import awardImg from "@/assets/award.jpg";
import mobileImg from "@/assets/mobile-app.png";
import cardsImg from "@/assets/cards.png";
import branchesImg from "@/assets/branches.png";
import travelImg from "@/assets/travel.jpg";
import wealthImg from "@/assets/wealth.jpg";
import atmImg from "@/assets/atm.jpg";
import shababImg from "@/assets/shabab.jpg";
import realestateImg from "@/assets/realestate.jpg";

export const Route = createFileRoute("/")({
  loader: () => new Promise((r) => setTimeout(r, 1000)),
  head: () => ({
    meta: [
      { title: "البنك العربي | الوصول بداية" },
      {
        name: "description",
        content:
          "الموقع الرسمي للبنك العربي: خدمات الأفراد والشركات، البطاقات، عربي موبايل، الفروع وآخر الأخبار.",
      },
      { property: "og:title", content: "البنك العربي | الوصول بداية" },
      {
        property: "og:description",
        content: "خدمات مصرفية رقمية للأفراد والشركات من البنك العربي.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

const news = [
  {
    date: "سبتمبر 5, 2026",
    title: '"ريفلكت" وجامعة اليرموك يوقعان مذكرة تعاون لتعزيز الشمول المالي الرقمي للطلبة',
    excerpt: '"ريفلكت" وجامعة اليرموك يوقعان مذكرة تعاون لتعزيز الشمول المالي الرقمي للطلبة',
  },
  {
    date: "أغسطس 21, 2026",
    title: "البنك العربي يطلق حزمة خدمات جديدة لعملاء الشركات الصغيرة والمتوسطة",
    excerpt: "حزمة متكاملة تشمل حلول الدفع والتمويل وإدارة النقد.",
  },
  {
    date: "يوليو 3, 2026",
    title: "البنك العربي يوسع شبكة فروعه الرقمية في المملكة",
    excerpt: "فروع رقمية جديدة تقدم خدمات ذاتية على مدار الساعة.",
  },
  {
    date: "يونيو 12, 2026",
    title: "جوائز جديدة للبنك العربي في مجال الخدمات المصرفية الرقمية",
    excerpt: "تقدير دولي لريادة البنك في التحول الرقمي.",
  },
  {
    date: "مايو 2, 2026",
    title: "برنامج عربي جونيَر يحتفل بإنجازات المدخرين الصغار",
    excerpt: "مبادرات لتعزيز ثقافة الادخار لدى الأطفال.",
  },
];

const footerSections = [
  {
    title: "خدمات الأفراد",
    items: [
      { label: "الحسابات" },
      { label: "البطاقات", to: "/cards" },
      { label: "القروض" },
      { label: "الودائع" },
    ],
  },
  {
    title: "خدمات الشركات",
    items: [
      { label: "التمويل التجاري" },
      { label: "إدارة النقد" },
      { label: "القروض التجارية" },
    ],
  },
  {
    title: "خدمات الشركات الصغيرة والمتوسطة",
    items: [
      { label: "حسابات الأعمال" },
      { label: "تمويل رأس المال العامل" },
      { label: "خدمات الدفع", to: "/cards" },
    ],
  },
  {
    title: "طرق التعامل مع البنك",
    items: [
      { label: "عربي موبايل" },
      { label: "عربي أونلاين" },
      { label: "الفروع" },
      { label: "الصراف الآلي" },
    ],
  },
];

const menuLinks = [
  { label: "الرئيسية", to: "/" },
  { label: "البطاقات", to: "/cards" },
  { label: "أنواع البطاقات", to: "/card-types" },
];

function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [query, setQuery] = useState("");

  const results = query.trim()
    ? menuLinks.filter((l) => l.label.includes(query.trim()))
    : menuLinks;

  return (
    <header className="sticky top-0 z-40 bg-[#f4f4f4]">
      <div className="flex items-center justify-between px-5 py-3" dir="ltr">
        <div className="flex items-center gap-6">
          <button
            aria-label="القائمة"
            className="text-[#333]"
            onClick={() => {
              setMenuOpen(true);
              setSearchOpen(false);
            }}
          >
            <Menu className="h-7 w-7" strokeWidth={2} />
          </button>
          <button
            aria-label="البحث"
            className="text-[#333]"
            onClick={() => {
              setSearchOpen(true);
              setMenuOpen(false);
            }}
          >
            <Search className="h-6 w-6" strokeWidth={2} />
          </button>
        </div>
        <div className="flex flex-col items-end">
          <ArabBankLogo />
          <span className="mt-1.5 text-[10px] font-bold tracking-[0.3em] text-[#555]">
            الــوصـــول بـــدايــــة
          </span>
        </div>
      </div>

      {menuOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setMenuOpen(false)}
        >
          <nav
            dir="rtl"
            className="absolute right-0 top-0 h-full w-72 bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-6 flex items-center justify-between">
              <span className="text-lg font-bold text-[#333]">القائمة</span>
              <button
                aria-label="إغلاق"
                className="text-2xl text-[#333]"
                onClick={() => setMenuOpen(false)}
              >
                ×
              </button>
            </div>
            <ul className="space-y-4">
              {menuLinks.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="block text-base font-semibold text-[#333] hover:text-[#e30613]"
                    onClick={() => setMenuOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>
      )}

      {searchOpen && (
        <div
          className="fixed inset-0 z-50 bg-black/40"
          onClick={() => setSearchOpen(false)}
        >
          <div
            dir="rtl"
            className="absolute left-0 right-0 top-0 bg-white p-5 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mx-auto flex max-w-xl items-center gap-3">
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث في الموقع..."
                className="w-full rounded-lg border border-[#ddd] px-4 py-2.5 text-sm outline-none focus:border-[#e30613]"
              />
              <button
                aria-label="إغلاق"
                className="text-2xl text-[#333]"
                onClick={() => setSearchOpen(false)}
              >
                ×
              </button>
            </div>
            <ul className="mx-auto mt-4 max-w-xl space-y-2">
              {results.length === 0 && (
                <li className="py-2 text-sm text-[#777]">لا توجد نتائج</li>
              )}
              {results.map((l) => (
                <li key={l.to}>
                  <Link
                    to={l.to}
                    className="block rounded-lg px-3 py-2 text-sm font-semibold text-[#333] hover:bg-[#f4f4f4]"
                    onClick={() => setSearchOpen(false)}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      )}
    </header>
  );
}

function FeatureCard({
  img,
  title,
  priority = false,
  to,
}: {
  img: string;
  title: string;
  priority?: boolean;
  to?: string;
}) {
  const body = (
    <article className="group relative overflow-hidden rounded-2xl shadow-card transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl">
      <img
        src={img}
        alt={title}
        width={1024}
        height={1024}
        loading="eager"
        className="h-[340px] w-full object-cover transition-transform duration-500 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-ab-navy/85 via-ab-navy/10 to-transparent transition-opacity duration-300 group-hover:from-ab-navy/90" />
      <div className="absolute left-4 top-4 flex h-10 w-10 translate-y-2 items-center justify-center rounded-full bg-white/20 opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
        <ArrowUpRight className="h-5 w-5 text-white" />
      </div>
      <div className="absolute inset-x-0 bottom-0 p-5 text-right">
        <h3 className="text-2xl font-bold text-white transition-transform duration-300 group-hover:-translate-y-1">
          {title}
        </h3>
        <span className="mt-3 inline-flex items-center justify-end gap-2 text-sm font-semibold text-ab-cyan transition-all duration-300 group-hover:gap-3">
          إقرأ المزيد
          <ArrowLeft className="h-4 w-4 transition-transform duration-300 group-hover:-translate-x-1" />
        </span>
      </div>
    </article>
  );

  if (to) {
    return (
      <Link to={to} className="block">
        {body}
      </Link>
    );
  }
  return body;
}

function SplashTypewriter() {
  const text = "أهلاً بك في البنك العربي";
  const [count, setCount] = useState(0);
  useEffect(() => {
    const timer = setInterval(() => {
      setCount((c) => (c < text.length ? c + 1 : c));
    }, 100);
    return () => clearInterval(timer);
  }, []);
  return (
    <p className="text-lg font-semibold text-white">
      {text.slice(0, count)}
      <span className="inline-block w-[2px] translate-y-[2px] animate-pulse bg-white" style={{ height: "1.2em" }} />
    </p>
  );
}

function Index() {
  const [newsIndex, setNewsIndex] = useState(0);
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [splash, setSplash] = useState(true);
  const [splashLeaving, setSplashLeaving] = useState(false);
  const router = useRouter();
  const item = news[newsIndex]!;

  useEffect(() => {
    const images = [
      awardImg,
      mobileImg,
      cardsImg,
      branchesImg,
      travelImg,
      wealthImg,
      atmImg,
      shababImg,
      realestateImg,
    ];
    const preloadImages = () =>
      Promise.allSettled(
        images.map(
          (src) =>
            new Promise<void>((resolve) => {
              const img = new Image();
              img.onload = () => resolve();
              img.onerror = () => resolve();
              img.src = src;
            }),
        ),
      );

    if (sessionStorage.getItem("ab-welcomed")) {
      setSplash(false);
      preloadImages();
      return;
    }
    sessionStorage.setItem("ab-welcomed", "1");
    document.documentElement.style.overflow = "hidden";
    try {
      router.preloadRoute({ to: "/cards" });
      router.preloadRoute({ to: "/card-types" });
    } catch {
      /* ignore preload errors */
    }

    let minReached = false;
    let imagesDone = false;
    let ended = false;
    let unmount: ReturnType<typeof setTimeout> | undefined;
    const tryEnd = () => {
      if (ended || !minReached || !imagesDone) return;
      ended = true;
      setSplashLeaving(true);
      unmount = setTimeout(() => {
        setSplash(false);
        document.documentElement.style.overflow = "";
      }, 500);
    };
    preloadImages().then(() => {
      imagesDone = true;
      tryEnd();
    });
    const minTimer = setTimeout(() => {
      minReached = true;
      tryEnd();
    }, 4000);
    const capTimer = setTimeout(() => {
      ended = true;
      setSplashLeaving(true);
      document.documentElement.style.overflow = "";
    }, 8000);
    return () => {
      clearTimeout(minTimer);
      clearTimeout(capTimer);
      if (unmount) clearTimeout(unmount);
      document.documentElement.style.overflow = "";
    };
  }, []);

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background">
      {splash && (
        <div
          className={`fixed inset-0 z-[100] flex flex-col items-center justify-center gap-6 bg-ab-navy transition-opacity duration-500 ${
            splashLeaving ? "opacity-0" : "opacity-100"
          }`}
        >
          <div className="animate-scale-in">
            <ArabBankLogo variant="white" />
          </div>
          <SplashTypewriter />
        </div>
      )}
      <Header />

      <Link
        to="/cards"
        aria-label="إضافة"
        className="fixed left-4 top-[150px] z-30 flex h-11 w-11 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#3d9bff,#1e63e0_55%,#1a2ba8)] text-white shadow-card"
      >
        <Plus className="h-5 w-5" strokeWidth={1.8} />
      </Link>

      <main>
        {/* Award hero */}
        <section className="relative overflow-hidden">
          <Link to="/cards" className="block">
            <img
              src={awardImg}
              alt="جائزة أفضل بنك في الشرق الأوسط"
              width={1400}
              height={900}
              className="h-[300px] w-full scale-[1.3] -translate-x-[13%] object-cover"
            />
            <div className="absolute inset-0 flex items-center justify-start bg-gradient-to-r from-transparent to-ab-navy/70 p-6">
              <h1 className="max-w-[55%] text-right text-2xl font-bold leading-snug text-white">
                البنك العربي... أفضل بنك في الشرق الأوسط للعام 2026
              </h1>
            </div>
          </Link>
        </section>

        {/* Video */}
        <section className="bg-tile px-4 py-8">
          <Reveal>
            <div className="relative overflow-hidden rounded-2xl bg-[#04102b] shadow-card">
              <div className="flex items-center justify-between p-4">
                <ArabBankLogo variant="white" className="scale-90 origin-right" />
                <div className="text-right text-white">
                  <div className="text-lg font-bold">الوصول بداية</div>
                  <div className="text-xs opacity-80">ArabBankGroup</div>
                </div>
              </div>
              <div className="relative aspect-video w-full">
                <iframe
                  src="https://www.youtube.com/embed/-E5eGZe3AZ8?rel=0"
                  title="فيديو البنك العربي - الوصول بداية"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  className="absolute inset-0 h-full w-full"
                />
              </div>
            </div>
          </Reveal>
        </section>

        {/* Feature cards */}
        <section className="space-y-8 px-4 py-8">
          <Reveal><FeatureCard img={mobileImg} title="عربي موبايل" priority to="/cards" /></Reveal>
          <Reveal><FeatureCard img={cardsImg} title="البطاقات" to="/cards" /></Reveal>
          <Reveal><FeatureCard img={branchesImg} title="الفروع" to="/cards" /></Reveal>
          <Reveal><FeatureCard img={travelImg} title="تأمين السفر" to="/cards" /></Reveal>
          <Reveal><FeatureCard img={wealthImg} title="إدارة الثروات" to="/cards" /></Reveal>
          <Reveal><FeatureCard img={atmImg} title="الصراف الآلي" to="/cards" /></Reveal>
          <Reveal><FeatureCard img={shababImg} title="برنامج شباب من البنك العربي" to="/cards" /></Reveal>
          <Reveal><FeatureCard img={realestateImg} title="عقارات للبنك العربي" to="/cards" /></Reveal>
        </section>

        {/* News */}
        <section className="bg-[#e3e7ec] px-5 py-10">
          <Reveal>
          <div className="flex items-center justify-between">
            <a href="#" className="text-sm font-semibold text-ab-blue">
              عرض الكل
            </a>
            <h2 className="text-3xl font-bold text-ab-navy">آخر الأخبار</h2>
          </div>

          <article className="mt-10 text-right">
            <p className="text-sm text-muted-foreground">{item.date}</p>
            <h3 className="mt-4 text-2xl font-bold leading-relaxed text-ab-navy">{item.title}</h3>
            <p className="mt-3 text-base leading-relaxed text-muted-foreground">{item.excerpt}</p>
            <a
              href="#"
              className="mt-6 inline-flex items-center gap-2 text-sm font-semibold text-ab-blue"
            >
              إقرأ المزيد
              <ArrowLeft className="h-4 w-4" />
            </a>
          </article>

          <div className="mt-8 flex items-center justify-center gap-3 text-ab-navy">
            <button
              aria-label="التالي"
              onClick={() => setNewsIndex((i) => (i + 1) % news.length)}
              className="disabled:opacity-40"
            >
              <ChevronRight className="h-7 w-7" />
            </button>
            <span className="text-lg">
              {newsIndex + 1} من {news.length}
            </span>
            <button
              aria-label="السابق"
              onClick={() => setNewsIndex((i) => (i - 1 + news.length) % news.length)}
            >
              <ChevronLeft className="h-7 w-7" />
            </button>
          </div>
          </Reveal>
        </section>
      </main>

      <footer className="text-white">
        {/* Language / country */}
        <div className="bg-brand px-5 py-8">
          <div className="flex items-center justify-between">
            <button className="flex items-center gap-2 text-lg">
              <span>العربية</span>
              <Globe className="h-6 w-6" />
            </button>
            <button className="flex items-center gap-2 text-lg">
              <ChevronDown className="h-5 w-5" />
              <span>الأردن</span>
              <Globe2 className="h-6 w-6" />
            </button>
          </div>

          <div className="mt-12 grid grid-cols-5 gap-2 text-center">
            {[
              { Icon: Instagram, n: "120k", l: "متابع" },
              { Icon: Youtube, n: "51.8k", l: "مشترك" },
              { Icon: Linkedin, n: "669K", l: "متابع" },
              { Icon: Facebook, n: "1.01M", l: "متابع" },
              { Icon: MessageSquare, n: "27K", l: "متابع" },
            ].map(({ Icon, n, l }) => (
              <a key={l + n} href="#" className="flex flex-col items-center gap-2">
                <Icon className="h-8 w-8" strokeWidth={1.5} />
                <span className="text-sm font-bold">{n}</span>
                <span className="text-[11px] opacity-80">{l}</span>
              </a>
            ))}
          </div>
        </div>

        {/* Dark footer */}
        <div className="bg-[#0a1c6b] px-5 py-10">
          <ArabBankLogo variant="white" className="scale-125 origin-right" />

          <div className="mt-8 grid grid-cols-2 overflow-hidden rounded-md">
            <div className="bg-[#fbf9f2] p-4 text-right text-ab-navy">
              <p className="text-lg font-bold leading-snug">هذا البنك عضو في مؤسسة ضمان الودائع</p>
              <p className="mt-2 text-sm font-bold">
                This Bank is a Member of the Deposit Insurance Corporation
              </p>
              <p className="mt-2 text-[9px] leading-tight">
                ودائع العملاء بالدينار الأردني مضمونة بتعويض فوري حدّه الأقصى (٥٠،٠٠٠) خمسون ألف
                دينار
              </p>
            </div>
            <div className="flex flex-col items-center justify-center gap-2 bg-[#4a3f4a] p-4">
              <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-[#c9a227] text-center text-[9px] leading-tight text-[#f1e3c0]">
                مؤسسة ضمان الودائع
              </div>
              <span className="text-xs">www.dic.gov.jo</span>
            </div>
          </div>

          <div className="mt-8">
            {footerSections.map((s) => (
              <div key={s.title} className="border-b border-white/10">
                <button
                  onClick={() => setOpenSection(openSection === s.title ? null : s.title)}
                  className="flex w-full items-center justify-between py-5 text-right"
                >
                  <ChevronDown
                    className={`h-5 w-5 transition-transform ${openSection === s.title ? "rotate-180" : ""}`}
                  />
                  <span className="text-lg font-bold">{s.title}</span>
                </button>
                {openSection === s.title && (
                  <ul className="pb-5 text-right text-sm opacity-85">
                    {s.items.map((i) => (
                      <li key={i.label} className="py-1.5">
                        {i.to ? (
                          <Link to={i.to} className="hover:underline">
                            {i.label}
                          </Link>
                        ) : (
                          i.label
                        )}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            ))}
            <div className="border-b border-white/10 py-5 text-right text-lg font-bold">الخزينة</div>
          </div>

          <p className="mt-10 border-t border-white/20 pt-6 text-center text-base">
            جميع الحقوق محفوظة © 2026 البنك العربي
          </p>

          <ul className="mt-4 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm opacity-90">
            {[
              "الأسئلة الشائعة",
              "إشعار الخصوصية",
              "سياسة الأمن",
              "القانونية",
              "الرسوم والعمولات",
            ].map((l) => (
              <li key={l}>
                <a href="#">{l}</a>
              </li>
            ))}
          </ul>
        </div>
      </footer>

      <button
        aria-label="الدردشة"
        className="fixed bottom-6 right-5 z-40 flex h-11 w-11 items-center justify-center rounded-full bg-[radial-gradient(circle_at_30%_30%,#3d9bff,#1e63e0_55%,#1a2ba8)] text-white shadow-card"
      >
        <MessageSquare className="h-5 w-5" strokeWidth={1.8} />
      </button>
    </div>
  );
}
