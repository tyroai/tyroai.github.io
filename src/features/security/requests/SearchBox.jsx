import { SearchField } from "@/components/common/SearchField"
import { cn } from "@/lib/utils"

/**
 * Arama alanı (Talepler · Uygulamalar · erişim listesi) — ortak `SearchField` (araç çubuğu
 * standardı). `ref` alana gider (`/` kısayolunu sayfa dinliyor); dolu kutuda Esc temizler.
 */
export function SearchBox({ ref, value, onChange, placeholder, className }) {
  return (
    <SearchField
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      inputRef={ref}
      className={cn("flex-1", className)}
    />
  )
}
