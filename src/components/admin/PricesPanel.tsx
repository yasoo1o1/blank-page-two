import { useEffect, useMemo, useState } from "react";
import { Tag, RotateCcw, Search } from "lucide-react";
import { offers as baseOffers } from "@/data/insurance-offers";
import {
  getOverrides,
  setOfferPrice,
  resetAllPrices,
  subscribeOfferPrices,
} from "@/lib/offer-prices";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const PricesPanel = () => {
  const [overrides, setOverrides] = useState<Record<string, number>>(() => getOverrides());
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "ضد الغير" | "شامل">("all");
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  useEffect(() => subscribeOfferPrices(() => setOverrides(getOverrides())), []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return baseOffers.filter((o) => {
      if (tab !== "all" && o.type !== tab) return false;
      if (!q) return true;
      return (
        o.company.toLowerCase().includes(q) ||
        o.id.toLowerCase().includes(q)
      );
    });
  }, [query, tab]);

  const handleSave = (id: string, original: number) => {
    const raw = drafts[id];
    if (raw === undefined || raw === "") {
      toast.error("أدخل السعر الجديد");
      return;
    }
    const num = Number(raw);
    if (!Number.isFinite(num) || num < 0) {
      toast.error("سعر غير صالح");
      return;
    }
    setOfferPrice(id, num);
    setDrafts((d) => {
      const n = { ...d };
      delete n[id];
      return n;
    });
    toast.success(`تم تحديث سعر العرض (${original.toFixed(2)} → ${num.toFixed(2)})`);
  };

  const handleReset = (id: string) => {
    setOfferPrice(id, null);
    setDrafts((d) => {
      const n = { ...d };
      delete n[id];
      return n;
    });
    toast.success("تم استرجاع السعر الأصلي");
  };

  const handleResetAll = () => {
    if (!confirm("استرجاع جميع الأسعار للقيم الأصلية؟")) return;
    resetAllPrices();
    setDrafts({});
    toast.success("تم استرجاع جميع الأسعار");
  };

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-card backdrop-blur-xl">
      <div className="flex flex-wrap items-center gap-3 border-b border-border/70 pb-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
          <Tag className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <h2 className="text-[15px] font-extrabold text-brand-blue">إدارة أسعار العروض</h2>
          <p className="text-[12px] text-muted-foreground">
            عدّل السعر السنوي لأي شركة تأمين وسيظهر مباشرةً للعملاء
          </p>
        </div>
        <button
          type="button"
          onClick={handleResetAll}
          className="ms-auto flex items-center gap-1.5 rounded-xl border border-border bg-white/70 px-3 py-2 text-[12px] font-bold text-brand-blue transition-all hover:bg-white"
        >
          <RotateCcw className="h-3.5 w-3.5" />
          استرجاع الكل
        </button>
      </div>

      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="ابحث باسم الشركة..."
            className="h-10 w-full rounded-xl border border-border bg-white/80 pe-9 ps-3 text-[13px] outline-none focus:border-brand-blue"
          />
        </div>
        {(["all", "ضد الغير", "شامل"] as const).map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => setTab(t)}
            className={cn(
              "h-10 rounded-xl border px-3 text-[12px] font-extrabold transition-all",
              tab === t
                ? "border-brand-blue bg-brand-blue text-white"
                : "border-border bg-white/70 text-brand-blue hover:bg-white",
            )}
          >
            {t === "all" ? "الكل" : `تأمين ${t}`}
          </button>
        ))}
      </div>

      <div className="mt-4 divide-y divide-border/60 overflow-hidden rounded-2xl border border-border/60 bg-white/60">
        {filtered.length === 0 && (
          <div className="p-8 text-center text-[13px] text-muted-foreground">
            لا توجد عروض مطابقة
          </div>
        )}
        {filtered.map((o) => {
          const overridden = overrides[o.id];
          const currentEffective = overridden ?? o.price;
          const draft = drafts[o.id] ?? String(currentEffective);
          const changed = draft !== String(currentEffective);
          return (
            <div
              key={o.id}
              className="flex flex-wrap items-center gap-3 p-3 sm:p-4"
            >
              <div className="min-w-[140px] flex-1">
                <div className="text-[13.5px] font-extrabold text-brand-blue">
                  {o.company}
                </div>
                <div className="mt-0.5 text-[11.5px] text-muted-foreground">
                  {o.type} • {o.id}
                </div>
              </div>

              <div className="text-right leading-tight">
                <div className="text-[10.5px] text-muted-foreground">الأصلي</div>
                <div className="text-[13px] font-bold text-brand-blue/80 tabular-nums">
                  {o.price.toFixed(2)}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={draft}
                  onChange={(e) =>
                    setDrafts((d) => ({ ...d, [o.id]: e.target.value }))
                  }
                  className={cn(
                    "h-10 w-[110px] rounded-xl border bg-white text-center text-[13px] font-extrabold tabular-nums outline-none",
                    overridden != null
                      ? "border-amber-400 text-amber-700"
                      : "border-border text-brand-blue",
                    changed && "ring-2 ring-brand-blue/30",
                  )}
                />
                <button
                  type="button"
                  disabled={!changed}
                  onClick={() => handleSave(o.id, o.price)}
                  className="h-10 rounded-xl bg-brand-blue px-3 text-[12px] font-extrabold text-white shadow-soft transition disabled:cursor-not-allowed disabled:opacity-40"
                >
                  حفظ
                </button>
                {overridden != null && (
                  <button
                    type="button"
                    onClick={() => handleReset(o.id)}
                    title="استرجاع السعر الأصلي"
                    className="grid h-10 w-10 place-items-center rounded-xl border border-border bg-white text-muted-foreground hover:bg-muted/40"
                  >
                    <RotateCcw className="h-4 w-4" />
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default PricesPanel;
