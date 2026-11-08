import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Flag02Icon from "@hugeicons/core-free-icons/Flag02Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { Separator } from "@/components/ui/separator"
import { CalendarMonthGrid } from "../CalendarMonthGrid"
import { useLocale } from "@/hooks/useLocale"
import { ANNIVERSARY_DAYS, BIRTHDAY_DAYS } from "@/lib/celebrations"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { startOfDay } from "@/lib/calendarRange"
import { specialDaysOfYear, hasReligiousData, isoOf } from "@/data/specialDays"
import { cn } from "@/lib/utils"
import { DayAgenda } from "./DayAgenda"
import { DayRow } from "./DayRow"
import { countdownLabel, gridKey, gridKeyOf, parseIso } from "./dayMath"

// Kütük doğum günü ve yıl dönümünü önümüzdeki bu kadar gün için taşıyor.
const WINDOW_DAYS = Math.min(BIRTHDAY_DAYS, ANNIVERSARY_DAYS)
const OPTS_DAY_MONTH = { day: "numeric", month: "long" }
const OPTS_WEEKDAY = { weekday: "long" }

/**
 * ÖZEL GÜNLER sekmesi (bildirim çanı): üstte takvim yaprağı (`CalendarMonthGrid`, iki hafta; ok
 * ayı açar), altında SEÇİLİ GÜNÜN özeti (varsayılan bugün; `DayAgenda`: özel gün · doğum günleri
 * · iş yıl dönümleri · aramıza katılanlar) ve yılın özel günleri (yaklaşanlar önce, geçmiş katlı).
 * Veri `useSpecialDaysData`dan (çanın rozetiyle aynı). Graph'a gitmez: tatiller statik tablodan
 * (`data/specialDays.js`). Kurallar: `docs/features/ozel-gunler.md`.
 */
