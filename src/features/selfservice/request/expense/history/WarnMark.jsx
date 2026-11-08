import { cn } from "@/lib/utils"

/**
 * Kalem numarasının köşesindeki sarı nokta (uyarı tonu): kalemde uyarı var (ERP'de eşi olabilir ya da
 * formda aynısı var). Yalnız görsel; metni numaranın görünmez durum yazısında. Numara rozeti
 * `relative` olmalı.
 */
export function WarnMark({ className }) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute -end-0.5 -top-0.5 size-2 rounded-full bg-warning ring-2 ring-card",
        className,
      )}
    />
  )
}
