import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { countText, range } from "../../kinds"
import { ActionTip } from "../field/ActionTip"
import { IconTile } from "../field/IconTile"
import { CHIP, TEXT_BUTTON } from "./advanceUi"

/** Öneri uygulanınca önerilerin yerinde: "n alan dolduruldu · Geri al". */
export function FilledNote({ filled, onUndo, className }) {
  const { t, locale } = useLocale()
  return (
    <p
      aria-live="polite"
      className={cn(
        "flex flex-wrap items-center gap-x-3 text-[0.8125rem] text-muted-foreground",
        className,
      )}
    >
      {countText(t, locale, "selfService.advance.filled", filled)}
      <button type="button" className={TEXT_BUTTON} onClick={onUndo}>
        {t("selfService.leave.undo")}
      </button>
    </p>
  )
}

/**
 * "Öneriler": takvimden yolculuk ve önceki avansların (en çok üç, `past`: `{ id, text, icon,
 * tone }`; amacın tonlu ikonu · "Fuar · Hamburg · €23.000"). Önceki avans çipi tarih dışında her
 * alanı doldurur (balonda söylenir). Hiç öneri yoksa satır yok; uygulanınca satırın yerinde "n alan
 * dolduruldu · Geri al". Dar kapta çipler tek satırda yana kayar (telefonda satır satır uzamasın).
 * Telefonun dikeyinde öneriler çekmecenin üst satırında (`PastAdvances`); bu satır orada gizlenir
 * (`className`), yatay telefonda — üst satır yok — görünür.
 */
export function Suggestions({ trip, past, onTrip, onPast, filled, onUndo, className }) {
  const { t, locale } = useLocale()
  if (filled > 0) return <FilledNote filled={filled} onUndo={onUndo} className={className} />
  if (!trip && !past.length) return null
  const label = "shrink-0 text-[0.75rem] font-medium text-muted-foreground"
  return (
    <div
      role="group"
      aria-label={t("selfService.advance.suggestions")}
      data-tour="req-hints"
      className={cn(
        "-mx-1 flex items-center gap-2 overflow-x-auto px-1 py-0.5 [scrollbar-width:none] @[40rem]/fields:flex-wrap @[40rem]/fields:overflow-visible",
        className,
      )}
    >
      {trip && (
        <>
          <span className={label}>{t("selfService.advance.suggestions")}</span>
          <button type="button" className={cn(CHIP, "shrink-0")} onClick={onTrip}>
            <HugeiconsIcon icon={Calendar03Icon} aria-hidden="true" className="size-3.5 shrink-0" />
            <span className="truncate">
              {t("selfService.advance.fromCalendar", {
                where: trip.place,
                when: range(trip.start, trip.end, locale),
              })}
            </span>
          </button>
        </>
      )}
      {past.length > 0 && (
        <span className={cn(label, trip && "ms-1")}>{t("selfService.advance.past")}</span>
      )}
      {past.map((p) => (
        <ActionTip key={p.id} label={t("selfService.advance.reuseTip")}>
          <button
            type="button"
            className={cn(CHIP, "shrink-0 ps-1.5")}
            onClick={() => onPast(p.id)}
            aria-label={t("selfService.advance.reuse", { what: p.text })}
          >
            <IconTile icon={p.icon} tone={p.tone} size="xs" />
            <span className="truncate">{p.text}</span>
          </button>
        </ActionTip>
      ))}
    </div>
  )
}
