import { useLocale } from "@/hooks/useLocale"
import { countdown } from "@/lib/horizon"
import { localDayKey } from "@/lib/todo"
import { cn } from "@/lib/utils"
import { countdownPhrase, countdownShort } from "../horizon/horizonFormat"

/**
 * Bayraklı postanın vadesi, kısa: "Bugün" · "−2g" (kırmızı, gecikti) · "3g". Ekran okuyucuya
 * tam cümle ("Vade: 2 gün gecikti"). Vadesiz postada çizilmez.
 */
export function DueChip({ due, now }) {
  const { t, locale } = useLocale()
  if (!due) return null
  const cd = countdown(localDayKey(new Date(now)), due)
  return (
    <span
      className={cn(
        "shrink-0 text-[0.6875rem] font-semibold tabular-nums",
        cd.late
          ? "text-danger-ink"
          : cd.kind === "today"
            ? "text-warning-ink"
            : "text-muted-foreground",
      )}
    >
      <span aria-hidden="true">{countdownShort(cd, t)}</span>
      <span className="sr-only">
        {t("widgets.mail.due", { when: countdownPhrase(cd, t, locale) })}
      </span>
    </span>
  )
}
