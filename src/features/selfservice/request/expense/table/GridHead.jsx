import { useLocale } from "@/hooks/useLocale"
import { isLocked } from "@/features/selfservice/lib/expenseColumns"
import { cn } from "@/lib/utils"
import { columnLabel } from "../../formUi"

/**
 * Izgaranın sütun başlıkları: kaydırınca üstte yapışık kalan cam şerit (12 px, soluk). Süs:
 * her hücrenin adı ekran okuyucuya kendi görünmez etiketinde ("Kalem 3 · Tutar"). Zorunlu
 * sütunun adının yanında küçük nokta; tutar başlığı rakamın üstünde (para biriminin solunda).
 */
export function GridHead({ columns }) {
  const { t, locale } = useLocale()
  return (
    <div
      aria-hidden="true"
      className="xg-glass sticky top-[var(--xg-top,0px)] z-20 grid h-10 items-center gap-x-2 rounded-t-[0.8125rem] border-b border-black/[0.06] bg-muted/95 px-2 text-[0.75rem] font-medium text-foreground/60 backdrop-blur-xl dark:border-white/[0.08]"
      style={{ gridTemplateColumns: columns.grid }}
    >
      <span className="text-center tabular-nums">#</span>
      {columns.visible.map((id) => (
        <span
          key={id}
          className={cn(
            "flex min-w-0 items-center gap-1 ps-3",
            id === "people" && "justify-end pe-3",
            // Tutarın başlığı rakamın üstünde: para birimi kutusu + aralık + alanın iç boşluğu.
            id === "amount" && "justify-end pe-[5.75rem] pointer-coarse:pe-[5.5rem]",
          )}
        >
          <span className="truncate">{columnLabel(t, locale, id)}</span>
          {isLocked(id) && <span className="size-1 shrink-0 rounded-full bg-brand/70" />}
        </span>
      ))}
      <span />
    </div>
  )
}
