// @ts-nocheck
import { useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Lock, ShieldAlert } from "lucide-react";
import { loginAdmin } from "@/lib/admin-storage";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const AdminLogin = () => {
  const navigate = useNavigate();
  const [password, setPassword] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (loginAdmin(password)) {
      toast.success("تم تسجيل الدخول");
      navigate("/yasin1");
    } else {
      toast.error("كلمة المرور غير صحيحة");
    }
  };

  return (
    <main
      dir="rtl"
      className="grid min-h-screen place-items-center bg-[hsl(210_40%_97%)] px-4"
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-[420px] rounded-2xl bg-white p-6 shadow-card sm:p-7"
      >
        <div className="text-center">
          <div className="mx-auto mb-3 grid h-14 w-14 place-items-center rounded-full bg-brand-blue/10 text-brand-blue">
            <Lock className="h-6 w-6" strokeWidth={2.2} />
          </div>
          <h1 className="text-[20px] font-extrabold text-brand-blue sm:text-[22px]">
            دخول لوحة الإدارة
          </h1>
          <p className="mt-1 text-[12.5px] text-muted-foreground">
            للأغراض التعليمية فقط
          </p>
        </div>

        <div className="mt-5 space-y-2">
          <label className="block text-right text-[13px] font-extrabold text-brand-blue">
            كلمة المرور
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="••••••"
            className={cn(
              "h-[48px] w-full rounded-[10px] border border-[hsl(214_25%_85%)] bg-white px-4 text-right text-[14px] text-brand-blue outline-none focus:border-brand-blue",
            )}
          />
        </div>

        <button
          type="submit"
          className="mt-5 h-[50px] w-full rounded-[10px] bg-brand-blue text-[15px] font-extrabold text-white shadow-soft transition-transform hover:brightness-110 active:scale-[0.99]"
        >
          دخول
        </button>

        <div className="mt-4 flex items-start gap-2 rounded-xl bg-amber-50 p-3 text-[11.5px] text-amber-800">
          <ShieldAlert className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            هذه صفحة تعليمية ولا توفر أمانًا حقيقيًا.
          </span>
        </div>
      </form>
    </main>
  );
};

export default AdminLogin;
