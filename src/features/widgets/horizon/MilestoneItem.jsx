import { lazy, useId, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { countdown, paceOf, stepsProgress } from "@/lib/horizon"
import { cn } from "@/lib/utils"
import { DateTile } from "./DateTile"
import { WidgetOverlay } from "../WidgetOverlay"
import { MilestoneMeta } from "./MilestoneMeta"
import { countdownPhrase, longDate, toneOf } from "./horizonFormat"
import { PaceChip } from "./PaceChip"

const HorizonDetail = lazy(() => import("./HorizonDetail"))

/**
 * Tek hedef: satırda (`row`) kompakt karo · ad · kalan süre, liste ve adımlar; yatay yol
 * haritasında (`road`) düğüm, karo, ad ve kalan süre; riskteyse altında "Riskte" (yalnız yol
 * haritasında — mini liste sade kalır). Basınca ayrıntı açılır (adımlar, tamamlandı, To Do'da aç).
 * Adı görünen yazısı; tam tarih, kalan sürenin cümlesi ve tempo açıklamada (ekran okuyucu).
 */
export function MilestoneItem({ item, today, next, layout, horizon, canOpenTodo }) {
  const { t, locale } = useLocale()
  const describe = useId()
  const [open, setOpen] = useState(false)
  const cd = countdown(today, item.dueKey)
  const tone = toneOf(item, cd, next)
  const road = layout === "road"
  const progress = stepsProgress(item.steps)
  const pace = paceOf(item, today)
  const risk = pace?.kind === "risk"
  const trigger = (
    <button
      type="button"
      aria-describedby={describe}
      disabled={item.pending}
      className={cn(
        "group/row relative flex min-w-0 rounded-2xl text-start transition outline-none hover:bg-foreground/[0.04] focus-visible:ring-2 focus-visible:ring-brand/40 aria-expanded:bg-accent disabled:opacity-60",
        road
          ? "w-full flex-col items-center px-1.5 pt-1.5 pb-2 text-center"
          : "-mx-2 w-[calc(100%+1rem)] items-center gap-3 px-2 py-0.5",
      )}
    >
      <DateTile dueKey={item.dueKey} tone={tone} size={road ? "md" : "sm"} />
      <span className={cn("min-w-0", road ? "mt-2 w-full" : "flex-1")}>
        <span
          className={cn(
            "block truncate text-[0.875rem] leading-snug font-semibold",
            road && "text-[0.8125rem]",
            item.done && "text-muted-foreground line-through decoration-foreground/30",
          )}
        >
          {item.title}
        </span>
        <MilestoneMeta item={item} tone={tone} cd={cd} road={road} className="mt-0.5" />
        {road && risk && <PaceChip pace={pace} className="mt-1" />}
      </span>
      <span id={describe} className="sr-only">
        {[
          longDate(item.dueKey, locale),
          item.done ? null : countdownPhrase(cd, t, locale),
          progress && t("widgets.horizon.steps", progress),
          risk && t("widgets.horizon.pace.risk"),
        ]
          .filter(Boolean)
          .join(", ")}
      </span>
    </button>
  )
  return (
    <li className={cn("relative min-w-0", road && "flex flex-col items-center")}>
      {road && <span aria-hidden="true" data-tone={tone} className="hz-node" />}
      <WidgetOverlay
        trigger={trigger}
        title={item.title}
        heading={false}
        open={open}
        onOpenChange={setOpen}
        align={road ? "center" : "start"}
      >
        <HorizonDetail
          item={item}
          today={today}
          tone={tone}
          horizon={horizon}
          canOpenTodo={canOpenTodo}
          onClose={() => setOpen(false)}
        />
      </WidgetOverlay>
    </li>
  )
}
