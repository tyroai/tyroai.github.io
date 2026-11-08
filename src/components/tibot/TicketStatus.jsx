import "@/lib/i18n/tibot"
import { HugeiconsIcon } from "@hugeicons/react"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import { useLocale } from "@/hooks/useLocale"
import { statusKey, statusLabel, statusTone } from "@/lib/tibot/tibotModel"
import { cn } from "@/lib/utils"

// Self Servis'in durum dili (`selfservice/kinds.js` › TONE_CLASS) ile aynı renkler.
const TONE = {
  success: "bg-emerald-500/12 text-emerald-800 dark:text-emerald-300",
  warning: "bg-amber-500/15 text-amber-800 dark:text-amber-300",
  danger: "bg-destructive/12 text-red-700 dark:text-red-300",
  info: "bg-brand/10 text-brand-ink",
  neutral: "bg-muted text-foreground/70",
}
const PILL =
  "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 text-[0.6875rem] font-medium"

/** Durum hapı; `mine`: kendi açtığın talep ("Senden yanıt bekleniyor"). */
export function TicketStatus({ row, mine = false, className }) {
  const { t } = useLocale()
  const key = statusKey(row)
  return (
    <span className={cn(PILL, TONE[statusTone(key)], className)}>{statusLabel(t, key, mine)}</span>
  )
}

/** Hedefi geçmiş talebin işareti: kırmızı saat + "Gecikti". */
export function OverdueBadge({ className }) {
  const { t } = useLocale()
  return (
    <span className={cn(PILL, TONE.danger, className)}>
      <HugeiconsIcon icon={Clock01Icon} className="size-3" strokeWidth={2} aria-hidden="true" />
      {t("tibot.overdue")}
    </span>
  )
}
