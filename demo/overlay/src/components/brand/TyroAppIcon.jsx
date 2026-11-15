import { cn } from "@/lib/utils"
import { TyroLogo } from "./TyroLogo"

/**
 * Uygulama simgesi: koyu yuvarlak köşeli kare, ortada küre (kurulum yüzeyleri). Logo kitindeki
 * macOS simgesiyle aynı kurgu; palete göre renk değiştirmez.
 */
export function TyroAppIcon({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-[28%] bg-gradient-to-b from-[#3a3a44] via-[#17171c] to-[#0b0b0e] shadow-sm ring-1 ring-black/10",
        className,
      )}
    >
      {/* Boy svg'nin KENDİSİNDE ve `!`: menü öğesi sınıfsız svg'leri küçültüyor. */}
      <TyroLogo className="!size-[62%]" />
    </span>
  )
}
