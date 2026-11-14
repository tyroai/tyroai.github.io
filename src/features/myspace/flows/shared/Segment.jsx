import { useRef } from "react"
import { isRtl, rovingIndex } from "@/lib/rovingKeys"

/**
 * Akışın bölmeli seçimi (referanstaki "One way | Round trip" ve kabin sınıfı): gri ray, seçili
 * seçenek beyaz hap. Radyo grubu: tek sekme durağı, oklar seçimi taşır.
 */
export function Segment({ label, options, value, onChange, fill }) {
  const refs = useRef([])
  const at = Math.max(
    0,
    options.findIndex((o) => o.value === value),
  )
  return (
    <div role="radiogroup" aria-label={label} className="af-seg" data-fill={fill ? "" : undefined}>
      {options.map((o, i) => (
        <button
          key={o.value}
          ref={(el) => {
            refs.current[i] = el
          }}
          type="button"
          role="radio"
          aria-checked={o.value === value}
          tabIndex={i === at ? 0 : -1}
          data-autofocus={o.value === value ? "" : undefined}
          className="af-seg-item"
          onClick={() => onChange(o.value)}
          onKeyDown={(e) => {
            const next = rovingIndex(e.key, i, options.length, isRtl(e.currentTarget))
            if (next < 0) return
            e.preventDefault()
            onChange(options[next].value)
            refs.current[next]?.focus()
          }}
        >
          {o.label}
        </button>
      ))}
    </div>
  )
}
