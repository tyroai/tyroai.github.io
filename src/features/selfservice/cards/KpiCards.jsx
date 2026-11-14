import { useState } from "react"
import { AnimatedCounter } from "@/components/common/AnimatedCounter"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { money, number, totalsList } from "../kinds"
import { SummarySheet, TileBody } from "../summary/SummarySheet"
import { useSummaryTiles } from "../summary/useSummaryTiles"

/** İzin kartının çizgisi: kullanılan / hak. */
function UsedBar({ share }) {
  return (
    <span aria-hidden="true" className="ssc-bar-track">
      <i className="ssc-bar-fill" style={{ "--share": share }} />
    </span>
  )
}

/**
 * Para kartının durum çubuğu: onaylı · onayda · toplam dışı kayıtların payı, altında adlarıyla.
 * Toplama yalnız onaylılar girer; çubuk geri kalanın nerede durduğunu gösterir.
 */
function StatusBar({ part }) {
  const { t, locale } = useLocale()
  const pending = part.pending ?? 0
  const other = Math.max(0, (part.excluded?.count ?? 0) - pending)
  const items = [
    { id: "approved", n: part.count ?? 0, key: "selfService.cards.approved" },
    { id: "pending", n: pending, key: "selfService.tile.pendingOnly" },
    { id: "other", n: other, key: "selfService.tile.excluded" },
  ].filter((x) => x.n > 0)
  if (!items.length) return <UsedBar share={0} />
  return (
    <>
      <span aria-hidden="true" className="ssc-status">
        {items.map((x) => (
          <i key={x.id} data-kind={x.id} style={{ flexGrow: x.n }} />
        ))}
      </span>
      <span className="ssc-legend">
        {items.map((x) => (
          <span key={x.id} data-kind={x.id}>
            <i aria-hidden="true" />
            {t(x.key, { n: number(x.n, locale) })}
          </span>
        ))}
      </span>
    </>
  )
}

function KpiFace({ tile, part, rest, loading }) {
  const { t, locale } = useLocale()
  const isLeave = tile.tab.id === "leave"
  return (
    <>
      <span className="ssc-kpi-head">
        <span className="ssc-eyebrow">{tile.title}</span>
        {loading ? (
          <span aria-hidden="true" className="ms-skeleton ssc-skel-value" />
        ) : (
          <span data-private="" title={tile.full} className="ssc-kpi-value">
            <span aria-hidden={tile.full ? "true" : undefined}>
              {tile.counter ? (
                <>
                  {/* Rakam büyük, birimi ("gün") yanında küçük: prototipteki gibi. */}
                  {tile.counter.prefix}
                  <AnimatedCounter
                    value={tile.counter.value}
                    options={tile.counter.options}
                    locale={locale}
                    fallback={tile.value}
                  />
                  {tile.counter.suffix?.trim() && (
                    <span className="ssc-kpi-unit">{tile.counter.suffix.trim()}</span>
                  )}
                </>
              ) : (
                tile.value
              )}
            </span>
            {tile.full && <span className="sr-only">{tile.full}</span>}
          </span>
        )}
      </span>
      {!loading &&
        (isLeave ? (
          <>
            {tile.progress != null && <UsedBar share={tile.progress} />}
            <span data-private="" className="ssc-kpi-note">
              {tile.caption}
            </span>
            {tile.note && (
              <span data-private="" className="ssc-kpi-strong">
                {tile.note}
              </span>
            )}
          </>
        ) : part ? (
          <>
            <StatusBar part={part} />
            {rest ? (
              <span data-private="" className="ssc-kpi-note">
                {t("selfService.cards.also", { amounts: rest })}
              </span>
            ) : (
              // Toplam dışı ya da onaydaki kayıt varken: toplamın kuralı tek cümleyle.
              tile.hint && <span className="ssc-kpi-note">{t("selfService.cards.totalsNote")}</span>
            )}
          </>
        ) : (
          // Okunamayan bölüm: çubuk yok, nedeni yazılır.
          <span className="ssc-kpi-note">{tile.caption}</span>
        ))}
      {tile.hint && <span className="sr-only">{tile.hint}</span>}
      {/* Kartın adı görünen yazısıdır; okuyucuya basınca ne olacağı da söylenir. */}
      {!loading && <span className="sr-only">{t("selfService.tile.detail.open")}</span>}
    </>
  )
}

/**
 * Kartlar düzeninin üç göstergesi (izin bakiyesi · dönemin masrafları · dönemin iş avansları):
 * standart özetle aynı veri (`useSummaryTiles`), her biri ayrı kartta ve çubuğuyla. Karta basınca
 * ayrıntısı açılır: ince işaretçide kartın altında, dokunmatikte alttan çekmecede.
 */
export function KpiCards({ data, summary, year, accrual, loading }) {
  const { locale } = useLocale()
  const box = useSummaryTiles({ data, summary, year, accrual })
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)")
  const [sheet, setSheet] = useState(null)
  const partOf = (tile) => (box.off[tile.tab.id] ? null : summary?.[tile.tab.id])
  const restOf = (tile) =>
    totalsList(partOf(tile)?.totals)
      .slice(1)
      .map(([c, a]) => money(a, c, locale))
      .join(" · ")
  return (
    <div data-tour="ss-summary" className="ssc-kpis">
      {box.tiles.map((tile, i) => {
        const face = (
          <KpiFace
            tile={tile}
            part={tile.tab.id === "leave" ? null : partOf(tile)}
            rest={tile.tab.id === "leave" ? "" : restOf(tile)}
            loading={loading}
          />
        )
        if (loading)
          return (
            <div key={tile.tab.id} className="ssc-card ssc-kpi">
              {face}
            </div>
          )
        if (!fine)
          return (
            <button
              key={tile.tab.id}
              type="button"
              aria-haspopup="dialog"
              onClick={() => setSheet(tile.tab.id)}
              className="ssc-card ssc-kpi"
            >
              {face}
            </button>
          )
        return (
          <Popover key={tile.tab.id}>
            <PopoverTrigger asChild>
              <button type="button" className="ssc-card ssc-kpi">
                {face}
              </button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              align={i === box.tiles.length - 1 ? "end" : "start"}
              collisionPadding={16}
              aria-label={tile.title}
              // Çok para birimli ayrıntı ekrandan uzun olabilir: boş yere sığar, içeride kayar.
              style={{
                maxHeight: "var(--radix-popover-content-available-height)",
                overflowY: "auto",
                overscrollBehavior: "contain",
              }}
              className="w-[22rem] max-w-[calc(100vw-2rem)] p-5"
              onEscapeKeyDown={(e) => e.stopPropagation()}
              // Odak ayrıntının kendisine: içteki bilgi düğmesine düşerse ipucu kendiliğinden açılır
              // ve ilk Escape onu kapatır, kartı değil.
              onOpenAutoFocus={(e) => {
                e.preventDefault()
                e.currentTarget.focus()
              }}
            >
              <h3 className="mb-4 text-[0.9375rem] font-semibold tracking-[-0.01em] text-foreground">
                {tile.title}
              </h3>
              <TileBody tile={tile} {...box} accrual={accrual} />
            </PopoverContent>
          </Popover>
        )
      })}
      <SummarySheet
        open={sheet != null}
        onOpenChange={(o) => !o && setSheet(null)}
        summary={box}
        accrual={accrual}
        only={sheet}
      />
    </div>
  )
}
