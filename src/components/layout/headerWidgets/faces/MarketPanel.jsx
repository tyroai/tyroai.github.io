import { HugeiconsIcon } from "@hugeicons/react"
import ChartLineData02Icon from "@hugeicons/core-free-icons/ChartLineData02Icon"
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { motion, useReducedMotion } from "motion/react"
import { ChangePill, MarketRow } from "@/features/widgets/market/MarketRow"
import { price, rowNames, stamp } from "@/features/widgets/market/marketFormat"
import { useMarketData } from "@/features/widgets/market/useMarketData"
import { useMarketList } from "@/features/widgets/market/useMarketList"
import { useLookProps } from "@/features/widgets/lookProps"
import { CardInkContext } from "@/features/widgets/useBrandInk"
import { useLocale } from "@/hooks/useLocale"
import { MARKET_CATALOG, orderedList } from "@/lib/marketCatalog"
import { cn } from "@/lib/utils"
import { MARKET_FACE_MAX, toggleCode } from "../faceOptions"
import { headerFaceOf, setHeaderFace, useHeaderWidgets } from "../headerStore"
import { RollText } from "@/components/common/RollText"

const CHIP =
  "hc-chip inline-flex h-7 shrink-0 items-center gap-1 rounded-full border border-border bg-background px-2.5 text-[0.75rem] font-medium transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-9"

/** Seçilen kurun büyük karosu: kısa ad, değer (kayarak değişir) ve değişim hapı. */
function QuoteTile({ row, wide, delay }) {
  const { t, locale } = useLocale()
  const reduce = useReducedMotion()
  const names = rowNames(row, t, locale)
  return (
    <motion.div
      initial={reduce ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, delay, ease: [0.2, 0.9, 0.25, 1] }}
      className={cn("rounded-2xl p-3 ring-1 ring-foreground/[0.06]", wide && "col-span-2")}
    >
      <p title={names.long} className="truncate text-[0.75rem] font-medium text-muted-foreground">
        {names.short}
      </p>
      <p className="mt-1 text-[1.5rem] leading-none font-semibold tabular-nums">
        <RollText text={price(row, locale)} />
      </p>
      {row.change != null && <ChangePill change={row.change} className="mt-2" />}
    </motion.div>
  )
}

/**
 * Header'daki Piyasa'nın kendi penceresi: header'da görünen kurlar büyük karolarda (değer kayarak
 * değişir), sonra header'da
 * hangi kurların görüneceği (en çok iki — tepsiye anında geçer) ve listenin geri kalanı;
 * güncelleme saati ve yenile. Veri kartla aynı önbellekten.
 */
export default function MarketPanel({ look }) {
  const [lookProps, ink] = useLookProps("market", look, "flex flex-col")
  return (
    <div {...lookProps}>
      <CardInkContext.Provider value={ink}>
        <Panel />
      </CardInkContext.Provider>
    </div>
  )
}

function Panel() {
  const { t, locale } = useLocale()
  const market = useMarketData()
  const list = useMarketList()
  const { faces } = useHeaderWidgets()
  const face = headerFaceOf(faces, "market")
  const byId = new Map((market.data?.rows ?? []).map((r) => [r.id, r]))
  const tiles = face.codes.map((id) => byId.get(id)).filter(Boolean)
  const rest = orderedList(list.ids)
    .map((r) => byId.get(r.id))
    .filter((r) => r && !face.codes.includes(r.id))
  const at = market.data?.at
  return (
    <section
      aria-label={t("widgets.market.title")}
      className="ms-surface flex max-h-[min(var(--radix-popover-content-available-height),36rem)] flex-col overflow-y-auto overscroll-contain rounded-[1.75rem] p-5"
    >
      <header className="flex items-center justify-between gap-2">
        <h3 className="flex items-center gap-2 text-[0.8125rem] font-medium text-muted-foreground">
          <HugeiconsIcon
            icon={ChartLineData02Icon}
            className="widget-frame-icon size-4 text-brand"
            strokeWidth={1.8}
          />
          {t("widgets.market.title")}
        </h3>
        <span className="flex items-center gap-1 text-[0.75rem] text-muted-foreground">
          {at && <span className="tabular-nums">{stamp(at, locale)}</span>}
          <button
            type="button"
            onClick={market.refresh}
            aria-label={t("widgets.market.refresh")}
            title={t("widgets.market.refresh")}
            className="grid size-7 place-items-center rounded-full transition hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:size-9"
          >
            <HugeiconsIcon
              icon={RefreshIcon}
              className={cn("size-3.5", market.refreshing && "animate-spin")}
              strokeWidth={2}
            />
          </button>
        </span>
      </header>
      {market.status === "loading" ? (
        <div aria-hidden="true" className="mt-3 grid grid-cols-2 gap-2">
          <span className="ms-skeleton block h-24 rounded-2xl" />
          <span className="ms-skeleton block h-24 rounded-2xl" />
        </div>
      ) : (
        <div className="mt-3 grid grid-cols-2 gap-2">
          {tiles.map((row, i) => (
            <QuoteTile key={row.id} row={row} wide={tiles.length === 1} delay={i * 0.06} />
          ))}
        </div>
      )}
      <div className="mt-3">
        <p className="text-[0.75rem] font-medium text-muted-foreground">
          {t("headerWidgets.catalog.codes", { n: MARKET_FACE_MAX })}
        </p>
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {MARKET_CATALOG.filter(
            (r) => r.key && (list.ids.includes(r.id) || face.codes.includes(r.id)),
          ).map((r) => {
            const on = face.codes.includes(r.id)
            return (
              <button
                key={r.id}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  setHeaderFace("market", { ...face, codes: toggleCode(face.codes, r.id) })
                }
                className={CHIP}
              >
                {on && <HugeiconsIcon icon={Tick02Icon} className="size-3" strokeWidth={2.4} />}
                {rowNames(r, t, locale).short}
              </button>
            )
          })}
        </div>
      </div>
      {rest.length > 0 && (
        <ul className="mt-3 border-t border-border/70 pt-2">
          {rest.map((row) => (
            <MarketRow key={row.id} row={row} />
          ))}
        </ul>
      )}
      <p className="mt-3 text-[0.6875rem] text-muted-foreground">{t("widgets.market.source")}</p>
    </section>
  )
}
