import { useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";
import { changeAdminPassword } from "@/lib/admin-storage";
import { cn } from "@/lib/utils";

const PasswordPanel = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      toast.error("كلمتا المرور غير متطابقتين");
      return;
    }
    setSubmitting(true);
    const res = changeAdminPassword(currentPassword, newPassword);
    setSubmitting(false);
    if (!res.ok) {
      toast.error(res.error ?? "تعذّر تغيير كلمة المرور");
      return;
    }
    toast.success("تم تغيير كلمة المرور بنجاح");
    setCurrentPassword("");
    setNewPassword("");
    setConfirmPassword("");
  };

  const inputCls = cn(
    "h-[46px] w-full rounded-[10px] border border-[hsl(214_25%_85%)] bg-white px-4 text-right text-[14px] text-brand-blue outline-none focus:border-brand-blue",
  );

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-card backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-border/70 pb-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-amber-100 text-amber-700">
          <KeyRound className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <h2 className="text-[15px] font-extrabold text-brand-blue">كلمة المرور</h2>
          <p className="text-[12px] text-muted-foreground">
            تغيير كلمة مرور الدخول للوحة التحكم
          </p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-6 max-w-lg space-y-4 rounded-2xl border border-border/60 bg-white/70 p-5"
      >
        <div className="space-y-1.5">
          <label className="block text-right text-[12.5px] font-bold text-brand-blue">
            كلمة المرور الحالية
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            placeholder="••••••"
            className={inputCls}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-right text-[12.5px] font-bold text-brand-blue">
            كلمة المرور الجديدة
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="••••••"
            className={inputCls}
            required
          />
        </div>

        <div className="space-y-1.5">
          <label className="block text-right text-[12.5px] font-bold text-brand-blue">
            تأكيد كلمة المرور الجديدة
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="••••••"
            className={inputCls}
            required
          />
        </div>

        <button
          type="submit"
          disabled={submitting}
          className="h-[48px] w-full rounded-[10px] bg-brand-blue text-[14.5px] font-extrabold text-white shadow-soft transition-transform hover:brightness-110 active:scale-[0.99] disabled:opacity-60"
        >
          {submitting ? "جاري الحفظ..." : "حفظ كلمة المرور الجديدة"}
        </button>

        <p className="text-center text-[11.5px] text-muted-foreground">
          يتم حفظ كلمة المرور محليًا على هذا المتصفح فقط (للأغراض التعليمية).
        </p>
      </form>
    </div>
  );
};

export default PasswordPanel;
