import { useEffect, useMemo, useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import {
  addMonths,
  keyTarget,
  monthCells,
  monthStart,
  pickDay,
  previewRange,
  shiftRange,
  showMonth,
} from "@/features/selfservice/lib/leaveCalendar"
import { dayInfo, sameDay, startOfDay, ymd } from "@/lib/leaveDays"
import { firstDayOfWeek } from "@/lib/weekStart"
import { cn } from "@/lib/utils"
import { CalendarDay } from "./CalendarDay"
import { CalendarLegend } from "./CalendarLegend"
import { teamDayText } from "./leaveText"
import { TeamTip } from "./TeamTip"
import { useTwoMonths, weeksOf } from "./useTwoMonths"

const OPTS_MONTH = { month: "long", year: "numeric" }
const OPTS_DOW = { weekday: "short" }
const OPTS_DOW_LONG = { weekday: "long" }
const OPTS_FULL = { weekday: "long", day: "numeric", month: "long", year: "numeric" }
// Balon kabın kenarına bu kadar yakınsa (px) içeri kayar.
const EDGE = 96

/**
 * İzin formunun satır içi aralık takvimi. İki dokunuş: başlangıç, bitiş (başlangıçtan önceki gün
 * yeni başlangıç olur, aynı gün tek günlük izin; kurallar `features/selfservice/lib/leaveCalendar`). Gün katmanları
 * `CalendarDay`'de. Klavye: tek sekme durağı; oklar gün/hafta, PageUp/PageDown ay, Home/End
 * hafta, Enter/Boşluk uç seçer, Shift+ok aralığı uzatır. `own`: gün → "mine" · "pending";
 * `team`: gün → o gün izinli ekip (yalnız Ekibim'i görebilende dolu; fareyle adlar balonda).
 */
export function RangeCalendar({ start, end, active, own, team, today, onChange }) {
  const { t, locale } = useLocale()
  const box = useRef(null)
  const two = useTwoMonths(box)
  const months = two ? 2 : 1
  const firstDay = firstDayOfWeek(locale)
  const [first, setFirst] = useState(() => monthStart(start ?? today))
  const [focus, setFocus] = useState(() => startOfDay(start ?? today))
  const [hover, setHover] = useState(null)
  const [tip, setTip] = useState(null)
  const buttons = useRef(new Map())
  const moved = useRef(false)

  // Başlangıç değişince (köprü önerisi, "Bu günü seç") ay ona gelir; görünüyorsa ay kıpırdamaz.
  // Çizim sırasında ayarlanır (efekt olsa bir kare eski ay görünürdü).
  const sync = `${start ? ymd(start) : ""}|${months}`
  const [synced, setSynced] = useState(sync)
  if (synced !== sync) {
    setSynced(sync)
    if (start) {
      setFirst(showMonth(first, months, start))
      setFocus(startOfDay(start))
    }
  }

  // Klavyeyle gezinince odak yeni günün düğmesine taşınır (ay değişmiş olabilir).
  useEffect(() => {
    if (!moved.current) return
    moved.current = false
    buttons.current.get(ymd(focus))?.focus()
  }, [focus, first])

  const fmtMonth = getDateTimeFormat(locale, OPTS_MONTH)
  const fmtFull = getDateTimeFormat(locale, OPTS_FULL)
  const dows = useMemo(() => {
    const short = getDateTimeFormat(locale, OPTS_DOW)
    const long = getDateTimeFormat(locale, OPTS_DOW_LONG)
    // Bilinen bir pazartesiden, dilin hafta başına kaydırılmış yedi gün adı.
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date(2024, 0, 1 + ((firstDay + 6 + i) % 7))
      return { short: short.format(d), long: long.format(d) }
    })
  }, [locale, firstDay])

  const preview = previewRange({ start, active }, hover)
  const band = preview ?? (start && end ? { start, end } : null)
  const pick = (day) => onChange(pickDay({ start, end, active }, day))

  const onKey = (e, day) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault()
      pick(day)
      return
    }
    const target = keyTarget(e.key, day, firstDay)
    if (!target) return
    e.preventDefault()
    if (e.shiftKey && e.key.startsWith("Arrow"))
      onChange({ ...shiftRange({ start, end }, day, target), active: "start" })
    moved.current = true
    setFirst((f) => showMonth(f, months, target))
    setFocus(target)
  }

  const label = (day, info, layer, people, isStart, isEnd) => {
    const parts = [fmtFull.format(day)]
    if (info.kind === "holiday") parts.push(t(`special.day.${info.holiday}`))
    if (info.kind === "eve") parts.push(t("selfService.leave.legend.eve"))
    if (layer === "mine") parts.push(t("selfService.leave.legend.mine"))
    if (layer === "pending") parts.push(t("selfService.leave.legend.pending"))
    if (isStart) parts.push(t("myspace.slot.start"))
    if (isEnd && !isStart) parts.push(t("myspace.slot.end"))
    if (people) parts.push(teamDayText(t, locale, people))
    return parts.join(", ")
  }

  // Ekip balonu günün üst ortasına, kaba göre; yalnız işaretli günde.
  const showTip = (el, key, people) => {
    const b = box.current?.getBoundingClientRect()
    if (!people || !b) return setTip(null)
    const r = el.getBoundingClientRect()
    const x = r.left - b.left + r.width / 2
    const align = x < EDGE ? "left" : x > b.width - EDGE ? "right" : "center"
    setTip({ key, x, y: r.top - b.top, align, people })
  }
  const hideTip = (key) => setTip((v) => (v && (!key || v.key === key) ? null : v))

  // "Ekip izinde" lejantı yalnız görünen aylarda işaret varsa.
  const visibleTeam =
    team?.size > 0 &&
    Array.from({ length: months }, (_, m) => addMonths(first, m)).some((month) =>
      monthCells(month, firstDay).some((d) => d && team.has(ymd(d))),
    )

  const nav = (n) => setFirst((f) => addMonths(f, n))
  return (
    <div ref={box} className="relative min-w-0">
      <div className="mb-2 flex items-center gap-1">
        <button
          type="button"
          onClick={() => nav(-1)}
          aria-label={t("selfService.leave.prevMonth")}
          className="grid size-9 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:size-11"
        >
          <HugeiconsIcon
            icon={ArrowLeft01Icon}
            aria-hidden="true"
            className="size-4 rtl:-scale-x-100"
            strokeWidth={2}
          />
        </button>
        <button
          type="button"
          onClick={() => nav(1)}
          aria-label={t("selfService.leave.nextMonth")}
          className="grid size-9 place-items-center rounded-full text-foreground/80 transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:size-11"
        >
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            aria-hidden="true"
            className="size-4 rtl:-scale-x-100"
            strokeWidth={2}
          />
        </button>
        <button
          type="button"
          onClick={() => {
            setFirst(monthStart(today))
            setFocus(startOfDay(today))
          }}
          className="ms-auto h-9 rounded-full px-3 text-[0.8125rem] font-semibold text-brand-ink transition hover:bg-brand/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
        >
          {t("selfService.leave.today")}
        </button>
      </div>
      <div
        className={cn("grid gap-6", two && "grid-cols-2")}
        onMouseLeave={() => {
          setHover(null)
          hideTip()
        }}
      >
        {Array.from({ length: months }, (_, m) => {
          const month = addMonths(first, m)
          const cells = monthCells(month, firstDay)
          const title = fmtMonth.format(month)
          return (
            <div key={ymd(month)} className="min-w-0">
              <p className="mb-1.5 text-center text-[0.875rem] font-semibold capitalize">{title}</p>
              <div role="grid" aria-label={title}>
                <div role="row" className="grid grid-cols-7">
                  {dows.map((d) => (
                    <span
                      key={d.short}
                      role="columnheader"
                      aria-label={d.long}
                      className="pb-1 text-center text-[0.6875rem] font-medium text-muted-foreground"
                    >
                      {d.short}
                    </span>
                  ))}
                </div>
                {weeksOf(cells).map((week, w) => (
                  <div key={w} role="row" className="grid grid-cols-7">
                    {week.map((day, i) => {
                      if (!day) return <span key={`x${i}`} role="gridcell" />
                      const key = ymd(day)
                      const info = dayInfo(day)
                      const layer = own?.get(key) ?? null
                      const people = team?.get(key) ?? null
                      const isStart = Boolean(band && sameDay(day, band.start))
                      const isEnd = Boolean(band && sameDay(day, band.end))
                      return (
                        <CalendarDay
                          key={key}
                          day={day}
                          info={info}
                          layer={layer}
                          people={people}
                          inBand={Boolean(band && day >= band.start && day <= band.end)}
                          isStart={isStart}
                          isEnd={isEnd}
                          isToday={sameDay(day, today)}
                          focusable={sameDay(day, focus)}
                          label={label(day, info, layer, people, isStart, isEnd)}
                          buttonRef={(el) =>
                            el ? buttons.current.set(key, el) : buttons.current.delete(key)
                          }
                          onPick={() => {
                            setFocus(startOfDay(day))
                            pick(day)
                          }}
                          onHover={(e) => {
                            setHover(day)
                            showTip(e.currentTarget, key, people)
                          }}
                          onKeyDown={(e) => onKey(e, day)}
                          onFocus={(e) => showTip(e.currentTarget, key, people)}
                          onBlur={() => hideTip(key)}
                        />
                      )
                    })}
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
      <CalendarLegend team={visibleTeam} />
      <TeamTip tip={tip} />
    </div>
  )
}
