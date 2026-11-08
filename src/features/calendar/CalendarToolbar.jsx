import { HugeiconsIcon } from "@hugeicons/react"
import ArrowLeft01Icon from "@hugeicons/core-free-icons/ArrowLeft01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Calendar04Icon from "@hugeicons/core-free-icons/Calendar04Icon"
import { SegmentedControl } from "@/components/common/SegmentedControl"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { VIEWS } from "@/features/calendar/lib/range"
import { rangeTitle } from "@/features/calendar/lib/rangeTitle"

// Bugün simgesindeki gün sayısı dilin rakamlarıyla; adı tarihi de söyler (görünen sayı adın içinde).
const DAY_NUM = { day: "numeric" }
const DAY_NAME = { day: "numeric", month: "long" }

/**
 * Izgaranın üstündeki gezinme satırı: [Bugün] · [‹][›] · dönem başlığı (tam olarak görünen günler,
 * sonunda parantez içinde soluk hafta: "2–6 Kasım 2026 (45. hafta)") · en sağda [Gün | Hafta | Ay]. Hafta
 * sonu ızgaranın içinde katlanır (`WeekGrid` › `fold`). Tek satır; dar kapta sarar, başlık önce. Telefonda
 * görünüm seçici yok (hafta şeridi + ajanda) ve satır hiç sarmaz: Bugün bugünün tarihini taşıyan simge,
 * başlık kısa ("26 Eki – 1 Kas (44. hf)"). Kişi ekle ve Yenile sayfa başlığında, Yeni'nin solunda.
 */
export function CalendarToolbar({
  view,
  days,
  firstDay,
  today,
  phone,
  tools = null,
  onView,
  onToday,
  onStep,
}) {
  const { locale, t } = useLocale()
  const { title, note } = rangeTitle({ view, days, locale, t, firstDay, compact: phone, today })
  const options = VIEWS.map((v) => ({ value: v, label: t(`calendar.page.view.${v}`) }))
  const todayLabel = t("calendar.today")
  return (
    <div className="cal-toolbar">
      <div className="cal-tools" data-tour="cal-tools">
        {phone ? (
          <button
            type="button"
            className="cal-btn cal-today"
            data-icon=""
            aria-label={`${todayLabel}, ${getDateTimeFormat(locale, DAY_NAME).format(today)}`}
            title={todayLabel}
            onClick={onToday}
          >
            <HugeiconsIcon
              icon={Calendar04Icon}
              className="cal-today-ic"
              strokeWidth={1.6}
              aria-hidden="true"
            />
            <span className="cal-today-day" aria-hidden="true">
              {getDateTimeFormat(locale, DAY_NUM).format(today)}
            </span>
          </button>
        ) : (
          <button type="button" className="cal-btn" onClick={onToday}>
            {todayLabel}
          </button>
        )}
        <div className="cal-nav" role="group" aria-label={t("calendar.page.navigate")}>
          <button type="button" aria-label={t("calendar.page.prev")} onClick={() => onStep(-1)}>
            <HugeiconsIcon
              icon={ArrowLeft01Icon}
              className="cal-ic"
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
          <button type="button" aria-label={t("calendar.page.next")} onClick={() => onStep(1)}>
            <HugeiconsIcon
              icon={ArrowRight01Icon}
              className="cal-ic"
              strokeWidth={2}
              aria-hidden="true"
            />
          </button>
        </div>
      </div>
      <div className="cal-titles" aria-live="polite">
        {/* Not başlığın içinde; parantezli parça bölünmez, sığmazsa bütün olarak alta iner. Telefonda
            sarmaz: sığmazsa yalnız tarih kısalır (…), hafta notu kalır. */}
        <h2 className="cal-title">
          <span className="cal-title-main">{title}</span> <span className="cal-sub">({note})</span>
        </h2>
      </div>
      {!phone && (
        <div className="cal-tools cal-tools-end">
          {tools}
          <SegmentedControl
            options={options}
            value={view}
            onChange={onView}
            label={t("calendar.page.views")}
          />
        </div>
      )}
    </div>
  )
}
