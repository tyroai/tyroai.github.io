import { HugeiconsIcon } from "@hugeicons/react"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { CountText } from "./CountText"
import { listIcon } from "./listIcon"
import { VIEW_META } from "./viewMeta"

/** Dar kapsayıcıda rayın yerine: görünümler ve listeler tek yatay şeritte. */
export function ChipStrip({ board, view, counts, onView }) {
  const { t } = useLocale()
  const items = [
    ...VIEW_META.map((v) => ({
      id: v.id,
      icon: v.icon,
      label: t(`todo.view.${v.id}`),
      count: v.id === "done" ? 0 : counts[v.id],
    })),
    ...board.lists.map((l) => ({
      id: `list:${l.id}`,
      icon: listIcon(l),
      label: l.name,
      count: counts[`list:${l.id}`],
    })),
  ]
  return (
    <div
      role="group"
      aria-label={t("todo.view.aria")}
      className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 [scrollbar-width:none]"
    >
      {items.map((it) => (
        <button
          key={it.id}
          type="button"
          onClick={() => onView(it.id)}
          aria-pressed={view === it.id}
          className={cn(
            "inline-flex shrink-0 items-center gap-1.5 rounded-full border px-3 py-1.5 text-[0.75rem] transition [@media(pointer:coarse)]:min-h-10",
            view === it.id
              ? "border-brand/30 bg-brand/[0.09] font-semibold text-foreground"
              : "border-border bg-card text-foreground/75 hover:text-foreground",
          )}
        >
          <HugeiconsIcon
            icon={it.icon}
            className={cn("size-3.5", view === it.id ? "text-brand" : "text-muted-foreground")}
            strokeWidth={1.9}
          />
          <span className="max-w-[9rem] truncate">{it.label}</span>
          {it.count > 0 && (
            <span className="tabular-nums text-muted-foreground">
              <CountText n={it.count} />
            </span>
          )}
        </button>
      ))}
    </div>
  )
}
