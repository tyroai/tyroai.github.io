import { getNumberFormat } from "@/lib/intl-cache"

const PCT = { style: "percent", signDisplay: "exceptZero", maximumFractionDigits: 0 }
const pct = (x) => `${(x * 100).toFixed(2)}%`

/**
 * Sahne kartının tek satırlık görseli (12 px, `aria-hidden`; cümlenin tamamı ekran okuyucuda):
 * bu haftanın toplantısı geçen haftaya karşı, günün odak şeridi, köprünün gün kareleri, haftanın
 * gün sütunları. Bir kez çizilir (`orb-draw`), döngü yok.
 */
export function SceneVisual({ visual, locale }) {
  if (!visual) return null
  switch (visual.type) {
    case "bars":
      return (
        <div aria-hidden="true" className="orb-vis orb-bars">
          <div>
            <i className="orb-draw" style={{ background: "var(--color-brand)" }} />
            <i
              className="orb-draw"
              style={{ width: pct(visual.ratio), background: "var(--orb-track)" }}
            />
          </div>
          <span className="orb-delta">{getNumberFormat(locale, PCT).format(visual.delta)}</span>
        </div>
      )
    case "timeline":
      return (
        <div aria-hidden="true" className="orb-vis">
          <div className="orb-line orb-draw">
            {visual.segs.map((s, i) => (
              <i
                key={i}
                data-tone={s.tone}
                style={{ insetInlineStart: pct(s.from), width: pct(s.to - s.from) }}
              />
            ))}
          </div>
          {visual.now != null && (
            <span className="orb-now" style={{ insetInlineStart: pct(visual.now) }} />
          )}
        </div>
      )
    case "days":
      return (
        <div aria-hidden="true" className="orb-vis orb-days">
          {visual.days.map((d, i) => (
            <i key={i} data-tone={d} style={{ "--i": i }} />
          ))}
        </div>
      )
    case "week":
      return (
        <div aria-hidden="true" className="orb-vis orb-week orb-draw-y">
          {visual.cols.map((c, i) => (
            <i
              key={i}
              data-today={i === visual.today ? "" : undefined}
              style={{ height: `${Math.max(2, Math.round(c * 12))}px` }}
            />
          ))}
        </div>
      )
    default:
      return null
  }
}
