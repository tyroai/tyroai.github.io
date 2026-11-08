import { HugeiconsIcon } from "@hugeicons/react"
import MilestoneIcon from "@hugeicons/core-free-icons/MilestoneIcon"
import { listIcon } from "@/features/todo/listIcon"
import { useLocale } from "@/hooks/useLocale"
import { AddMilestone, PickLists } from "./HorizonActions"

const CHIP =
  "inline-flex h-8 max-w-[11rem] items-center gap-1.5 rounded-full border border-border bg-card/70 px-3 text-[0.75rem] font-medium transition outline-none hover:border-brand/40 hover:bg-brand/[0.06] focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"

function Sun() {
  return (
    <span className="hz-sun grid size-11 place-items-center rounded-full text-brand-ink">
      <HugeiconsIcon icon={MilestoneIcon} className="size-5" strokeWidth={1.7} aria-hidden="true" />
    </span>
  )
}

/**
 * Henüz liste seçilmedi: "hangi listeyi izleyelim?" — en çok üç liste tek dokunuşla seçilir
 * (işaretli e-postalar önerilmez), "Tüm listeler" hepsini açar. Dar kartta yalnız tek düğme.
 */
export function PickFirst({ horizon, compact = false }) {
  const { t } = useLocale()
  const offer = compact ? [] : horizon.lists.filter((l) => l.kind !== "flagged").slice(0, 3)
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-2 text-center">
      {!compact && <Sun />}
      <p className="max-w-[17rem] text-[0.8125rem] leading-snug text-muted-foreground">
        {t("widgets.horizon.pick")}
      </p>
      <div className="flex max-w-full flex-wrap justify-center gap-1.5">
        {offer.map((l) => (
          <button
            key={l.id}
            type="button"
            className={CHIP}
            onClick={() => horizon.toggleList(l.id)}
          >
            <HugeiconsIcon
              icon={listIcon(l)}
              className="size-3.5 shrink-0 text-muted-foreground"
              strokeWidth={1.9}
              aria-hidden="true"
            />
            <span className="truncate">{l.name}</span>
          </button>
        ))}
        {horizon.lists.length > offer.length && (
          <PickLists
            horizon={horizon}
            align="center"
            trigger={
              <button type="button" className={CHIP}>
                {t(compact ? "widgets.horizon.lists" : "widgets.horizon.allLists")}
              </button>
            }
          />
        )}
      </div>
    </div>
  )
}

/** Seçili listelerde tarihli görev yok: To Do'da tarih vermek ya da buradan eklemek. */
export function NoMilestones({ horizon, compact = false }) {
  const { t } = useLocale()
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 py-2 text-center">
      {!compact && <Sun />}
      <p className="max-w-[17rem] text-[0.8125rem] leading-snug text-muted-foreground">
        {t("widgets.horizon.none")}
        {!compact && ` ${t("widgets.horizon.noneHint")}`}
      </p>
      <AddMilestone
        horizon={horizon}
        align="center"
        trigger={
          <button type="button" className={CHIP}>
            {t("widgets.horizon.add")}
          </button>
        }
      />
    </div>
  )
}
