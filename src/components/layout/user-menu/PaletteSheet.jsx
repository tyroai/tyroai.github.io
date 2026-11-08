import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { useLocale } from "@/hooks/useLocale"
import { usePalette } from "@/hooks/usePalette"
import { cn } from "@/lib/utils"
import { PaletteSwatch } from "../PaletteOptions"

// Grup adları her dilde İngilizce (masaüstü listesiyle aynı): büyük harf İngilizce kuralıyla.
const GROUP_LABEL =
  "px-1 pb-1 pt-3 text-[0.625rem] font-medium uppercase tracking-[0.14em] text-muted-foreground"

/**
 * Telefonda Tema seçimi alttan çekmecede (ürün sahibi): menünün yanına açılan liste ekrana
 * sığmıyordu. Düz · degrade grupları, satırda ad · renk örneği · ✓. Seçim hemen uygulanır,
 * çekmece açık kalır — arkadaki sayfada dene, beğenince kapat.
 */
export function PaletteSheet({ open, onOpenChange }) {
  const { t } = useLocale()
  const { palette, setPalette, palettes } = usePalette()
  const groups = [
    { key: "solid", items: palettes.filter((p) => p.group === "solid") },
    { key: "gradient", items: palettes.filter((p) => p.group !== "solid") },
  ]
  return (
    <BottomSheet open={open} onOpenChange={onOpenChange} title={t("palette.title")} closeOnBack>
      <div role="radiogroup" aria-label={t("palette.title")} className="pb-2">
        {groups.map((g) => (
          <div key={g.key}>
            <p lang="en" className={GROUP_LABEL}>
              {t(`palette.group.${g.key}`)}
            </p>
            <div className="divide-y divide-border/60">
              {g.items.map((p) => {
                const on = p.id === palette
                return (
                  <button
                    key={p.id}
                    type="button"
                    role="radio"
                    aria-checked={on}
                    onClick={() => setPalette(p.id)}
                    className="flex min-h-14 w-full items-center gap-3 text-start text-[0.9375rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
                  >
                    <span className={cn("flex-1", on && "font-semibold")}>
                      {t(p.labelKey, p.id)}
                    </span>
                    <PaletteSwatch colors={p.swatch} solid={g.key === "solid"} />
                    <span className="grid size-5 place-items-center text-brand-ink">
                      {on && <HugeiconsIcon icon={Tick02Icon} className="size-5" strokeWidth={2} />}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </BottomSheet>
  )
}
