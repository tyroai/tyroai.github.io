import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "@/hooks/useLocale"
import { clock, srKind, whenText } from "./format"
import { useIsActive } from "./activeItem"
import { ITEM_ICONS } from "./icons"

/**
 * Tüm gün çipi: simge · (saatliyse saat) · başlık · ek ("· İzinde"). Çok günlü öğe günler boyunca
 * TEK parça uzanır (`gridColumn` aralığı); satır dışına taşan ucu yuvarlatılmaz (`data-before` /
 * `data-after`). Hafta ve ay satırında aynı çip: ayda tek satır (başlık kırpılır, ek kalır), hafta ve
 * gün görünümünde yazı üç satıra kadar sarar (`.cal-chip-text`).
 */
export function AllDayChip({ chip, onOpen }) {
  const { locale, t } = useLocale()
  const { item, col, span, lane, before, after } = chip
  const Icon = ITEM_ICONS[item.icon]
  const text = item.tail ? `${item.title} · ${item.tail}` : item.title
  const active = useIsActive(item.id)
  return (
    <button
      type="button"
      className="cal-chip"
      data-tone={item.kind}
      data-state={item.state ?? undefined}
      data-before={before || undefined}
      data-after={after || undefined}
      data-active={active || undefined}
      title={text}
      style={{ gridColumn: `${col + 1} / span ${span}`, gridRow: lane + 1, "--hue": item.hue }}
      onClick={(e) => onOpen(item, e.currentTarget)}
    >
      <span className="cal-sr">{srKind(item, t)}</span>
      {Icon && <HugeiconsIcon icon={Icon} className="cal-ic" strokeWidth={2} aria-hidden="true" />}
      {/* Boşluklar sarılan yazıda kelime arası; ayın esnek satırında görünmez. "·" eke yapışık. */}
      <span className="cal-chip-text">
        {!item.allDay && <span className="cal-chip-time">{clock(item.start, locale)}</span>}{" "}
        <span data-private="" className="cal-chip-title">
          {item.title}
        </span>
        {item.tail && " "}
        {item.tail && <span className="cal-chip-tail">·&nbsp;{item.tail}</span>}
      </span>
      <span className="cal-sr">, {whenText(item, locale, t)}</span>
    </button>
  )
}