export function SpecialDaysPanel({ today, todayIso, soon, people, peopleKnown }) {
  const { locale, t } = useLocale()
  const [visibleMonth, setVisibleMonth] = useState(today)
  const [selectedDay, setSelectedDay] = useState(null) // null = bugün
  const [gridCollapsed, setGridCollapsed] = useState(true)
  const [showPast, setShowPast] = useState(false)

  const year = visibleMonth.getFullYear()
  const days = useMemo(() => specialDaysOfYear(year), [year])
  const past = useMemo(() => days.filter((s) => s.to < todayIso), [days, todayIso])
  const upcoming = useMemo(() => days.filter((s) => s.to >= todayIso), [days, todayIso])

  /* Izgaradaki işaretler: tatiller + kutlama olan günler. Dar kipte ızgara ay
     sınırını aştığı için komşu yıllar da taranır. Anahtar ızgaranınki
     (`gridKey`, ay 0 tabanlı) — ISO verilirse hiçbir nokta çizilmez. */
  const marked = useMemo(() => {
    const set = new Set()
    for (const y of [year - 1, year, year + 1]) {
      for (const s of specialDaysOfYear(y)) for (const iso of s.dates) set.add(gridKey(iso))
    }
    for (const p of people) {
      const d = new Date(today)
      d.setDate(d.getDate() + p.inDays)
      set.add(gridKeyOf(d))
    }
    return set
    // `today` her çizimde yeni nesne; gün değişimi `todayIso`dan okunur.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, people, todayIso])

  const fmtDayMonth = getDateTimeFormat(locale, OPTS_DAY_MONTH)
  const fmtWeekday = getDateTimeFormat(locale, OPTS_WEEKDAY)

  // Dar kipte bir adım İKİ HAFTA (yaprağın boyu), açık kipte bir ay.
  const step = (delta) =>
    setVisibleMonth((m) => {
      if (gridCollapsed) {
        const next = new Date(m)
        next.setDate(next.getDate() + delta * 14)
        return next
      }
      return new Date(m.getFullYear(), m.getMonth() + delta, 1)
    })

  const pick = (d) => {
    setVisibleMonth(d)
    setSelectedDay(isoOf(d) === todayIso ? null : startOfDay(d))
  }
  // Seçili günü bir gün geri/ileri al (ızgara da o güne gider).
  const stepDay = (delta) => {
    const d = new Date(selectedDay ?? today)
    d.setDate(d.getDate() + delta)
    pick(d)
  }
  const toToday = () => {
    setSelectedDay(null)
    setVisibleMonth(today)
  }

  // Geçmiş bir yıla gezinildiğinde liste boş kalmasın.
  const pastOpen = showPast || upcoming.length === 0

  return (
    <>
      <div className="shrink-0">
        <CalendarMonthGrid
          visibleMonth={visibleMonth}
          onPrev={() => step(-1)}
          onNext={() => step(1)}
          selectedDay={selectedDay}
          onSelectDay={(d) => {
            // Seçili güne yeniden basmak bugüne döndürür.
            if (selectedDay && isoOf(selectedDay) === isoOf(d)) toToday()
            else pick(d)
          }}
          markedDays={marked}
          collapsed={gridCollapsed}
          onToggleCollapsed={() => setGridCollapsed((v) => !v)}
        />
      </div>

      <Separator className="shrink-0" />

      {/* Yaklaşan tatil şeridi: yalnız pencere içinde bir tatil varken (haber). */}
      {soon.length > 0 && (
        <button
          type="button"
          onClick={() => pick(parseIso(soon[0].from))}
          className="flex shrink-0 items-center gap-2 border-b border-border bg-brand/[0.10] px-4 py-2 text-start transition hover:bg-brand/[0.14] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
        >
          <HugeiconsIcon
            icon={Flag02Icon}
            className="size-3.5 shrink-0 text-brand"
            strokeWidth={2.2}
          />
          <span className="min-w-0 flex-1 truncate text-[0.71875rem] font-medium text-foreground">
            {t(`special.day.${soon[0].id}`)}
          </span>
          {/* Nötr yazı: tonlu zeminde marka mürekkebi zayıf paletlerde AA'nın altına iniyor. */}
          <span className="shrink-0 text-[0.6875rem] font-semibold tabular-nums text-foreground">
            {countdownLabel(soon[0], todayIso, t)}
          </span>
        </button>
      )}

      {/* Gün özeti ve yılın listesi TEK kaydırma alanı: ızgara yerinde kalır. */}
      <div className="min-h-0 overflow-y-auto overscroll-contain pb-1 [scrollbar-gutter:auto]! [scrollbar-width:thin] [&::-webkit-scrollbar]:w-1.5 [&::-webkit-scrollbar-thumb]:rounded-full [&::-webkit-scrollbar-thumb]:bg-foreground/15">
        <DayAgenda
          day={selectedDay ?? today}
          todayIso={todayIso}
          people={people}
          peopleKnown={peopleKnown}
          windowDays={WINDOW_DAYS}
          holidays={[...past, ...upcoming]}
          onToday={toToday}
          onStep={stepDay}
          fmtDayMonth={fmtDayMonth}
          fmtWeekday={fmtWeekday}
          t={t}
        />

        <div className="flex items-baseline gap-2 px-4 pb-1 pt-3">
          <span className="text-[0.625rem] font-semibold uppercase tracking-[0.11em] text-muted-foreground">
            {t("special.title")}
          </span>
          <span className="ml-auto text-[0.6875rem] font-semibold tabular-nums text-muted-foreground">
            {year}
          </span>
        </div>

        {upcoming.map((s) => (
          <DayRow
            key={s.id + s.from}
            entry={s}
            todayIso={todayIso}
            fmtDayMonth={fmtDayMonth}
            fmtWeekday={fmtWeekday}
            t={t}
            onPick={pick}
            highlight={soon.some((x) => x.from === s.from)}
          />
        ))}

        {upcoming.length === 0 && past.length > 0 && (
          <p className="px-4 pb-1 pt-2 text-[0.6875rem] text-muted-foreground">
            {t("special.noneUpcoming")}
          </p>
        )}

        {/* Geçmiş günler katlı: önce yaklaşanlar; düğme `aria-expanded` taşır. */}
        {past.length > 0 && (
          <>
            <button
              type="button"
              onClick={() => setShowPast((v) => !v)}
              aria-expanded={pastOpen}
              className="mt-1 flex w-full items-center gap-1.5 border-t border-border px-4 py-2 text-left text-[0.6875rem] font-medium text-muted-foreground transition hover:bg-accent/60 hover:text-foreground"
            >
              <HugeiconsIcon
                icon={ArrowRight01Icon}
                className={cn("size-3.5 shrink-0 transition-transform", pastOpen && "rotate-90")}
                strokeWidth={2.2}
              />
              {t("special.past")}
              <span className="tabular-nums text-muted-foreground">({past.length})</span>
            </button>
            {pastOpen &&
              past.map((s) => (
                <DayRow
                  key={s.id + s.from}
                  entry={s}
                  todayIso={todayIso}
                  fmtDayMonth={fmtDayMonth}
                  fmtWeekday={fmtWeekday}
                  t={t}
                  onPick={pick}
                  dim
                />
              ))}
          </>
        )}

        {/* Eksik veri söylenir: dinî bayramlar elle girilir (data/specialDays.js). */}
        {!hasReligiousData(year) && (
          <p className="flex items-start gap-2 border-t border-border px-4 py-3 text-[0.6875rem] leading-snug text-muted-foreground">
            <HugeiconsIcon icon={Flag02Icon} className="mt-px size-3.5 shrink-0" strokeWidth={2} />
            {t("special.religiousMissing")}
          </p>
        )}
      </div>
    </>
  )
}
