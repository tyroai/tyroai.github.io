import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import FilterHorizontalIcon from "@hugeicons/core-free-icons/FilterHorizontalIcon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { STATUSES } from "./catalogLogic"

const DOT = { on: "bg-success", off: "bg-muted-foreground/50" }

/**
 * Telefonda durum filtresi çekmecede: listenin üstünde ikinci bir sekme şeridi durmaz. Düğme
 * "Tümü"yken yalnız simge, filtre açıkken adını taşır (seçili dili: zemin).
 */
export function PhoneFilter({ status, onStatus, counts }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const active = status !== "all"
  const label = t("settings.catalog.filter.label")
  return (
    <>
      <button
        type="button"
        aria-haspopup="dialog"
        aria-label={`${label}: ${t(`settings.catalog.filter.${status}`)}`}
        onClick={() => setOpen(true)}
        className={cn(
          "inline-flex h-11 min-w-11 shrink-0 items-center justify-center gap-1.5 rounded-full text-[0.8125rem] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40",
          active ? "bg-brand/12 px-3.5 text-brand-ink" : "bg-foreground/[0.045] text-foreground/85",
        )}
      >
        <HugeiconsIcon icon={FilterHorizontalIcon} className="size-4" strokeWidth={1.8} />
        {active && <span aria-hidden="true">{t(`settings.catalog.filter.${status}`)}</span>}
      </button>
      <BottomSheet open={open} onOpenChange={setOpen} title={label} closeOnBack>
        <div role="radiogroup" aria-label={label} className="divide-y divide-border/60 pb-2">
          {STATUSES.map((s) => {
            const on = s === status
            return (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={on}
                onClick={() => {
                  onStatus(s)
                  setOpen(false)
                }}
                className="flex min-h-14 w-full items-center gap-3 text-start text-[0.9375rem] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
              >
                {/* Masaüstü çipleriyle aynı nokta: Açık yeşil, Kapalı gri. */}
                <span
                  aria-hidden="true"
                  className={cn("size-1.5 shrink-0 rounded-full", DOT[s] ?? "bg-transparent")}
                />
                <span className={cn("flex-1", on && "font-semibold")}>
                  {t(`settings.catalog.filter.${s}`)}
                </span>
                <span className="text-sm tabular-nums text-muted-foreground">{counts[s]}</span>
                <span className="grid size-5 place-items-center text-brand-ink">
                  {on && <HugeiconsIcon icon={Tick02Icon} className="size-5" strokeWidth={2} />}
                </span>
              </button>
            )
          })}
        </div>
      </BottomSheet>
    </>
  )
}
