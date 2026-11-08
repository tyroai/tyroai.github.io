import { useLayoutEffect, useMemo, useRef, useState } from "react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import MilestoneIcon from "@hugeicons/core-free-icons/MilestoneIcon"
import { useLocale } from "@/hooks/useLocale"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { STATUS } from "@/lib/graph"
import { arrangeMilestones } from "@/lib/horizon"
import { localDayKey } from "@/lib/todo"
import { WidgetBody } from "../WidgetBody"
import { WidgetEmpty } from "../WidgetEmpty"
import { WidgetFrame } from "../WidgetFrame"
import { PageBody, Pager } from "../paging/Pager"
import { usePager } from "../paging/usePager"
import { useSlotSize } from "../slotSize"
import { HorizonActions } from "./HorizonActions"
import { HorizonStack } from "./HorizonStack"
import { NoMilestones, PickFirst } from "./HorizonEmpty"
import { horizonTier, roadColumns } from "./horizonTier"
import { MilestoneItem } from "./MilestoneItem"
import { useHorizon } from "./useHorizon"
import "./horizon.css"

// Dikey telefon ve dar pencere. `useIsMobile` değil: o yatay telefonu da sayar, orada büyük kart
// yol haritası göstermeli.
const NARROW_SCREEN = "(max-width: 767px)"

/**
 * Düzen basamağı (`horizonTier`): boyamadan önce ölçülür (ilk karede atlama yok), kart boyu
 * değişince yeniden. Panoda kartın boyu (mini · büyük) da hesaba girer.
 */
function useTier(ref) {
  const size = useSlotSize()
  const narrowScreen = useMediaQuery(NARROW_SCREEN)
  const [tier, setTier] = useState("stack")
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return undefined
    const measure = () => setTier(horizonTier(el.offsetWidth, size, narrowScreen))
    measure()
    if (typeof ResizeObserver === "undefined") return undefined
    const ro = new ResizeObserver(measure)
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref, size, narrowScreen])
  return tier
}

function Skeleton() {
  return (
    <div aria-hidden="true" className="mt-3 space-y-3">
      {[0, 1].map((i) => (
        <span key={i} className="flex items-center gap-3">
          <span className="ms-skeleton block h-12 w-14 rounded-[0.875rem]" />
          <span className="flex-1 space-y-1.5">
            <span className="ms-skeleton block h-3.5 w-2/3 rounded-full" />
            <span className="ms-skeleton block h-3 w-1/3 rounded-full" />
          </span>
        </span>
      ))}
    </div>
  )
}

/**
 * Ufukta — hedefler ve kilometre taşları: kişinin seçtiği To Do listelerindeki tarihli görevler.
 * Sıradaki hedef paletin dolgusuyla öne çıkar, gecikenler kırmızımsı, adımı olanın halkası dolar.
 * Mini (dar) kartta en çok üç hedef alt alta ("+n hedef" ile hepsi), büyük kartta (geniş kart,
 * sol sütun) yatay yol haritası — sayfa başına 2–4, genişliğe göre. Hedefe basınca ayrıntı;
 * başlıkta yeni hedef ve liste seçimi (dar kartta yalnız liste).
 */
export function HorizonWidget({ ctx, className }) {
  const { t } = useLocale()
  const horizon = useHorizon()
  const body = useRef(null)
  const tier = useTier(body)
  const columns = roadColumns(tier)
  const road = columns > 0
  const compact = tier === "compact"
  const today = localDayKey(new Date(ctx.now))
  const kept = useMemo(
    () => new Set(horizon.items.filter((x) => x.justDone).map((x) => x.id)),
    [horizon.items],
  )
  const view = useMemo(
    () => arrangeMilestones(horizon.items, today, { done: horizon.settings.done, kept }),
    [horizon.items, today, horizon.settings.done, kept],
  )
  const pager = usePager(view.list, columns || 4)
  const title = t("widgets.horizon.title")
  const ready = horizon.status === STATUS.ready

  let content
  if (horizon.status === "loading") content = <Skeleton />
  else if (horizon.status === STATUS.denied)
    content = (
      <WidgetEmpty
        icon={MilestoneIcon}
        action={
          <button
            type="button"
            onClick={horizon.connect}
            className="mt-1 inline-flex h-8 items-center rounded-full bg-brand-solid px-3.5 text-[0.75rem] font-semibold text-brand-on-brand outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
          >
            {t("myspace.todo.connect")}
          </button>
        }
      >
        {t("widgets.horizon.connect")}
      </WidgetEmpty>
    )
  else if (horizon.status === STATUS.error)
    content = (
      <WidgetEmpty
        icon={Alert02Icon}
        action={
          <button
            type="button"
            onClick={horizon.retry}
            className="mt-1 inline-flex h-8 items-center rounded-full border border-border px-3.5 text-[0.75rem] font-medium outline-none hover:bg-accent focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
          >
            {t("widgets.horizon.retry")}
          </button>
        }
      >
        {t("widgets.common.unavailable")}
      </WidgetEmpty>
    )
  else if (!ready) content = <WidgetBody status={horizon.status} />
  else if (!horizon.selected.length) content = <PickFirst horizon={horizon} compact={compact} />
  else if (!view.list.length) content = <NoMilestones horizon={horizon} compact={compact} />
  else if (!road)
    content = (
      <HorizonStack
        view={view}
        today={today}
        horizon={horizon}
        canOpenTodo={Boolean(ctx.pageAccess?.todo)}
        compact={compact}
      />
    )
  else
    content = (
      <>
        <PageBody
          pager={pager}
          as="ol"
          aria-label={title}
          className="hz-road mt-3 grid gap-2"
          style={{ "--hz-cols": pager.items.length }}
        >
          {pager.items.map((item) => (
            <MilestoneItem
              key={item.id}
              item={item}
              today={today}
              next={view.next}
              layout="road"
              horizon={horizon}
              canOpenTodo={Boolean(ctx.pageAccess?.todo)}
            />
          ))}
        </PageBody>
        {horizon.skipped > 0 && (
          <p className="mt-auto pt-2 text-[0.6875rem] text-muted-foreground">
            {t("widgets.horizon.skipped", { n: horizon.skipped })}
          </p>
        )}
      </>
    )

  return (
    <WidgetFrame
      id="horizon"
      title={title}
      shortTitle={t("widgets.horizon.titleShort")}
      icon={MilestoneIcon}
      busy={horizon.status === "loading"}
      className={className}
      pager={road ? <Pager pager={pager} label={title} /> : null}
      action={ready ? <HorizonActions horizon={horizon} compact={compact} /> : null}
    >
      <div ref={body} className="flex min-h-0 flex-1 flex-col">
        {content}
      </div>
    </WidgetFrame>
  )
}
