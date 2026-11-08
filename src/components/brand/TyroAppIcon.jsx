import { cn } from "@/lib/utils"
import { TyroLogo } from "./TyroLogo"

// İşaret paletin "üstündeki" rengiyle: açık paletlerde (Peach Sorbet, Sunset) beyaz kaybolurdu.
const MARK = {
  gradStart: "currentColor",
  gradEnd: "color-mix(in oklch, currentColor 78%, transparent)",
  fillA: "color-mix(in oklch, currentColor 90%, transparent)",
  fillB: "currentColor",
  fillC: "color-mix(in oklch, currentColor 70%, transparent)",
}

/** Uygulama simgesi: paletin gradyanında yuvarlak köşeli kare, ortada TYRO işareti (kurulum yüzeyleri). */
export function TyroAppIcon({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "grid shrink-0 place-items-center rounded-[28%] bg-gradient-to-br from-brand-from via-brand-via to-brand-to shadow-sm ring-1 ring-black/5",
        className,
      )}
    >
      {/* Renk ve boy svg'nin KENDİSİNDE ve `!`: menü öğesi sınıfsız svg'leri küçültüyor, odakta
          bütün çocukların rengini `accent-foreground`a çekiyor. */}
      <TyroLogo themeColors={MARK} className="size-[64%] !text-brand-on-ramp" />
    </span>
  )
}
