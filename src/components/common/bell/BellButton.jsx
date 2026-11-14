import { HugeiconsIcon } from "@hugeicons/react"
import BellRingIcon from "@hugeicons/core-free-icons/BellRingIcon"
import Notification01Icon from "@hugeicons/core-free-icons/Notification01Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

// Header'ın öteki ikon düğmeleriyle aynı ölçü ve vurgu (36 px, dokunmatikte görünmez payla
// 44 px; açıkken vurgu kapsülü — yapışkan açılış rengini bu kapsülden alır).
const BTN =
  "relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-foreground transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 aria-expanded:bg-accent [&_svg]:size-5 pointer-coarse:after:absolute pointer-coarse:after:-inset-1"

/**
 * Bildirim çanı düğmesi (`BellPopover`) — header'da, yalnız ikon. Rozet GÖRÜLMEMİŞLERİN sayısı;
 * varken çalan çan, yokken sakin çan; rozet çanın köşesinde, rengi paletten (`--badge`). Pencerenin
 * tetiği olarak çağrılır: gelen öznitelikler ve `ref` düğmeye geçer. `data-bell-trigger`: telefonun
 * karşılama çekmecesi paneli bu düğmeye basarak açar.
 */
export function BellButton({ badge = 0, ref, className, ...props }) {
  const { t } = useLocale()
  const count = badge > 9 ? "9+" : String(badge)
  // Ad rozetteki sayıyla başlar: görünen yazı adın içinde olsun (sesle seçen bulsun).
  const label = badge > 0 ? t("bell.aria", { n: count }) : t("bell.title")
  return (
    <button
      type="button"
      ref={ref}
      data-bell-trigger=""
      {...props}
      aria-label={label}
      className={cn(BTN, className)}
    >
      <span className="relative grid place-items-center">
        <HugeiconsIcon icon={badge > 0 ? BellRingIcon : Notification01Icon} strokeWidth={1.8} />
        {badge > 0 && (
          <span
            aria-hidden="true"
            className="absolute -right-1.5 -top-1.5 grid h-[0.9375rem] min-w-[0.9375rem] place-items-center rounded-full bg-badge px-1 text-[0.5625rem] font-bold leading-none text-badge-foreground ring-2 ring-background"
          >
            {count}
          </span>
        )}
      </span>
    </button>
  )
}
