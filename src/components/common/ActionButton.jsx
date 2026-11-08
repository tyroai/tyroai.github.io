import { actionButton } from "./actionButtonClass"
import { cn } from "@/lib/utils"
import "./action-button.css"

/**
 * Sayfa ve araç çubuğu düğmesi — boy ROLDEN gelir (`docs/design-tokens.md`):
 * - `size="page"`: araç çubuğu DIŞINDA tek başına eylem (boş durum, form gönder) — `control-lg`
 * - `size="toolbar"`: her araç çubuğu, başlığın sağı dahil (Yeni, Yenile, filtre, dışa aktar) — `control`
 * - `size="inline"`: kart/satır içi küçük eylem — `control-sm`
 * Dokunmatikte üçü de 44 px (token). Önem RENK ve AĞIRLIKLA verilir (ana eylem 600, ötekiler 500),
 * boyla değil: sayfada tek `tone="prominent"`.
 */
export function ActionButton({ tone, size, iconOnly, className, type = "button", ref, ...props }) {
  return (
    <button
      ref={ref}
      type={type}
      className={cn(actionButton({ tone, size, iconOnly }), className)}
      {...props}
    />
  )
}
