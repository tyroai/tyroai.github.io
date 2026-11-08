import { lazy, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { AddMilestone } from "./HorizonActions"
import { WidgetOverlay } from "../WidgetOverlay"
import { MilestoneItem } from "./MilestoneItem"

const HorizonAll = lazy(() => import("./HorizonAll"))

// Önde en çok bu kadar hedef: panonun satırına (15rem) kompakt karoyla üçü sığar.
const SHOWN = 3

// Kartın dibindeki sessiz bağlantı: "+5 hedef" ya da (dar kartta, hepsi görünürken) "Hedef ekle".
const FOOT =
  "mt-auto min-h-7 self-start rounded-full px-2 py-0.5 text-[0.75rem] font-medium text-muted-foreground transition outline-none hover:bg-accent hover:text-foreground focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:min-h-11"

/**
 * Dar ve orta kart: en çok üç hedef alt alta (Apple Hatırlatıcılar'ın kompakt satırı gibi) —
 * kompakt tarih karosu, ad, kalan süre · liste · adımlar. Sıradaki hedefin karosu paletin
 * dolgusunda, gecikmiş kırmızımsı. Gerisi "+n hedef" ile açılan listede (orada ayrıntı ve yeni
 * hedef). Dar kartta başlıkta "+" olmadığı için hepsi görünürken altta "Hedef ekle".
 */
export function HorizonStack({ view, today, horizon, canOpenTodo, compact }) {
  const { t } = useLocale()
  const [all, setAll] = useState(false)
  const shown = view.list.slice(0, SHOWN)
  const rest = view.list.length - shown.length
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <ol aria-label={t("widgets.horizon.title")} className="mt-2 flex flex-col gap-1">
        {shown.map((item) => (
          <MilestoneItem
            key={item.id}
            item={item}
            today={today}
            next={view.next}
            layout="row"
            horizon={horizon}
            canOpenTodo={canOpenTodo}
          />
        ))}
      </ol>
      {rest > 0 ? (
        <WidgetOverlay
          title={t("widgets.horizon.title")}
          open={all}
          onOpenChange={setAll}
          align="start"
          trigger={
            <button type="button" className={FOOT}>
              {t("widgets.horizon.more", { n: rest })}
            </button>
          }
        >
          <HorizonAll view={view} today={today} horizon={horizon} canOpenTodo={canOpenTodo} />
        </WidgetOverlay>
      ) : (
        compact &&
        horizon.selected.length > 0 && (
          <AddMilestone
            horizon={horizon}
            align="start"
            trigger={
              <button type="button" className={FOOT}>
                {t("widgets.horizon.add")}
              </button>
            }
          />
        )
      )}
    </div>
  )
}
