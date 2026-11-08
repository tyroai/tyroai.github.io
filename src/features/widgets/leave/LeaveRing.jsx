import { useId } from "react"
import "@/components/common/fill.css"

const C = 2 * Math.PI * 48

/**
 * Bakiye halkası: kullanılan yay paletin degradesi, ardından onaydaki günlerin yayı (sarı);
 * boş kalan halka kalan izin. Ortada `children` (kalan gün). Gradyan kimliği örneğe özel: kart
 * katalog önizlemesinde ikinci kez çizilebilir.
 */
export function LeaveRing({ share, pendingShare, children }) {
  const id = useId()
  const used = Math.min(1, Math.max(0, share ?? 0))
  const pending = Math.min(1 - used, Math.max(0, pendingShare ?? 0))
  return (
    <span className="lv-ring relative grid shrink-0 place-items-center">
      <svg viewBox="0 0 120 120" className="absolute inset-0 -rotate-90" aria-hidden="true">
        <defs>
          <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0%" style={{ stopColor: "var(--brand-from)" }} />
            <stop offset="55%" style={{ stopColor: "var(--brand-via)" }} />
            <stop offset="100%" style={{ stopColor: "var(--brand-to)" }} />
          </linearGradient>
        </defs>
        <circle className="lv-track" cx="60" cy="60" r="48" fill="none" strokeWidth="11" />
        {/* Sıfır boylu yay çizilmez: yuvarlak uç saat 12'de bir nokta bırakırdı. */}
        {pending > 0 && (
          <circle
            className="lv-pending fx-ring"
            cx="60"
            cy="60"
            r="48"
            fill="none"
            strokeWidth="11"
            strokeLinecap="round"
            strokeDasharray={`${pending * C} ${C}`}
            strokeDashoffset={-used * C}
          />
        )}
        {used > 0 && (
          <circle
            className="lv-used fx-ring"
            cx="60"
            cy="60"
            r="48"
            fill="none"
            strokeWidth="11"
            strokeLinecap="round"
            stroke={`url(#${id})`}
            strokeDasharray={`${used * C} ${C}`}
          />
        )}
      </svg>
      <span className="relative flex flex-col items-center">{children}</span>
    </span>
  )
}
