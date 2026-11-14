import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Flag02Icon from "@hugeicons/core-free-icons/Flag02Icon"
import { isoOf } from "@/data/specialDays"
import { daysBetween, relativeDay } from "./dayMath"
import { PeopleGroup } from "./PeopleGroup"
import { KINDS, useAgendaPeople } from "./useAgendaPeople"

const STEPS = [
  [-1, ArrowLeft01Icon, "special.prevDay"],
  [1, ArrowRight01Icon, "special.nextDay"],
]

/**
 * Takvimde seçili günün özeti (varsayılan bugün): o günün özel günü, doğum günleri, iş yıl
 * dönümleri, aramıza katılanlar — her biri kendi başlığıyla. Kutlama kütüğü yalnız önümüzdeki
 * `windowDays` günü taşıyor; dışındaki gün için "bilinmiyor" notu düşülür, boş liste gibi
 * okunmasın.
 */
export function DayAgenda({
  day,
  todayIso,
  people,
  peopleKnown,
  windowDays,
  holidays,
  onToday,
  onStep,
  fmtDayMonth,
  fmtWeekday,
  t,
}) {
  const iso = isoOf(day)
  const offset = daysBetween(todayIso, iso)
  const isToday = offset === 0
  const { groups, shown, photoOf } = useAgendaPeople({ people, peopleKnown, offset, windowDays })
  const holidaysOn = holidays.filter((h) => h.dates.includes(iso))
  const dayText = isToday ? t("feed.cel.today") : fmtDayMonth.format(day)
  const outOfRange = peopleKnown && !groups

  return (
    <section aria-live="polite" className="bn-day">
      <div className="bn-day-head">
        <span className="bn-sec-label">{relativeDay(offset, t)}</span>
        <span className="bn-day-date">
          {fmtDayMonth.format(day)} · {fmtWeekday.format(day)}
        </span>
        <div className="bn-day-nav">
          {!isToday && (
            <button type="button" onClick={onToday} className="bn-link">
              {t("special.backToToday")}
            </button>
          )}
          {STEPS.map(([delta, icon, label]) => (
            <button
              key={delta}
              type="button"
              onClick={() => onStep(delta)}
              aria-label={t(label)}
              title={t(label)}
              className="bn-icon-btn"
              data-size="sm"
            >
              <HugeiconsIcon icon={icon} strokeWidth={2} aria-hidden="true" />
            </button>
          ))}
        </div>
      </div>

      {holidaysOn.map((h) => (
        <div key={h.id + h.from} className="bn-row" data-static="">
          <span className="bn-lead" data-kind="tile" data-tone="brand" aria-hidden="true">
            <HugeiconsIcon icon={Flag02Icon} strokeWidth={1.8} />
          </span>
          <span className="bn-text">
            <span className="bn-name">{t(`special.day.${h.id}`)}</span>
            <span className="bn-sub">{t("special.group.holidays")}</span>
          </span>
        </div>
      ))}

      {KINDS.map((kind) => (
        <PeopleGroup
          key={kind}
          kind={kind}
          people={groups?.[kind] ?? []}
          photoOf={photoOf}
          dayText={dayText}
          isToday={isToday}
          t={t}
        />
      ))}

      {groups && !shown.length && !holidaysOn.length && (
        <p className="bn-note">{t("special.dayEmpty")}</p>
      )}
      {outOfRange && <p className="bn-note">{t("special.outOfRange", { n: windowDays })}</p>}
    </section>
  )
}
