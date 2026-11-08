import { HugeiconsIcon } from "@hugeicons/react"
import BellRingIcon from "@hugeicons/core-free-icons/BellRingIcon"
import Notification01Icon from "@hugeicons/core-free-icons/Notification01Icon"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocale } from "@/hooks/useLocale"

/**
 * Bildirim çanı düğmesi (`bell/BellPopover`) — header'da, yalnız ikon (saat ve tarih Anasayfa'nın
 * kaşında; dünya saati çentikte). Rozet GÖRÜLMEMİŞLERİN sayısı; varken çalan
 * çan, yokken sakin çan; rozet çanın köşesinde, rengi paletten (`--badge`). Popover tetiği olarak
 * çağrılır: gelen öznitelikler ve `ref` düğmeye geçer.
 */
export function SpecialDaysButton({ badge = 0, ref, ...props }) {
  const { t } = useLocale()
  const count = badge > 9 ? "9+" : String(badge)
  // Ad rozetteki sayıyla başlar: görünen yazı adın içinde olsun (sesle seçen bulsun).
  const label = badge > 0 ? t("bell.aria", { n: count }) : t("bell.title")
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <button
          type="button"
          ref={ref}
          {...props}
          aria-label={label}
          className="relative flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-foreground transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 [&_svg]:size-5 pointer-coarse:after:absolute pointer-coarse:after:-inset-1"
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
      </TooltipTrigger>
      <TooltipContent side="bottom" sideOffset={6}>
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
