import { useMinuteNow } from "@/features/myspace/useMinuteNow"
import { useLocale } from "@/hooks/useLocale"
import { countdown, headlineMilestone, paceOf } from "@/lib/horizon"
import { localDayKey } from "@/lib/todo"
import { cn } from "@/lib/utils"
import { countdownPhrase, countdownShort } from "./horizonFormat"
import { useHorizon } from "./useHorizon"

/**
 * Header tepsisinde Ufukta'nın kısa bilgisi: sıradaki hedefe kalan süre kısaltmayla ("3g" · "3a" ·
 * "2s"), yoksa en eski gecikmiş ("−3g", kırmızımsı); sıradaki hedef riskteyse kehribar (`paceOf`).
 * Hedef yoksa yalnız ikon kalır. Ekran okuyucuya tam cümle ("3 gün kaldı, riskte"): kısaltma
 * düğmenin adında anlamsız kalırdı.
 */
export function HorizonLabel({ className }) {
  const ind = useHorizonIndicator()
  if (!ind) return null
  return (
    <span
      className={cn(
        "text-[0.8125rem] leading-none font-semibold tabular-nums",
        ind.late && "text-danger-ink",
        ind.risk && "text-warning-ink",
        className,
      )}
    >
      <span aria-hidden="true">{ind.text}</span>
      <span className="sr-only">{ind.sr}</span>
    </span>
  )
}

/** Tepsi ve çentik ortak: kısaltma, tam cümle; gecikmiş ya da riskteyse `alert`. Hedef yoksa `null`. */
function useHorizonIndicator() {
  const { t, locale } = useLocale()
  const now = useMinuteNow()
  const { status, items } = useHorizon()
  if (status !== "ready") return null
  const today = localDayKey(new Date(now))
  const head = headlineMilestone(items, today)
  if (!head) return null
  const cd = countdown(today, head.dueKey)
  const risk = paceOf(head, today)?.kind === "risk"
  return {
    text: countdownShort(cd, t),
    sr: [countdownPhrase(cd, t, locale), risk && t("widgets.horizon.pace.risk")]
      .filter(Boolean)
      .join(", "),
    late: Boolean(cd.late),
    risk,
    alert: Boolean(cd.late) || risk,
  }
}

/** Çentik göstergesinin kaynağı (`notch/SlotIndicator`): değeri çocuğa verir; hook dışa açılmaz. */
export function HorizonIndicator({ children }) {
  return children(useHorizonIndicator())
}
