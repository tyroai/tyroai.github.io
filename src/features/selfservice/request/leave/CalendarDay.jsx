import { cn } from "@/lib/utils"

// Ekip işareti: köşede küçük sayı rozeti — alttaki tatil noktası ve izin çizgileriyle karışmaz,
// seçili (dolu) günün üstünde de okunur (kendi zemini var). Rakamı gün rakamlarıyla aynı yazı.
const BADGE =
  "pointer-events-none grid h-3.5 min-w-3.5 place-items-center rounded-full bg-background px-[3px] text-[0.5625rem] font-semibold leading-none tabular-nums text-foreground/75 ring-1 ring-foreground/20"

export function TeamBadge({ className, children }) {
  return (
    <span aria-hidden="true" className={cn(BADGE, className)}>
      {children}
    </span>
  )
}

/**
 * Takvimin bir günü (ızgara hücresi + düğme). Katmanlar: hafta sonu soluk, resmî tatil noktası,
 * arife yarım daire, iznin düz, bekleyen talebin kesikli çizgi, bugün halka, köşede ekipten
 * izinli kişi sayısı. `layer`: "mine" · "pending" · null; `people`: o gün izinli ekip.
 */
export function CalendarDay({
  day,
  info,
  layer,
  people,
  inBand,
  isStart,
  isEnd,
  isToday,
  focusable,
  label,
  buttonRef,
  onPick,
  onHover,
  onKeyDown,
  onFocus,
  onBlur,
}) {
  const off = info.weight === 0
  return (
    <div
      role="gridcell"
      aria-selected={Boolean(inBand)}
      className={cn(
        "relative flex h-10 items-center justify-center pointer-coarse:h-11",
        inBand && "bg-brand/[0.12]",
        isStart && "rounded-s-full",
        isEnd && "rounded-e-full",
      )}
    >
      <button
        type="button"
        ref={buttonRef}
        tabIndex={focusable ? 0 : -1}
        aria-label={label}
        onClick={onPick}
        onMouseEnter={onHover}
        onKeyDown={onKeyDown}
        onFocus={onFocus}
        onBlur={onBlur}
        className={cn(
          "relative grid size-9 place-items-center rounded-full text-[0.875rem] tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50 pointer-coarse:size-11",
          // Aralığın içindeki tatil günü bandın renginde de okunur kalsın.
          off ? (inBand ? "text-foreground/80" : "text-muted-foreground") : "text-foreground",
          !isStart && !isEnd && "hover:bg-foreground/[0.06]",
          // Uçlar paletin dolgusunda: seçim markanın rengi, durum renkleri değil.
          (isStart || isEnd) &&
            "bg-brand-fill-deep font-semibold text-brand-on-brand shadow-[0_4px_10px_-4px_rgb(0_0_0/0.35)]",
          isToday && !isStart && !isEnd && "font-semibold ring-[1.5px] ring-inset ring-brand-ink",
        )}
      >
        {day.getDate()}
        {info.kind === "holiday" && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute bottom-1 size-1 rounded-full",
              isStart || isEnd ? "bg-brand-on-brand" : "bg-brand-ink",
            )}
          />
        )}
        {info.kind === "eve" && (
          <span
            aria-hidden="true"
            className="absolute bottom-1 size-1.5 rounded-full bg-[linear-gradient(90deg,var(--brand-ink)_50%,transparent_50%)] ring-1 ring-brand-ink/40"
          />
        )}
        {layer && (
          <span
            aria-hidden="true"
            className={cn(
              "absolute inset-x-2 bottom-0.5 border-b-2",
              layer === "mine" ? "border-foreground/60" : "border-dashed border-foreground/45",
            )}
          />
        )}
        {people?.length > 0 && (
          <TeamBadge className="absolute -end-0.5 -top-0.5 pointer-coarse:end-0 pointer-coarse:top-0">
            {people.length}
          </TeamBadge>
        )}
      </button>
    </div>
  )
}
