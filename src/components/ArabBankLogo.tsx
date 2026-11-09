import logoColor from "@/assets/arab-bank-logo.svg";
import logoWhite from "@/assets/arab-bank-logo-white.svg";

export function ArabBankLogo({
  variant = "color",
  className = "",
}: {
  variant?: "color" | "white";
  className?: string;
}) {
  const src = variant === "white" ? logoWhite : logoColor;
  return (
    <img
      src={src}
      alt="البنك العربي - Arab Bank"
      className={`h-[52px] w-auto shrink-0 object-contain ${className}`}
      dir="rtl"
    />
  );
}
