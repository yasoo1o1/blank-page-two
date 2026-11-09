import { useEffect, useState } from "react";
import { ShieldCheck, UserRound, Users } from "lucide-react";
import { subscribeAdminPresence } from "@/lib/site-settings";

const AdminsPanel = () => {
  const [count, setCount] = useState(0);
  useEffect(() => subscribeAdminPresence(setCount), []);

  return (
    <div className="rounded-2xl border border-white/60 bg-white/80 p-6 shadow-card backdrop-blur-xl">
      <div className="flex items-center gap-3 border-b border-border/70 pb-4">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-violet-100 text-violet-700">
          <ShieldCheck className="h-5 w-5" />
        </span>
        <div className="leading-tight">
          <h2 className="text-[15px] font-extrabold text-brand-blue">المسؤولون</h2>
          <p className="text-[12px] text-muted-foreground">
            حسابات المسؤولين المتصلين حاليًا بلوحة التحكم
          </p>
        </div>
      </div>

      <div className="mt-6 grid gap-3 sm:grid-cols-2">
        <div className="relative overflow-hidden rounded-2xl border border-violet-200/70 bg-gradient-to-br from-violet-50 to-white p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-violet-600 text-white shadow-soft">
              <Users className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <p className="text-[12px] font-bold text-muted-foreground">
                عدد المسؤولين المتصلين الآن
              </p>
              <p className="mt-1 text-[28px] font-extrabold tabular-nums text-violet-700">
                {count}
              </p>
            </div>
            <span className="ms-auto relative flex h-2.5 w-2.5">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
          </div>
          <p className="mt-3 text-[11.5px] text-muted-foreground">
            يشمل الجلسات المفتوحة حاليًا لكل مسؤول من جهاز/متصفح مختلف.
          </p>
        </div>

        <div className="rounded-2xl border border-border/60 bg-white/70 p-5">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-brand-blue/10 text-brand-blue">
              <UserRound className="h-5 w-5" />
            </span>
            <div className="text-right leading-tight">
              <p className="text-[13.5px] font-extrabold text-brand-blue">المسؤول الرئيسي</p>
              <p className="text-[12px] text-muted-foreground">صلاحيات كاملة على اللوحة</p>
            </div>
            <span className="ms-auto rounded-full bg-emerald-100 px-3 py-1 text-[11.5px] font-extrabold text-emerald-700">
              نشِط
            </span>
          </div>
          <p className="mt-3 text-center text-[11.5px] text-muted-foreground">
            لتغيير كلمة المرور استخدم زر «كلمة المرور».
          </p>
        </div>
      </div>
    </div>
  );
};

export default AdminsPanel;
