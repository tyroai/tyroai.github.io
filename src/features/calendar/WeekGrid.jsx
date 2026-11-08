import { useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { useLocale } from "@/hooks/useLocale"
import { useMinuteNow } from "@/hooks/useMinuteNow"
import { allDayRowItems } from "@/features/calendar/lib/holidayBlocks"
import {
  clipToDay,
  hourParts,
  MIN_MINUTES,
  placeSpans,
  splitDay,
} from "@/features/calendar/lib/layout"
import { dayKey, minuteOf } from "@/features/calendar/lib/range"
import { AllDayChip } from "./AllDayChip"
import { AnchoredPopover } from "./AnchoredPopover"
import { EventBlock } from "./EventBlock"
import { clock, dayFull, weekdayShort } from "./format"
import { MoreList } from "./MoreList"
import { useFitHours } from "./useFitHours"
import { useLaneCap } from "./useLaneCap"

const MAX_LANES = 3
// Bir bloğun en az bu kadar yüksek (px) çizilmesi: tek satır başlık okunsun.
const MIN_BLOCK_PX = 22
const HOURS = Array.from({ length: 24 }, (_, h) => h)

/**
 * Görünen günlerin en erken saatli başlangıcı (saat): sabah erken başlayan blok kaydırma başlangıcının
 * (07:30) üstünde kalıp başlığını gizlemesin. Gece yarısından taşan ve gece yarısında başlayanlar
 * sayılmaz (kırpılmış başlangıç gerçek başlangıç değil); yoksa null.
 */
function earliestHour(items, days) {
  let min = null
  for (const d of days) {
    const key = dayKey(d)
    for (const item of splitDay(items, key).timed) {
      const { from } = clipToDay(item, key)
      if (from >= 4 * 60 && (min == null || from < min)) min = from
    }
  }
  return min == null ? null : min / 60
}

/** Şu an çizgisi: bugünün sütununda ince çizgi ve solda nokta; dakikada bir ilerler. */
function NowLine() {
  const now = useMinuteNow()
  return <span className="cal-now" aria-hidden="true" style={{ "--top": minuteOf(now) / 60 }} />
}

/**
 * Bir günün saat sütunu: çakışan bloklar yan yana, resmî tatil arkada tam genişlik zemin
 * (`hourParts`); boş yere (zeminin boş yeri dahil) basınca o saatle "Yeni" menüsü.
 */
function HourColumn({ day, items, today, detail, lanes, minMinutes, onOpen, onMore, onSlot }) {
  const { t } = useLocale()
  const key = dayKey(day)
  const { rows, bands } = useMemo(
    () => hourParts(items, key, lanes, minMinutes),
    [items, key, lanes, minMinutes],
  )
  const isToday = key === dayKey(today)
  return (
    <div
      className="cal-col"
      data-today={isToday || undefined}
      onClick={(e) => {
        if (e.target !== e.currentTarget) return
        const box = e.currentTarget.getBoundingClientRect()
        const half = Math.floor(((e.clientY - box.top) / box.height) * 48)
        onSlot({ day, minute: Math.min(47, Math.max(0, half)) * 30, x: e.clientX, y: e.clientY })
      }}
    >
      {bands.map((row) => (
        <EventBlock key={row.item.id} row={row} band detail={detail} onOpen={onOpen} />
      ))}
      {rows.map((row) =>
        row.more ? (
          <button
            key={`more:${row.items[0].id}`}
            type="button"
            className="cal-ev-more"
            style={{ "--top": row.from / 60 }}
            aria-label={t("calendar.page.moreDay", { n: row.more })}
            onClick={(e) => onMore(row.items, e.currentTarget)}
          >
            +{row.more}
          </button>
        ) : (
          <EventBlock key={row.item.id} row={row} detail={detail} onOpen={onOpen} />
        ),
      )}
      {isToday && <NowLine />}
    </div>
  )
}

/**
 * Hafta ve gün görünümü: başlık satırı (gün adı + numara, bugün paletin dolgusunda), tüm gün
 * satırı (çok günlü çipler tek parça, en çok üç şerit, fazlası "+n"; gün görünümünde hepsi),
 * saat ızgarası (24 saat; saat yüksekliği mesai görünen alana sığacak kadar, `useFitHours`). Resmî tatil tüm gün satırında değil
 * ızgarada: her günü mesai kadar (arife yarım gün) bir blok (`features/calendar/lib/holidayBlocks`).
 * Başlık ve tüm gün satırı kaydırma kabında yapışkan: ızgarayla aynı genişlikte, kaydırma
 * çubuğu hizayı bozmaz.
 */
export function WeekGrid({
  days,
  items,
  today,
  detail = false,
  scrollKey,
  fold = null,
  comfort = false,
  onOpen,
  onSlot,
  onDay,
}) {
  const { locale, t } = useLocale()
  const scroller = useRef(null)
  const sticky = useRef(null)
  // Mesai (07:30–18:00) kaydırmadan sığsın: saat yüksekliği görünen alana göre (`useFitHours`).
  const early = useMemo(() => earliestHour(items, days), [items, days])
  const hour = useFitHours(scroller, sticky, scrollKey, early, comfort)
  // Dar ölçekte 15 dakikalık blok birkaç piksele iniyordu: görsel en az bir satır, çakışma bu süreyle.
  const minMinutes = hour
    ? Math.max(MIN_MINUTES, Math.ceil((MIN_BLOCK_PX / hour) * 60))
    : MIN_MINUTES
  // Dar sütunda yan yana en çok bu kadar çakışan blok; ötesi "+n" listesinde.
  const lanes = useLaneCap(scroller, days.length)
  const [more, setMore] = useState(null)
  // Listeden bir bloğa basınca liste kapanır, ayrıntı bir kare sonra açılır: kapanışın odak işi
  // (düğmeye dönüş) yeni yüzeyin odağıyla yarışıp onu kapatmasın (`handoff`, StatTip'teki gibi).
  const handoff = useRef(false)
  const openMore = (list, el) => {
    handoff.current = false
    const anchor = {
      getBoundingClientRect: () => el.getBoundingClientRect(),
      get isConnected() {
        return el.isConnected
      },
      focus: (options) => {
        if (!handoff.current) el.focus(options)
      },
    }
    setMore({ list, el, anchor })
  }
  const todayKey = dayKey(today)
  // Gün görünümünde "+n" gidecek başka yer yok (aynı gün, aynı görünüm): hepsi şerit olur.
  const maxLanes = days.length === 1 ? Infinity : MAX_LANES
  const spans = useMemo(
    () => placeSpans(allDayRowItems(items), days, maxLanes),
    [items, days, maxLanes],
  )
  const labels = useMemo(() => HOURS.map((h) => clock(new Date(2000, 0, 1, h), locale)), [locale])
  const hasMore = spans.more.some((n) => n > 0)
  return (
    <div
      className="cal-week"
      data-ux-exempt=""
      data-single={days.length === 1 || undefined}
      data-fold={fold ? (fold.open ? "open" : "closed") : undefined}
      style={{ "--cols": days.length, ...(hour && { "--cal-hour": `${hour}px` }) }}
    >
      <div className="cal-scroll" ref={scroller}>
        <div className="cal-sticky" ref={sticky}>
          <div className="cal-wk-head">
            <span className="cal-gut" />
            {days.map((d) => (
              <button
                key={dayKey(d)}
                type="button"
                className="cal-dh"
                data-today={dayKey(d) === todayKey || undefined}
                aria-current={dayKey(d) === todayKey ? "date" : undefined}
                title={dayFull(d, locale)}
                onClick={() => onDay(d)}
              >
                <span className="cal-dow">{weekdayShort(d, locale)}</span>{" "}
                <span className="cal-dnum">{d.getDate()}</span>
              </button>
            ))}
            {fold && (
              <button
                type="button"
                className="cal-fold"
                aria-expanded={fold.open}
                aria-label={t(
                  fold.open ? "calendar.page.weekendHide" : "calendar.page.weekendShow",
                )}
                title={t(fold.open ? "calendar.page.weekendHide" : "calendar.page.weekendShow")}
                onClick={fold.onToggle}
              >
                <HugeiconsIcon
                  icon={fold.open ? ArrowLeft01Icon : ArrowRight01Icon}
                  className="cal-ic rtl:rotate-180"
                  strokeWidth={2}
                  aria-hidden="true"
                />
              </button>
            )}
          </div>
          <div className="cal-allday" role="group" aria-label={t("calendar.allDay")}>
            <span className="cal-gut cal-allday-label">{t("calendar.allDayShort")}</span>
            <div
              className="cal-allday-grid"
              style={{ "--lanes": Math.max(1, spans.lanes) + (hasMore ? 1 : 0) }}
            >
              {spans.chips.map((chip) => (
                <AllDayChip key={`${chip.item.id}:${chip.col}`} chip={chip} onOpen={onOpen} />
              ))}
              {spans.more.map(
                (n, col) =>
                  n > 0 && (
                    <button
                      key={col}
                      type="button"
                      className="cal-more"
                      style={{ gridColumn: col + 1, gridRow: MAX_LANES + 1 }}
                      aria-label={t("calendar.page.moreDay", { n })}
                      onClick={() => onDay(days[col])}
                    >
                      +{n}
                    </button>
                  ),
              )}
            </div>
            {fold && <span className="cal-fold-gap" aria-hidden="true" />}
          </div>
        </div>
        <div className="cal-hours">
          <div className="cal-gut cal-gutter" aria-hidden="true">
            {HOURS.slice(1).map((h) => (
              <span key={h} className="cal-hl" style={{ "--top": h }}>
                {labels[h]}
              </span>
            ))}
          </div>
          {days.map((d) => (
            <HourColumn
              key={dayKey(d)}
              day={d}
              items={items}
              today={today}
              detail={detail}
              lanes={lanes}
              minMinutes={minMinutes}
              onOpen={onOpen}
              onMore={openMore}
              onSlot={onSlot}
            />
          ))}
          {fold && (
            // Katlı şeridin kendisi de açar (fare kolaylığı); erişilebilir denetim başlıktaki düğme.
            <span
              className="cal-fold-col"
              aria-hidden="true"
              onClick={fold.open ? undefined : fold.onToggle}
            >
              {!fold.open && (
                <span className="cal-fold-label">{t("calendar.page.weekendShort")}</span>
              )}
            </span>
          )}
        </div>
      </div>
      {more && (
        <AnchoredPopover
          anchor={more.anchor}
          title={t("calendar.page.moreDay", { n: more.list.length })}
          className="cal-pop cal-pop-tip"
          onClose={() => setMore(null)}
        >
          <MoreList
            items={more.list}
            onOpen={(item) => {
              handoff.current = true
              setMore(null)
              requestAnimationFrame(() => {
                if (!more.el.isConnected) return
                more.el.focus({ preventScroll: true })
                onOpen(item, more.el)
              })
            }}
          />
        </AnchoredPopover>
      )}
    </div>
  )
}
