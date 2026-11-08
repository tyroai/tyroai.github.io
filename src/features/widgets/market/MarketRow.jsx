import { useState } from "react"
import { RollText } from "@/components/common/RollText"
import { useLocale } from "@/hooks/useLocale"
import { getNumberFormat } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { price, rowNames } from "./marketFormat"
import "./market.css"

const TREND = {
  // Durum dili (tasarım sistemi): yazı `-ink` tonunda, açık ve koyu temada AA.
  up: "bg-success/10 text-success-ink",
  down: "bg-danger/10 text-danger-ink",
  flat: "bg-muted text-foreground/75",
}
const PCT = { minimumFractionDigits: 2, maximumFractionDigits: 2 }

/** Değişim hapı: renk VE ok (renk tek başına anlam taşımasın); yön ekran okuyucuya söylenir. */
export function ChangePill({ change, className }) {
  const { t, locale } = useLocale()
  const trend = change > 0 ? "up" : change < 0 ? "down" : "flat"
  return (
    <span
      data-trend={trend}
      className={cn(
        "market-chg inline-flex h-5 shrink-0 items-center gap-0.5 rounded-md px-1 text-[0.6875rem] font-semibold tabular-nums",
        TREND[trend],
        className,
      )}
    >
      <span aria-hidden="true">{trend === "up" ? "▲" : trend === "down" ? "▼" : "•"}</span>
      <span className="sr-only">{t(`widgets.market.${trend}`)}</span>
      <span className="market-chg-num">
        {getNumberFormat(locale, PCT).format(Math.abs(change))}%
      </span>
    </span>
  )
}

/**
 * İzleme listesinin satırı: ad · değer · değişim hapı. Gösterge kur (günlük, işlem kuru değil)
 * "≈" ile ve ipucunda tarihiyle; değişimi yok. `compact`: dar kart — ad kısalır ("Gram"), değer
 * kesilmez. `action`: satırın tamamını kaplayan dokunma öğesi (kartta grafiği açar ya da seçer);
 * `selected`: grafiği gösterilen satır.
 */
export function MarketRow({
  row,
  loading,
  indicativeHint,
  compact = false,
  action = null,
  selected = false,
}) {
  const { t, locale } = useLocale()
  const names = rowNames(row, t, locale)
  const label = compact ? names.tiny : names.short
  // Değer değişince yönüyle bir "tik" (önceki değer çizim sırasında saklanır; ilk gelişte yok).
  const [last, setLast] = useState(row.value)
  const [tick, setTick] = useState(null)
  if (row.value !== last) {
    setLast(row.value)
    if (!loading && last != null && row.value != null)
      setTick((p) => ({ dir: row.value > last ? "up" : "down", n: (p?.n ?? 0) + 1 }))
  }
  return (
    <li
      className={cn(
        "relative isolate flex h-8 min-w-0 items-center gap-2 rounded-lg px-1.5 transition-colors hover:bg-muted/60",
        selected && "bg-muted/60",
      )}
    >
      {tick && (
        <span key={tick.n} aria-hidden="true" data-dir={tick.dir} className="market-flash" />
      )}
      <span
        title={names.long}
        className="min-w-0 flex-1 truncate text-[0.75rem] text-muted-foreground"
      >
        {label}
        {names.long !== label && <span className="sr-only">, {names.long}</span>}
      </span>
      {loading ? (
        <span aria-hidden="true" className="ms-skeleton block h-3.5 w-24 rounded-full" />
      ) : (
        <>
          <span
            title={row.indicative ? indicativeHint : undefined}
            className="shrink-0 text-[0.8125rem] font-semibold tabular-nums"
          >
            {row.indicative && (
              <span aria-hidden="true" className="me-0.5 font-normal text-muted-foreground">
                ≈
              </span>
            )}
            <RollText text={price(row, locale)} />
            {row.indicative && <span className="sr-only"> ({t("widgets.market.indicative")})</span>}
          </span>
          {row.change != null && <ChangePill change={row.change} />}
        </>
      )}
      {action}
    </li>
  )
}
