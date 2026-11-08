import "@/lib/i18n/tools"
import { lazy, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ChartLineData02Icon from "@hugeicons/core-free-icons/ChartLineData02Icon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"
import { useLocale } from "@/hooks/useLocale"
import { hasFxHistory } from "@/lib/fxHistory"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { orderedList } from "@/lib/marketCatalog"
import { INDICATIVE_IDS } from "@/features/widgets/lib/marketIndicative"
import { cn } from "@/lib/utils"
import { MarketChart } from "@/components/market/MarketChart"
import { MarketChartDetail } from "./market/MarketChartDetail"
import { MarketFooter } from "./market/MarketFooter"
import { MarketRow } from "./market/MarketRow"
import { rowNames, stamp } from "./market/marketFormat"
import { useIndicative } from "./market/useIndicative"
import { useMarketData } from "./market/useMarketData"
import { useMarketList } from "./market/useMarketList"
import { FrameAction, WidgetFrame } from "./WidgetFrame"
import { WidgetOverlay } from "./WidgetOverlay"
import { PageBody, Pager } from "./paging/Pager"
import { usePager } from "./paging/usePager"
import { useNarrow, useWide } from "./useNarrow"

const MarketEditor = lazy(() => import("./market/MarketEditor"))

// İçerik < 26rem: tek sütun, sayfada 3 satır (2 sütunda 3 satır sığmıyor, kart dibinde kesiliyordu).
const NARROW_PX = 416
// İçerik ≥ 46rem: iki sütun kurun yanında son 30 günün grafiği (kartın boyu değişmez).
const ROOMY_PX = 736
const ROOMY_GRID = {
  gridTemplateColumns: "minmax(0, 2fr) minmax(14rem, 1fr)",
  columnGap: "1.25rem",
}
const HIT =
  "absolute inset-0 rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
const OPTS_DAY = { day: "numeric", month: "short", timeZone: "UTC" }

/**
 * Piyasa — kişinin seçtiği en çok altı satır (`market/useMarketList`; varsayılan Dolar · Euro ·
 * gümüş · gram ve çeyrek altın · BIST 100): kurlar, altın ve BIST 100 Truncgil'den (`features/widgets/lib/market`),
 * Nijerya, Gana, Venezuela kurları günlük gösterge kaynaktan (`features/widgets/lib/marketIndicative`, "≈").
 * Başlıktaki kalem listeyi açar (`MarketEditor`: ofis kurları şehirleriyle, canlı değerler). Geniş
 * kartta iki sütun (solda kurlar, sağda altın ve endeks), dar kartta sayfada üç satır.
 * Son 30 gün (`MarketChart`, ECB'nin yayınladığı kurlarda): çok geniş kartta sağda grafik, kura
 * dokununca o kura geçer; daha dar kartta kura dokununca yanında açılır (`MarketChartDetail`).
 */
export function MarketWidget({ className }) {
  const { t, locale } = useLocale()
  const market = useMarketData()
  const list = useMarketList()
  const [editing, setEditing] = useState(false)
  const indicative = useIndicative(editing || list.ids.some((id) => INDICATIVE_IDS.has(id)))
  const byId = useMemo(
    () =>
      new Map([...(market.data?.rows ?? []), ...(indicative?.rows ?? [])].map((r) => [r.id, r])),
    [market.data, indicative],
  )
  const chosen = orderedList(list.ids)
  const loading = market.status === "loading"
  const rows = loading ? chosen : chosen.map((r) => byId.get(r.id)).filter(Boolean)
  const at = market.data?.at
  const stale = Boolean(market.data?.stale)
  const when = at ? stamp(at, locale) : null
  const body = useRef(null)
  const narrow = useNarrow(body, NARROW_PX)
  const roomy = useWide(body, ROOMY_PX)
  const pager = usePager(rows, narrow ? 3 : 6)
  // Grafiği olan kurlar (altın, BIST, gösterge kurlar için geçmiş yok); seçilmemişse ilki.
  const [pick, setPick] = useState(null)
  const [openId, setOpenId] = useState(null)
  const chartable = loading ? [] : rows.filter(hasFxHistory)
  const chartRow = chartable.find((r) => r.id === pick) ?? chartable[0] ?? null
  const showChart = roomy && chartRow
  const chartLabel = (row) => t("tools.market.chartFor", { name: rowNames(row, t, locale).long })
  const actionFor = (row) => {
    if (!hasFxHistory(row) || loading) return null
    if (showChart)
      return (
        <button
          type="button"
          aria-pressed={row.id === chartRow.id}
          aria-label={chartLabel(row)}
          onClick={() => setPick(row.id)}
          className={HIT}
        />
      )
    return (
      <WidgetOverlay
        trigger={<button type="button" aria-label={chartLabel(row)} className={HIT} />}
        title={rowNames(row, t, locale).long}
        open={openId === row.id}
        onOpenChange={(open) => setOpenId(open ? row.id : null)}
        align="start"
      >
        <MarketChartDetail row={row} />
      </WidgetOverlay>
    )
  }
  const indicativeHint = indicative?.date
    ? t("widgets.market.indicativeHint", {
        date: getDateTimeFormat(locale, OPTS_DAY).format(new Date(`${indicative.date}T12:00:00Z`)),
      })
    : undefined
  // Güncellenemediyse alt satır bunu söyler (dar kartta saat başka yerde görünmüyor).
  const source = stale
    ? t("widgets.market.stale", { time: when ?? "—" })
    : t(market.data?.source === "ecb" ? "widgets.market.sourceEcb" : "widgets.market.source")

  return (
    <WidgetFrame
      id="market"
      title={t("widgets.market.title")}
      icon={ChartLineData02Icon}
      busy={loading}
      className={className}
      pager={narrow ? <Pager pager={pager} label={t("widgets.market.title")} /> : null}
      action={
        <>
          {/* Dar kartta yenile saatiyle birlikte kartın dibinde (`MarketFooter`): başlığa yer
              kalsın ("Pi…" kesiliyordu). */}
          {!narrow && (
            <FrameAction
              onClick={market.refresh}
              aria-label={t("widgets.market.refresh")}
              title={when ? t("widgets.market.updated", { time: when }) : undefined}
            >
              {when}
              <HugeiconsIcon
                icon={RefreshIcon}
                className={cn("size-3.5", market.refreshing && "animate-spin")}
                strokeWidth={2}
              />
            </FrameAction>
          )}
          <WidgetOverlay
            trigger={
              <FrameAction
                aria-label={t("widgets.market.edit.open")}
                title={t("widgets.market.edit.open")}
                className="px-1.5"
              >
                <HugeiconsIcon icon={PencilEdit02Icon} className="size-3.5" strokeWidth={2} />
              </FrameAction>
            }
            title={t("widgets.market.edit.title")}
            open={editing}
            onOpenChange={setEditing}
            className="max-h-[min(var(--radix-popover-content-available-height),36rem)] overflow-y-auto"
          >
            <MarketEditor
              list={list}
              byId={byId}
              indicativeHint={indicativeHint}
              source={t("widgets.market.sourceAll")}
            />
          </WidgetOverlay>
        </>
      }
    >
      <div ref={body} className="flex min-h-0 flex-1 flex-col">
        {market.status === "error" ? (
          <p className="mt-3 text-[0.8125rem] leading-snug text-muted-foreground">
            {t("widgets.market.error")}
          </p>
        ) : (
          <div
            className={showChart ? "grid" : undefined}
            style={showChart ? ROOMY_GRID : undefined}
          >
            <PageBody
              pager={pager}
              className="mt-2.5 grid gap-x-3 gap-y-1 @[26rem]/widget:grid-flow-col @[26rem]/widget:grid-cols-2 @[26rem]/widget:grid-rows-3"
            >
              {pager.items.map((row) => (
                <MarketRow
                  key={row.id}
                  row={row}
                  loading={loading}
                  indicativeHint={indicativeHint}
                  compact={narrow}
                  selected={showChart && row.id === chartRow.id}
                  action={actionFor(row)}
                />
              ))}
            </PageBody>
            {showChart && (
              <MarketChart
                key={chartRow.id}
                row={chartRow}
                name={rowNames(chartRow, t, locale).short}
                named
                compact
                height={92}
                className="mt-2.5 min-w-0"
              />
            )}
          </div>
        )}
        <MarketFooter
          narrow={narrow}
          source={source}
          stale={stale}
          when={when}
          refreshing={market.refreshing}
          onRefresh={market.refresh}
        />
      </div>
    </WidgetFrame>
  )
}
