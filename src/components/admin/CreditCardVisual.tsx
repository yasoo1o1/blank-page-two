import { cn } from "@/lib/utils";
import visaLogo from "@/assets/payments/visa.svg";
import mastercardLogo from "@/assets/payments/mastercard.svg";
import madaLogo from "@/assets/payments/mada.svg";
import { Wifi } from "lucide-react";

type Props = {
  number?: string;
  name?: string;
  expMonth?: string | number;
  expYear?: string | number;
  cvv?: string;
  brand?: string;
  className?: string;
};

const brandTheme = (brand?: string) => {
  switch (brand) {
    case "visa":
      return "from-[#1a1f71] via-[#2a3490] to-[#0d1240]";
    case "mastercard":
      return "from-[#1a1a2e] via-[#3a2a3e] to-[#0a0a14]";
    case "mada":
      return "from-[#0b3d2e] via-[#0e6b4e] to-[#072a20]";
    default:
      return "from-slate-800 via-slate-700 to-slate-900";
  }
};

const brandLogo = (brand?: string) => {
  if (brand === "visa") return visaLogo;
  if (brand === "mastercard") return mastercardLogo;
  if (brand === "mada") return madaLogo;
  return null;
};

const CreditCardVisual = ({
  number,
  name,
  expMonth,
  expYear,
  cvv,
  brand,
  className,
}: Props) => {
  const logo = brandLogo(brand);
  const display = number || "•••• •••• •••• ••••";
  const exp =
    expMonth || expYear ? `${expMonth ?? "••"}/${String(expYear ?? "••").slice(-2)}` : "••/••";

  return (
    <div
      className={cn(
        "relative aspect-[1.586/1] w-full overflow-hidden rounded-2xl bg-gradient-to-br p-4 text-white shadow-lg sm:p-5",
        brandTheme(brand),
        className,
      )}
      dir="ltr"
    >
      {/* Decorative shine */}
      <div className="pointer-events-none absolute -right-10 -top-10 h-40 w-40 rounded-full bg-white/10 blur-2xl" />
      <div className="pointer-events-none absolute -bottom-12 -left-8 h-40 w-40 rounded-full bg-white/5 blur-2xl" />

      {/* Top row: chip + brand */}
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          {/* Chip */}
          <div className="h-8 w-10 rounded-md bg-gradient-to-br from-amber-200 via-amber-400 to-amber-600 shadow-inner ring-1 ring-amber-700/30">
            <div className="m-1 grid h-[calc(100%-8px)] w-[calc(100%-8px)] grid-cols-3 grid-rows-3 gap-[1px] opacity-50">
              {Array.from({ length: 9 }).map((_, i) => (
                <div key={i} className="bg-amber-800/40" />
              ))}
            </div>
          </div>
          <Wifi className="h-4 w-4 rotate-90 text-white/80" />
        </div>
        {logo ? (
          <img src={logo} alt={brand} className="h-7 w-auto brightness-0 invert" />
        ) : (
          <span className="text-[11px] font-bold uppercase tracking-wider text-white/80">
            CARD
          </span>
        )}
      </div>

      {/* Number */}
      <div className="mt-5 font-mono text-[16px] font-bold tracking-[0.18em] sm:text-[18px]">
        {display}
      </div>

      {/* Bottom row */}
      <div className="mt-4 flex items-end justify-between gap-3">
        <div className="min-w-0 flex-1">
          <div className="text-[8.5px] font-bold uppercase tracking-wider text-white/60">
            Card Holder
          </div>
          <div className="mt-0.5 truncate text-[12px] font-bold uppercase tracking-wide">
            {name || "—"}
          </div>
        </div>
        <div>
          <div className="text-[8.5px] font-bold uppercase tracking-wider text-white/60">
            Expires
          </div>
          <div className="mt-0.5 font-mono text-[12px] font-bold">{exp}</div>
        </div>
        {cvv && (
          <div>
            <div className="text-[8.5px] font-bold uppercase tracking-wider text-white/60">
              CVV
            </div>
            <div className="mt-0.5 font-mono text-[12px] font-bold">{cvv}</div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CreditCardVisual;
