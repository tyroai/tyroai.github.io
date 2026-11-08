import { HugeiconsIcon } from "@hugeicons/react"
import { BottomSheet } from "@/components/common/BottomSheet"
import { useLocale } from "@/hooks/useLocale"
import { TileDetail } from "./TileDetail"

/** Kutunun ayrıntısı; okunamayan bölümde sıfırlar değil, nedeni. */
export function TileBody({ tile, off, balance, accrual, facts, period }) {
  const { t } = useLocale()
  // Kendi ayrıntısını taşıyan kutu (Ticket).
  if (tile.body) return tile.body
  if (off[tile.tab.id])
    return <p className="text-[0.8125rem] text-muted-foreground">{t(off[tile.tab.id])}</p>
  return (
    <TileDetail
      kind={tile.tab.id}
      balance={balance}
      accrual={accrual}
      facts={facts}
      period={period}
    />
  )
}

/**
 * Özetin ayrıntı çekmecesi — üç kutunun ayrıntısı alt alta (dokunmatikte ve dar kapta; yalnız
 * hover kartında kalan bilgi yok). Escape çekmeceyi kapatır, sohbet rıhtımını kapatmaz.
 * `summary`: `useSummaryTiles` sonucu. `only`: tek kutunun kimliği (telefonda dokunulan değer) —
 * çekmece yalnız onun ayrıntısını, kutunun adıyla açar.
 */
export function SummarySheet({ open, onOpenChange, summary, accrual, only = null }) {
  const { t } = useLocale()
  const { period } = summary
  const one = only ? summary.tiles.find((tile) => tile.tab.id === only) : null
  const tiles = one ? [one] : summary.tiles
  const title = one ? one.title : t("selfService.tile.detail.title", { period })
  return (
    <BottomSheet
      open={open}
      onOpenChange={onOpenChange}
      title={title}
      onEscapeKeyDown={(e) => e.stopPropagation()}
      scrollLabel={title}
      closeOnBack
    >
      <div className="flex flex-col gap-5 pb-2">
        {tiles.map((tile) => (
          <section key={tile.tab.id} className="min-w-0">
            {/* Tek kutuda ad çekmecenin başlığında: tekrar yok. */}
            {!one && (
              <h3 className="mb-2 flex items-center gap-2 text-[0.875rem] font-semibold">
                <HugeiconsIcon
                  icon={tile.tab.icon}
                  aria-hidden="true"
                  className="size-4 text-brand-ink"
                  strokeWidth={1.9}
                />
                {tile.title}
              </h3>
            )}
            <TileBody tile={tile} {...summary} accrual={accrual} />
          </section>
        ))}
      </div>
    </BottomSheet>
  )
}
