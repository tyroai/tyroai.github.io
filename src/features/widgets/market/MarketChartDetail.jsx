import { RollText } from "@/components/common/RollText"
import { useLocale } from "@/hooks/useLocale"
import { MarketChart } from "@/components/market/MarketChart"
import { ChangePill } from "./MarketRow"
import { price, rowNames } from "./marketFormat"

/**
 * Dar Piyasa kartında bir kura dokununca açılan ayrıntı (masaüstünde satırın yanında pencere,
 * telefonda alttan çekmece — `WidgetOverlay`): kurun adı, büyük değeri, değişimi ve son 30 günü.
 */
export function MarketChartDetail({ row }) {
  const { t, locale } = useLocale()
  const names = rowNames(row, t, locale)
  return (
    <div className="px-4 pt-3 pb-4">
      <p className="text-[1.5rem] leading-none font-semibold tabular-nums">
        <RollText text={price(row, locale)} />
      </p>
      {row.change != null && <ChangePill change={row.change} className="mt-2" />}
      <MarketChart row={row} name={names.short} />
    </div>
  )
}
