import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import { useLocale } from "@/hooks/useLocale"
import { countdown } from "@/lib/horizon"
import { DateTile } from "./DateTile"
import { AddMilestone } from "./HorizonActions"
import HorizonDetail from "./HorizonDetail"
import { MilestoneMeta } from "./MilestoneMeta"
import { toneOf } from "./horizonFormat"

/**
 * Dar kartın "+n" penceresi: bütün hedefler zaman sırasıyla; birine basınca aynı pencerede
 * ayrıntısı (Geri ile listeye). Altta yeni hedef.
 */
export default function HorizonAll({ view, today, horizon, canOpenTodo }) {
  const { t } = useLocale()
  const [selected, setSelected] = useState(null)
  const live = selected ? view.list.find((x) => x.id === selected) : null
  if (live) {
    const cd = countdown(today, live.dueKey)
    return (
      <div>
        <button
          type="button"
          onClick={() => setSelected(null)}
          className="ms-2 mt-2 inline-flex h-8 items-center gap-1 rounded-full px-2 text-[0.75rem] font-medium text-muted-foreground transition outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            className="size-3.5 rtl:rotate-180"
            strokeWidth={2}
          />
          {t("widgets.horizon.title")}
        </button>
        <HorizonDetail
          item={live}
          today={today}
          tone={toneOf(live, cd, view.next)}
          horizon={horizon}
          canOpenTodo={canOpenTodo}
          onClose={() => setSelected(null)}
        />
      </div>
    )
  }
  return (
    <div className="flex flex-col gap-2 p-3 pt-2">
      <ol className="flex max-h-80 flex-col gap-1 overflow-y-auto">
        {view.list.map((item) => {
          const cd = countdown(today, item.dueKey)
          const tone = toneOf(item, cd, view.next)
          return (
            <li key={item.id}>
              <button
                type="button"
                onClick={() => setSelected(item.id)}
                disabled={item.pending}
                className="flex w-full min-w-0 items-center gap-3 rounded-2xl px-1.5 py-1 text-start transition outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60"
              >
                <DateTile dueKey={item.dueKey} tone={tone} />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-[0.875rem] leading-snug font-semibold">
                    {item.title}
                  </span>
                  <MilestoneMeta item={item} tone={tone} cd={cd} list className="mt-0.5" />
                </span>
              </button>
            </li>
          )
        })}
      </ol>
      {horizon.selected.length > 0 && (
        <AddMilestone
          horizon={horizon}
          align="start"
          trigger={
            <button
              type="button"
              className="inline-flex h-9 items-center justify-center rounded-full border border-dashed border-border text-[0.8125rem] font-medium text-muted-foreground transition outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
            >
              {t("widgets.horizon.add")}
            </button>
          }
        />
      )}
    </div>
  )
}
