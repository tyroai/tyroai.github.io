import { useLogoOrb } from "@/lib/logoOrb"
import { cn } from "@/lib/utils"
import { TyroLogo } from "./TyroLogo"

/**
 * Uygulama simgesi: yuvarlak köşeli kare, ortada logonun küresi (kurulum yüzeyleri). Logo kitindeki
 * macOS simgesiyle aynı kurgu; palete göre renk değiştirmez. Karo kürenin görünümüne göre seçilir:
 * obsidyen kürede açık (siyah küre koyu karoda kayboluyor), renkli kürede koyu.
 */
export function TyroAppIcon({ className }) {
  const obsidian = useLogoOrb() === "obsidyen"
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-[28%] bg-gradient-to-b shadow-sm ring-1 ring-black/10",
        obsidian ? "from-white via-[#f4f4f7] to-[#e4e4ea]" : "from-[#3a3a44] via-[#17171c] to-[#0b0b0e]",
        className,
      )}
    >
      {/* Boy svg'nin KENDİSİNDE ve `!`: menü öğesi sınıfsız svg'leri küçültüyor. */}
      <TyroLogo className="!size-[62%]" />
    </span>
  )
}
