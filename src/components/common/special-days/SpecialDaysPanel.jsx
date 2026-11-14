import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import { CalendarMonthGrid } from "../CalendarMonthGrid"
import { BellSection } from "../bell/BellSection"
import { useLocale } from "@/hooks/useLocale"
import { ANNIVERSARY_DAYS, BIRTHDAY_DAYS } from "@/lib/celebrations"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { startOfDay } from "@/lib/calendarRange"
import { specialDaysOfYear, hasReligiousData, isoOf } from "@/data/specialDays"
import { DayAgenda } from "./DayAgenda"
import { DayRow } from "./DayRow"
import { gridKey, gridKeyOf } from "./dayMath"
import "./specialDays.css"

// Kütük doğum günü ve yıl dönümünü önümüzdeki bu kadar gün için taşıyor.
const WINDOW_DAYS = Math.min(BIRTHDAY_DAYS, ANNIVERSARY_DAYS)
const OPTS_DAY_MONTH = { day: "numeric", month: "long" }
const OPTS_WEEKDAY = { weekday: "long" }

/**
 * ÖZEL GÜNLER TAKVİMİ (bildirim panelinin ikinci görünümü): üstte ayın takvimi
 * (`CalendarMonthGrid`), altında SEÇİLİ GÜNÜN özeti (varsayılan bugün; `DayAgenda`) ve yılın
 * resmî tatilleri (yaklaşanlar önce, geçmiş katlı). `initialDay`: listeden bir tatile basılarak
 * gelindiyse o gün seçili açılır. Hepsi tek kaydırma alanı; listeden bir güne basınca alan başa
 * döner (`toTop`): takvim ve günün özeti görünür. Veri `useSpecialDaysData`dan (çanın rozetiyle
 * aynı). Graph'a gitmez: tatiller statik tablodan (`data/specialDays.js`).
 * Kurallar: `docs/features/ozel-gunler.md`.
 */
export function SpecialDaysPanel({
  today,
  todayIso,
  soon,
  people,
  peopleKnown,
  initialDay = null,
  mobile,
  onBack,
  toTop,
}) {
  const { locale, t } = useLocale()
  const [visibleMonth, setVisibleMonth] = useState(initialDay ?? today)
  const [selectedDay, setSelectedDay] = useState(initialDay) // null = bugün
  const [showPast, setShowPast] = useState(false)

  const year = visibleMonth.getFullYear()
  const days = useMemo(() => specialDaysOfYear(year), [year])
  const past = useMemo(() => days.filter((s) => s.to < todayIso), [days, todayIso])
  const upcoming = useMemo(() => days.filter((s) => s.to >= todayIso), [days, todayIso])

  /* Izgaradaki işaretler: tatiller + kutlama olan günler. Izgara ay sınırını aştığı için komşu
     yıllar da taranır. Anahtar ızgaranınki (`gridKey`, ay 0 tabanlı) — ISO verilirse hiçbir
     nokta çizilmez. */
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

  const step = (delta) => setVisibleMonth((m) => new Date(m.getFullYear(), m.getMonth() + delta, 1))
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
  const pickFromList = (d) => {
    pick(d)
    toTop?.(true)
  }

  // Geçmiş bir yıla gezinildiğinde liste boş kalmasın.
  const pastOpen = showPast || upcoming.length === 0
  const rowProps = { todayIso, fmtDayMonth, fmtWeekday, t, onPick: pickFromList }

  return (
    <>
      <div className="bn-head" data-sub="">
        <button
          type="button"
          className="bn-icon-btn"
          data-bn-back=""
          aria-label={t("bell.back")}
          title={t("bell.back")}
          onClick={onBack}
        >
          <HugeiconsIcon icon={ArrowLeft01Icon} strokeWidth={2} aria-hidden="true" />
        </button>
        <h2 className="bn-title">{t("special.title")}</h2>
      </div>

      <div className="bn-body">
        <div className="bn-cal">
          <CalendarMonthGrid
            visibleMonth={visibleMonth}
            onPrev={() => step(-1)}
            onNext={() => step(1)}
            // Seçici kipi: günler ok tuşlarıyla gezilir (tek sekme durağı), ay dışı günler okunur.
            picker
            selectedDay={selectedDay ?? today}
            onSelectDay={(d) => {
              // Seçili güne yeniden basmak bugüne döndürür.
              if (selectedDay && isoOf(selectedDay) === isoOf(d)) toToday()
              else pick(d)
            }}
            markedDays={marked}
            roomy={mobile}
          />
        </div>

        <DayAgenda
          day={selectedDay ?? today}
          todayIso={todayIso}
          people={people}
          peopleKnown={peopleKnown}
          windowDays={WINDOW_DAYS}
          holidays={days}
          onToday={toToday}
          onStep={stepDay}
          fmtDayMonth={fmtDayMonth}
          fmtWeekday={fmtWeekday}
          t={t}
        />

        <div className="bn-rule" aria-hidden="true" />

        <BellSection label={t("bell.sec.holidays")} count={year}>
          {upcoming.map((s) => (
            <DayRow
              key={s.id + s.from}
              entry={s}
              highlight={soon.some((x) => x.from === s.from)}
              {...rowProps}
            />
          ))}

          {upcoming.length === 0 && past.length > 0 && (
            <p className="bn-note">{t("special.noneUpcoming")}</p>
          )}

          {/* Geçmiş günler katlı: önce yaklaşanlar; düğme `aria-expanded` taşır. Yaklaşan
              kalmadıysa düğme yok, liste açık (kapatılınca bölüm boş kalırdı). */}
          {past.length > 0 && upcoming.length > 0 && (
            <button
              type="button"
              onClick={() => setShowPast((v) => !v)}
              aria-expanded={showPast}
              className="bn-more"
              data-fold=""
            >
              {t("special.past")}
              <span className="bn-sec-count">{past.length}</span>
              <HugeiconsIcon icon={ArrowDown01Icon} strokeWidth={2} aria-hidden="true" />
            </button>
          )}
          {pastOpen && past.map((s) => <DayRow key={s.id + s.from} entry={s} dim {...rowProps} />)}

          {/* Eksik veri söylenir: dinî bayramlar elle girilir (data/specialDays.js). */}
          {!hasReligiousData(year) && <p className="bn-note">{t("special.religiousMissing")}</p>}
        </BellSection>
      </div>
    </>
  )
}
