import { useMemo } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { MAX_REGIONS, REGIONS } from "@/data/growingRegions"
import { useLocale } from "@/hooks/useLocale"
import { bcp47 } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"

/** Bölge seçimi: en çok üç; son kalan bölge çıkarılamaz (kart boş kalmasın). */
export function RegionPicker({ ids, onToggle }) {
  const { t, locale } = useLocale()
  const country = useMemo(
    () => new Intl.DisplayNames([bcp47(locale)], { type: "region" }),
    [locale],
  )
  const full = ids.length >= MAX_REGIONS
  return (
    <div className="p-2 pt-1">
      <ul className="max-h-80 overflow-y-auto">
        {REGIONS.map((r) => {
          const on = ids.includes(r.id)
          return (
            <li key={r.id}>
              <button
                type="button"
                aria-pressed={on}
                disabled={on ? ids.length === 1 : full}
                onClick={() => onToggle(r.id)}
                className="flex min-h-11 w-full items-center gap-2.5 rounded-xl px-2 text-start transition outline-none hover:bg-accent/60 focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-50"
              >
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.8125rem] font-medium">
                    {t(`widgets.region.name.${r.id}`)}
                  </span>
                  <span className="block truncate text-[0.6875rem] text-muted-foreground">
                    {[country.of(r.cc), ...r.crops.map((c) => t(`widgets.region.crop.${c}`))].join(
                      " · ",
                    )}
                  </span>
                </span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-5 shrink-0 place-items-center rounded-full border transition",
                    on
                      ? "border-transparent bg-brand-fill-deep text-brand-on-brand"
                      : "border-border text-transparent",
                  )}
                >
                  <HugeiconsIcon icon={Tick02Icon} className="size-3.5" strokeWidth={2.5} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {full && (
        <p className="px-2 pt-2 text-[0.75rem] text-muted-foreground">{t("widgets.region.full")}</p>
      )}
    </div>
  )
}
