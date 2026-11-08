import { useLocale } from "@/hooks/useLocale"
import { STICKY_COLORS } from "./lib/stickyNotes"

/** Not rengi seçimi: beş renkli nokta, radyo grubu (ok tuşlarıyla gezilir). */
export function ColorDots({ value, onChange }) {
  const { t } = useLocale()
  const move = (e, i) => {
    const step = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[e.key]
    if (!step) return
    e.preventDefault()
    const next = STICKY_COLORS[(i + step + STICKY_COLORS.length) % STICKY_COLORS.length]
    onChange(next)
    e.currentTarget.parentElement?.querySelector(`[data-dot="${next}"]`)?.focus()
  }
  return (
    <span role="radiogroup" aria-label={t("widgets.sticky.color")} className="st-dots">
      {STICKY_COLORS.map((c, i) => (
        <button
          key={c}
          type="button"
          role="radio"
          data-dot={c}
          data-color={c}
          aria-checked={value === c}
          tabIndex={value === c ? 0 : -1}
          aria-label={t(`widgets.sticky.colors.${c}`)}
          title={t(`widgets.sticky.colors.${c}`)}
          onClick={() => onChange(c)}
          onKeyDown={(e) => move(e, i)}
          className="st-dot"
        />
      ))}
    </span>
  )
}
