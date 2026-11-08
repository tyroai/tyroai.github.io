import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { HoverCard, HoverCardContent, HoverCardTrigger } from "@/components/ui/hover-card"
import { useLocale } from "@/hooks/useLocale"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { cn } from "@/lib/utils"
import { SummarySheet, TileBody } from "./SummarySheet"
import { TileFace } from "./TileFace"

// Hover kartı: göz gezdirirken her kutuda açılmasın, aradan geçerken hemen kapanmasın.
const OPEN_DELAY = 150
const CLOSE_DELAY = 120
// Tek sakin yüzey (çerçevesiz, gölgesiz hafif zemin); üstünde dönem çubuğu (`header`).
const SURFACE =
  "mt-3 min-w-0 rounded-2xl bg-foreground/[0.028] text-foreground dark:bg-foreground/[0.05]"
// Beyaz tepsinin içinde (`SelfHero`): zemin tepsinin, kutular düz. `ss-*` sınıfları kartın sabit
// boyuna sığdırma kancası (`header/selfHero.css`); başka yerde etkisiz.
const BARE = "mt-1 min-w-0 flex-1 content-center rounded-2xl text-foreground"
// Literal sınıflar: Tailwind şablondan sınıf üretmez.
const GRID = "grid min-w-0 grid-cols-3 rounded-2xl"
const GRID4 = "grid min-w-0 grid-cols-4 rounded-2xl"
// Üç stat ince dikey ayraçlarla (ilkinden sonra; ayraç yüzeyin üst ve alt payında durur).
const TILE =
  "ss-tile relative min-w-0 rounded-2xl px-3 py-3.5 text-start @[44rem]/ss:px-6 @[44rem]/ss:py-5 [&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:inset-y-4 [&:not(:first-child)]:before:start-0 [&:not(:first-child)]:before:w-px [&:not(:first-child)]:before:bg-border @[44rem]/ss:[&:not(:first-child)]:before:inset-y-5"

// Dört kutuda iç pay dar: tepside her kutu ~120 px, geniş pay adları kesiyordu.
const TILE4 = TILE.replace("@[44rem]/ss:px-6", "@[44rem]/ss:px-3.5")

const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

/**
 * Özet tepsisi — tek sakin yüzeyde ince ayraçlı 3 ya da 4 kutu (küçük büyük harfli ad, büyük
 * değer, tek soluk alt satır). Ayrıntı (`tile.body` ya da `TileDetail`): ince işaretçili geniş
 * kapta fareyle ya da klavye odağıyla hover kartı; dokunmatikte ya da dar kapta tek düğme →
 * alttan çekmecede hepsinin ayrıntısı. Escape kartı/çekmeceyi kapatır, sohbet rıhtımını
 * kapatmaz. `bare`: gradyan kartın beyaz tepsisinde, kendi zemini olmadan. `summary`:
 * çekmecenin ve ayrıntının verisi (`period`, `off`, …). Self Servis (`SummaryTiles`) ve
 * Ticket (`TibotTray`) aynı tepsiyi kullanır.
 */
