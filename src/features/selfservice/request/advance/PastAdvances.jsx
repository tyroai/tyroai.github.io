import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import HistoryIcon from "@hugeicons/core-free-icons/HistoryIcon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { range } from "../../kinds"
import { IconTile } from "../field/IconTile"
import { FilledNote } from "./AdvanceHints"
import { CHIP } from "./advanceUi"

const ROW =
  "flex min-h-12 w-full items-center gap-3 rounded-xl px-2.5 py-1.5 text-start text-[0.875rem] font-medium tabular-nums transition hover:bg-foreground/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

/**
 * Telefonda avans formunun üst satırı (adımın yanı): "Önceki avansların ⌄" hapı. Basınca altında
 * liste — takvimden yolculuk (varsa) ve önceki avanslar (`past`: amaç · yer · tutar); biri seçilince
 * alanlar dolar ve hapın yerinde "n alan dolduruldu · Geri al" durur. Önceki avans yoksa hap
 * "Öneriler" (yalnız takvim). Girdiler `Suggestions` ile aynı (`useAdvanceDesk`).
 */
export function PastAdvances({ trip, past, onTrip, onPast, filled, onUndo }) {
  const { t, locale } = useLocale()
  const [open, setOpen] = useState(false)
  if (filled > 0) return <FilledNote filled={filled} onUndo={onUndo} />
  if (!trip && !past.length) return null
  // Önce kapanır, sonra uygular: hap "n alan dolduruldu"ya dönüşürken açık liste askıda kalmasın.
  const pick = (run) => {
    setOpen(false)
    run()
  }
  const label = t(past.length ? "selfService.advance.past" : "selfService.advance.suggestions")
  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button type="button" className={cn(CHIP, "shrink-0 data-[state=open]:border-brand/45")}>
          <HugeiconsIcon icon={HistoryIcon} aria-hidden="true" className="size-3.5 shrink-0" />
          <span className="truncate">{label}</span>
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            aria-hidden="true"
            className={cn("size-3.5 shrink-0 transition-transform", open && "rotate-180")}
          />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="start"
        sideOffset={8}
        collisionPadding={12}
        aria-label={label}
        className="w-[min(24rem,calc(100vw-2.5rem))] gap-0.5 rounded-2xl p-1.5"
      >
        {trip && (
          <button type="button" className={ROW} onClick={() => pick(onTrip)}>
            <IconTile icon={Calendar03Icon} size="sm" />
            <span className="min-w-0 flex-1 truncate">
              {t("selfService.advance.fromCalendar", {
                where: trip.place,
                when: range(trip.start, trip.end, locale),
              })}
            </span>
          </button>
        )}
        {past.map((p) => (
          <button
            key={p.id}
            type="button"
            className={ROW}
            onClick={() => pick(() => onPast(p.id))}
            aria-label={t("selfService.advance.reuse", { what: p.text })}
          >
            <IconTile icon={p.icon} tone={p.tone} size="sm" />
            <span className="min-w-0 flex-1 truncate">{p.text}</span>
          </button>
        ))}
        {/* Dokunmatikte balon yok: "tarih dışında" bilgisi listenin altında. */}
        {past.length > 0 && (
          <p className="px-2.5 pb-1 pt-2 text-[0.75rem] font-normal leading-snug text-muted-foreground">
            {t("selfService.advance.reuseTip")}
          </p>
        )}
      </PopoverContent>
    </Popover>
  )
}
