import { HugeiconsIcon } from "@hugeicons/react"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { listIcon } from "@/features/todo/listIcon"
import { useLocale } from "@/hooks/useLocale"
import { HORIZON_MAX_LISTS } from "@/lib/horizon"
import { cn } from "@/lib/utils"

/**
 * Ufukta'nın ayarı: hangi To Do listeleri (en çok 6, işaretli e-postalar en sonda) ve
 * tamamlananlar da görünsün mü. Değişiklik anında karta yansır; yalnız yeni eklenen liste sorulur.
 */
export default function HorizonLists({ horizon }) {
  const { t } = useLocale()
  const chosen = horizon.selected.map((l) => l.id)
  const full = chosen.length >= HORIZON_MAX_LISTS
  const lists = [...horizon.lists].sort(
    (a, b) => Number(a.kind === "flagged") - Number(b.kind === "flagged"),
  )
  return (
    <div className="flex flex-col gap-3 p-3 pt-1">
      <p className="px-1 text-[0.75rem] leading-snug text-muted-foreground">
        {t("widgets.horizon.listsHint")}
      </p>
      <ul aria-label={t("widgets.horizon.lists")} className="max-h-64 overflow-y-auto">
        {lists.map((l) => {
          const on = chosen.includes(l.id)
          const locked = !on && full
          return (
            <li key={l.id}>
              <button
                type="button"
                role="checkbox"
                aria-checked={on}
                aria-disabled={locked || undefined}
                onClick={() => !locked && horizon.toggleList(l.id)}
                className={cn(
                  "flex min-h-10 w-full items-center gap-2.5 rounded-xl px-2 text-start text-[0.8125rem] transition outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11",
                  locked ? "cursor-not-allowed opacity-50" : "hover:bg-accent",
                )}
              >
                <HugeiconsIcon
                  icon={listIcon(l)}
                  className="size-4 shrink-0 text-muted-foreground"
                  strokeWidth={1.8}
                  aria-hidden="true"
                />
                <span className="min-w-0 flex-1 truncate">{l.name}</span>
                <span
                  aria-hidden="true"
                  className={cn(
                    "grid size-[1.125rem] shrink-0 place-items-center rounded-full border-[1.5px] transition",
                    on
                      ? "border-transparent bg-gradient-to-br from-brand-from via-brand-via to-brand-to text-brand-on-ramp"
                      : "border-foreground/25 text-transparent",
                  )}
                >
                  <HugeiconsIcon icon={Tick02Icon} className="size-2.5" strokeWidth={3} />
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {full && (
        <p className="px-1 text-[0.75rem] text-muted-foreground">
          {t("widgets.horizon.listsFull", { n: HORIZON_MAX_LISTS })}
        </p>
      )}
      <div className="border-t border-border/70 pt-2">
        <button
          type="button"
          role="switch"
          aria-checked={horizon.settings.done}
          onClick={() => horizon.setShowDone(!horizon.settings.done)}
          className="flex min-h-10 w-full items-center justify-between gap-3 rounded-xl px-2 text-start text-[0.8125rem] transition outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"
        >
          {t("widgets.horizon.showDone")}
          <span
            aria-hidden="true"
            className={cn(
              "relative h-6 w-10 shrink-0 rounded-full transition-colors",
              horizon.settings.done ? "bg-brand" : "bg-foreground/20",
            )}
          >
            <span
              className={cn(
                "absolute top-0.5 size-5 rounded-full bg-white shadow-sm transition-[inset-inline-start]",
                horizon.settings.done ? "start-[1.125rem]" : "start-0.5",
              )}
            />
          </span>
        </button>
      </div>
    </div>
  )
}