export function TileTray({
  tiles,
  summary,
  accrual = null,
  loading,
  header,
  bare = false,
  cols = 3,
  className,
}) {
  const { t } = useLocale()
  const fine = useMediaQuery("(hover: hover) and (pointer: fine)")
  const [sheet, setSheet] = useState(false)
  const box = summary
  const surface = bare ? BARE : SURFACE
  const grid = cols === 4 ? GRID4 : GRID
  const cell = cols === 4 ? TILE4 : TILE
  // Dört kutuda yüzde kısa ad; uzun ad ayrıntı kartının başlığında.
  const face = (tile) => (cols === 4 ? { ...tile, title: tile.short ?? tile.title } : tile)
  const stopEscape = (e) => e.stopPropagation()

  if (loading) {
    return (
      <div className={cn("min-w-0", className)}>
        {header}
        <div className={cn(surface, grid)}>
          {tiles.map((tile) => (
            <div key={tile.tab.id} className={cell}>
              <TileFace {...face(tile)} loading={loading} />
            </div>
          ))}
        </div>
      </div>
    )
  }
  return (
    <div className={cn("min-w-0", className)}>
      {header}
      {fine && (
        <div className={cn(surface, grid, "hidden @[44rem]/ss:grid")}>
          {tiles.map((tile, i) => (
            <HoverCard key={tile.tab.id} openDelay={OPEN_DELAY} closeDelay={CLOSE_DELAY}>
              <HoverCardTrigger asChild>
                <div
                  // Tıklanmaz; odak yalnız ayrıntı kartını açmak için (klavyeyle de görünsün).
                  tabIndex={0}
                  role="group"
                  aria-label={`${tile.title}: ${tile.value}`}
                  // Üzerine gelince hafif zemin: ayrıntı kartının açılacağını sezdirir.
                  className={cn(
                    cell,
                    RING,
                    "cursor-default transition-colors hover:bg-foreground/[0.025]",
                  )}
                >
                  <TileFace {...face(tile)} />
                </div>
              </HoverCardTrigger>
              <HoverCardContent
                // İzin kartı uzun (hak ediş kartıyla): yanda açılır, ekrana sığmak için dikeyde kayar.
                side="bottom"
                // Sağdaki kutunun kartı sola açılır: ekranın kenarına dayanmasın.
                align={i === tiles.length - 1 ? "end" : "start"}
                collisionPadding={16}
                // Beş para birimi × beş kategori kartı görüntü alanından uzun yapıyordu (alt kısmı ekranın
                // dışında kalıyordu): yükseklik Radix'in ölçtüğü boş yerle sınırlı, taşan içeride kayar.
                style={{
                  maxHeight: "var(--radix-hover-card-content-available-height)",
                  overflowY: "auto",
                  overscrollBehavior: "contain",
                }}
                className="w-[22rem] max-w-[calc(100vw-2rem)] rounded-2xl border-0 p-5 shadow-[0_24px_48px_-16px_rgb(0_0_0/0.28),0_2px_6px_rgb(0_0_0/0.06)] ring-1 ring-foreground/[0.08]"
                onEscapeKeyDown={stopEscape}
              >
                <h3 className="mb-4 text-[0.9375rem] font-semibold tracking-[-0.01em] text-foreground">
                  {tile.title}
                </h3>
                <TileBody tile={tile} {...box} accrual={accrual} />
              </HoverCardContent>
            </HoverCard>
          ))}
        </div>
      )}
      <button
        type="button"
        aria-haspopup="dialog"
        onClick={() => setSheet(true)}
        className={cn(surface, grid, "w-full", RING, fine && "@[44rem]/ss:hidden")}
      >
        {tiles.map((tile) => (
          <span key={tile.tab.id} className={cell}>
            <TileFace {...face(tile)} />
          </span>
        ))}
        {/* Dokunulabilir olduğunu söyleyen alt satır; varsa sonraki hak ediş (yalnız çekmecede
            kalmasın), yoksa "Ayrıntıları aç". */}
        <span className="ss-tiles-more col-span-full flex min-w-0 items-center gap-2 px-3 pb-3 text-[0.75rem] font-medium text-foreground/65 @[44rem]/ss:px-6">
          <span className="min-w-0 flex-1 truncate text-start">
            {tiles[0].note ?? t("selfService.tile.detail.open")}
          </span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            aria-hidden="true"
            className="size-3.5 shrink-0 rtl:rotate-180"
            strokeWidth={2}
          />
        </span>
        {tiles[0].note && <span className="sr-only">{t("selfService.tile.detail.open")}</span>}
      </button>
      <SummarySheet open={sheet} onOpenChange={setSheet} summary={box} accrual={accrual} />
    </div>
  )
}
