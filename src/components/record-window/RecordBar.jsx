import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { cn } from "@/lib/utils"
import "./recordWindow.css"

/**
 * Pencerenin üst şeridi (Apple sayfası gibi): solda kalın başlık (kaydın türü), sağda eylemler
 * (`children`: `RecordButton`lar — sırayla ikincil, "⋯" menüsü, TEK birincil) ve en sağda yarı
 * saydam yuvarlak kapat. `after`: şeridin sonuna, eylemlerin dışına (ör. eylemin açtığı diyalog).
 */
export function RecordBar({ title, onClose, closeLabel, children, after }) {
  return (
    <div className="rw-bar">
      <p className="rw-bar-title">{title}</p>
      <div className="rw-bar-actions">
        {children}
        {onClose && (
          <button type="button" onClick={onClose} aria-label={closeLabel} className="rw-close">
            <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" strokeWidth={2.2} />
          </button>
        )}
      </div>
      {after}
    </div>
  )
}

/**
 * Şeridin kapsül düğmesi: `variant` "default" (beyaz, ince çizgili) · "icon" (yalnız simge, ad
 * `aria-label`'da) · "primary" (dolu marka rengi, pencerede tek). Radix `asChild` tetiği olabilir
 * (`ref` ve olaylar düğmeye geçer).
 */
export function RecordButton({ icon, variant = "default", className, children, ...rest }) {
  return (
    <button
      type="button"
      {...rest}
      className={cn(
        "rw-btn",
        variant === "icon" && "rw-btn--icon",
        variant === "primary" && "rw-btn--primary",
        className,
      )}
    >
      {icon && <HugeiconsIcon icon={icon} aria-hidden="true" strokeWidth={1.8} />}
      {children}
    </button>
  )
}
