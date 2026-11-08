import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import ClockAlertIcon from "@hugeicons/core-free-icons/ClockAlertIcon"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { useLocale } from "@/hooks/useLocale"
import { useRunningLate } from "@/hooks/useRunningLate"
import { LATE_MINUTES } from "@/lib/runningLate"
import { cn } from "@/lib/utils"
import "./late.css"

/**
 * "Geç kalıyorum ▾": seçenekler gidecek cümlenin TAMAMI ("5 dakika gecikeceğim, kusura
 * bakmayın."), başlığında alıcı (yalnız düzenleyen). Seçince 8 sn geri alınabilir bildirim, sonra
 * posta (`useRunningLate`). Gönderildikten sonra düğmenin yerinde "Haber verildi".
 * `compact`: yalnız ikon (sıradaki toplantı kartı; adı ipucunda ve düğmenin adında).
 */
export function LateMenu({ event, compact = false, className }) {
  const { t } = useLocale()
  const late = useRunningLate(event)
  const icon = (
    <HugeiconsIcon
      icon={late.state === "sent" ? CheckmarkCircle02Icon : ClockAlertIcon}
      className="size-4 shrink-0"
      strokeWidth={1.8}
    />
  )

  if (late.state !== "idle") {
    const label = t(late.state === "sent" ? "calendar.late.done" : "calendar.late.waiting")
    return (
      <span role="status" className={cn(className, "cursor-default")}>
        {icon}
        <span className={compact ? "sr-only" : undefined}>{label}</span>
      </span>
    )
  }

  const label = t("calendar.late.button")
  const trigger = (
    <DropdownMenuTrigger asChild>
      <button type="button" aria-label={compact ? label : undefined} className={className}>
        {icon}
        {!compact && (
          <>
            <span>{label}</span>
            <HugeiconsIcon icon={ArrowDown01Icon} className="size-3.5 shrink-0" strokeWidth={2} />
          </>
        )}
      </button>
    </DropdownMenuTrigger>
  )
  return (
    <DropdownMenu modal={false}>
      {compact ? (
        <Tooltip>
          <TooltipTrigger asChild>{trigger}</TooltipTrigger>
          <TooltipContent>{label}</TooltipContent>
        </Tooltip>
      ) : (
        trigger
      )}
      <DropdownMenuContent align="end" className="w-72 max-w-[calc(100vw-2rem)]">
        <DropdownMenuLabel>
          {t("calendar.late.to", { name: event.organizer || event.organizerAddress })}
        </DropdownMenuLabel>
        {LATE_MINUTES.map((n) => (
          <DropdownMenuItem key={n} onSelect={() => late.choose(n)} className="late-option">
            {t("calendar.late.body", { n })}
          </DropdownMenuItem>
        ))}
        <DropdownMenuSeparator />
        <p className="px-2 py-1.5 text-[0.6875rem] leading-snug text-muted-foreground">
          {t("calendar.late.hint")}
        </p>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
