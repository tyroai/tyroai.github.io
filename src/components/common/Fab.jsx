import { createPortal } from "react-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import { cn } from "@/lib/utils"
import "./fab.css"

/**
 * TELEFONUN YÜZEN ANA EYLEMİ — her sayfada tek bileşen (`fab.css`): yalnız simge, adı `aria-label`
 * ve ipucunda. Sayfaların kabı kap sorgulu (`@container`, sabit konumlu çocuğun kabı olur): düğme
 * `body`'ye taşınır. `docked={false}`: yeri kabın (`fab-dock`) — ör. üstünde haplar açan Self Servis.
 * `children`: simge yerine özel içerik (dönen artı gibi).
 */
export function Fab({ icon, label, title, docked = true, className, children, ref, ...rest }) {
  const button = (
    <button
      ref={ref}
      type="button"
      aria-label={label}
      title={title === undefined ? label : title}
      className={cn("fab", docked && "fab-dock", className)}
      {...rest}
    >
      {children ?? (
        <HugeiconsIcon icon={icon} className="fab-icon" strokeWidth={2.2} aria-hidden="true" />
      )}
    </button>
  )
  return docked ? createPortal(button, document.body) : button
}
