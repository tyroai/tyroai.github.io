import { useMemo, useRef, useState } from "react"
import UserTime01Icon from "@hugeicons/core-free-icons/UserTime01Icon"
import { savePeople, useCommonTime } from "@/features/widgets/hooks/useCommonTime"
import { useLocale } from "@/hooks/useLocale"
import { usePeoplePhotos } from "@/hooks/usePeoplePhotos"
import { commonSlot, hoursOverlap } from "@/lib/commonTime"
import { WidgetBody } from "../WidgetBody"
import { WidgetEmpty } from "../WidgetEmpty"
import { FrameAction, WidgetFrame } from "../WidgetFrame"
import { PageBody, Pager } from "../paging/Pager"
import { usePager } from "../paging/usePager"
import { useNarrow } from "../useNarrow"
import { PeopleDialog } from "./PeopleDialog"
import { PersonRow } from "./PersonRow"
import { SlotBlock } from "./SlotBlock"
import "./commonTime.css"

// Boş durumun tek düğmesi — hava kartının boş durumuyla aynı hap.
const CTA =
  "inline-flex h-8 items-center gap-1.5 rounded-full bg-brand-fill-deep px-3.5 text-[0.75rem] font-semibold text-brand-on-brand transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60 pointer-coarse:h-11 [&_svg]:size-3.5"

/**
 * Ortak saat — farklı ofislerden 2–6 kişi: her birinin şehri, yerel saati ve şimdiki durumu
 * (müsait · toplantıda · ofis dışında · gece · mesai dışı) ve herkesin (sen dahil) boş ve
 * mesaisinde olduğu ilk yarım saat; "Outlook'ta aç" toplantı penceresini doldurur. Veri
 * `useCommonTime` (getSchedule), hesap `lib/commonTime`. Geniş kartta kişiler solda, boşluk
 * sağda (`commonTime.css`).
 */
export function CommonTimeWidget({ ctx, className }) {
  const { t } = useLocale()
  const ct = useCommonTime()
  const [editing, setEditing] = useState(false)
  const now = ctx.now
  const photos = usePeoplePhotos(ct.people.map((p) => p.address))
  const schedules = useMemo(() => ct.schedules ?? [], [ct.schedules])
  const byAddress = useMemo(() => new Map(schedules.map((s) => [s.address, s])), [schedules])
  const slot = useMemo(
    () => (ct.status === "ready" ? commonSlot(schedules, ct.start, 1, now) : null),
    [ct.status, schedules, ct.start, now],
  )
  // Boşluk yoksa: mesailer mi kesişmiyor, takvimler mi dolu.
  const overlap = useMemo(
    () => slot != null || (ct.status === "ready" && hoursOverlap(schedules, ct.start, now)),
    [slot, ct.status, schedules, ct.start, now],
  )
  // Geniş kartta (içerik ≥ 30rem, `commonTime.css`) kişiler solda üç satır; dar kartta boşluğun
  // altında iki satır (15rem'lik satıra sığsın).
  const box = useRef(null)
  const rem =
    typeof window === "undefined"
      ? 16
      : parseFloat(getComputedStyle(document.documentElement).fontSize) || 16
  const narrow = useNarrow(box, 30 * rem)
  const pager = usePager(ct.people, narrow ? 2 : 3)
  const partial = schedules.some((s) => s.error)
  const title = t("widgets.commonTime.title")

  return (
    <WidgetFrame
      id="common-time"
      title={title}
      icon={UserTime01Icon}
      busy={ct.status === "loading"}
      className={className}
      pager={<Pager pager={pager} label={title} />}
      action={
        ct.people.length > 0 && (
          <FrameAction onClick={() => setEditing(true)}>{t("widgets.commonTime.edit")}</FrameAction>
        )
      }
    >
      {ct.status === "idle" ? (
        <WidgetEmpty
          icon={UserTime01Icon}
          action={
            <button type="button" className={CTA} onClick={() => setEditing(true)}>
              {t("widgets.commonTime.pick")}
            </button>
          }
        >
          {t("widgets.commonTime.empty")}
        </WidgetEmpty>
      ) : (
        <div ref={box} className="flex min-h-0 flex-1 flex-col">
          <WidgetBody status={ct.status}>
            <div className="ct-body">
              <SlotBlock
                at={slot}
                now={now}
                schedules={schedules}
                me={ct.me}
                addresses={ct.people.map((p) => p.address)}
                partial={partial}
                overlap={overlap}
              />
              <PageBody pager={pager} className="ct-people space-y-1">
                {pager.items.map((p) => (
                  <PersonRow
                    key={p.address}
                    person={p}
                    sched={byAddress.get(p.address.toLowerCase()) ?? null}
                    now={now}
                    start={ct.start}
                    photo={photos.get(p.address.toLowerCase()) ?? null}
                  />
                ))}
              </PageBody>
            </div>
          </WidgetBody>
        </div>
      )}
      <PeopleDialog
        open={editing}
        onOpenChange={setEditing}
        value={ct.people}
        onSave={savePeople}
      />
    </WidgetFrame>
  )
}
