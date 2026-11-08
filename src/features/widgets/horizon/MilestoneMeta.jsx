import { useLocale } from "@/hooks/useLocale"
import { stepsProgress } from "@/lib/horizon"
import { cn } from "@/lib/utils"
import { countdownPhrase, countdownText } from "./horizonFormat"
import "@/components/common/fill.css"

// Kalan sürenin rengi: sıradaki marka mürekkebi, gecikmiş kırmızı, biten yeşil, gerisi sessiz.
const WHEN = {
  next: "font-semibold text-brand-ink",
  late: "font-semibold text-danger-ink",
  done: "font-medium text-success-ink",
  base: "font-medium text-foreground/75",
}

const CIRC = 2 * Math.PI * 6

/** Adımların küçük halkası ve sayısı: "◔ 2/5". */
function StepsMeter({ progress }) {
  const share = progress.total ? progress.done / progress.total : 0
  return (
    <span className="hz-meta-steps inline-flex shrink-0 items-center gap-1 font-medium tabular-nums">
      <svg viewBox="0 0 16 16" className="size-3 -rotate-90" aria-hidden="true">
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke="currentColor"
          strokeOpacity="0.25"
          strokeWidth="2.4"
        />
        <circle
          cx="8"
          cy="8"
          r="6"
          fill="none"
          stroke="var(--brand-text)"
          strokeWidth="2.4"
          strokeLinecap="round"
          strokeDasharray={`${share * CIRC} ${CIRC}`}
          className="fx-ring"
        />
      </svg>
      <span>
        {progress.done}/{progress.total}
      </span>
    </span>
  )
}

/**
 * Hedefin bilgi satırı: kalan süre (renkli; gecikmişte "3 gün gecikti") · adımlar. Liste adı yalnız
 * istenince (`list`: "+n hedef"in tam listesi) — kartın maddelerinde yok, ayrıntıda var. Yol
 * haritasında satır ortalı. Dar kartta adımlar düşer (`horizon.css`): kalan süre hep görünür.
 */
export function MilestoneMeta({ item, tone, cd, road = false, list = false, className }) {
  const { t, locale } = useLocale()
  const progress = stepsProgress(item.steps)
  const when = item.done
    ? t("widgets.horizon.doneState")
    : cd.late
      ? countdownPhrase(cd, t, locale)
      : countdownText(cd, t, locale)
  return (
    <span
      className={cn(
        "flex min-w-0 items-center gap-1.5 text-[0.75rem] text-muted-foreground",
        road && "justify-center text-[0.6875rem]",
        className,
      )}
    >
      <span className={cn("shrink-0 tabular-nums", WHEN[tone])}>{when}</span>
      {list && item.listName && (
        <>
          <span aria-hidden="true" className="hz-meta-list">
            ·
          </span>
          <span className="hz-meta-list truncate">{item.listName}</span>
        </>
      )}
      {progress && <StepsMeter progress={progress} />}
    </span>
  )
}
