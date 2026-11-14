import { lazy, Suspense } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import Flag02Icon from "@hugeicons/core-free-icons/Flag02Icon"
import Notification01Icon from "@hugeicons/core-free-icons/Notification01Icon"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { countdownLabel, parseIso } from "../special-days/dayMath"
import { PeopleGroup } from "../special-days/PeopleGroup"
import { KINDS, useAgendaPeople } from "../special-days/useAgendaPeople"
import { BellSection } from "./BellSection"
import { FeedNotices } from "./FeedNotices"

// Bekleyen soru (otomatik yanıt) satırı yalnız soru varken iner.
const BellOof = lazy(() => import("./BellOof"))

const OPTS_TODAY = { day: "numeric", month: "long", weekday: "long" }
const OPTS_DAY_MONTH = { day: "numeric", month: "long" }
const OPTS_WEEKDAY = { weekday: "long" }
// Kalabalık günde her gruptan ilk bu kadar kişi; kalanı "N kişi daha" ile açılır.
const GROUP_LIMIT = 5
const SKELETON = [0, 1, 2]

/** Yaklaşan resmî tatil: basınca takvim o günde açılır. */
function HolidayRow({ entry, todayIso, fmtDayMonth, fmtWeekday, t, onOpen }) {
  const from = parseIso(entry.from)
  const date =
    entry.from === entry.to
      ? `${fmtDayMonth.format(from)} · ${fmtWeekday.format(from)}`
      : fmtDayMonth.formatRange(from, parseIso(entry.to))
  const focusKey = `day:${entry.from}`
  return (
    <li>
      <button
        type="button"
        className="bn-row"
        data-bn-focus={focusKey}
        onClick={() => onOpen(from, focusKey)}
      >
        <span className="bn-lead" data-kind="tile" data-tone="brand" aria-hidden="true">
          <HugeiconsIcon icon={Flag02Icon} strokeWidth={1.8} />
        </span>
        <span className="bn-text">
          <span className="bn-name">{t(`special.day.${entry.id}`)}</span>
          <span className="bn-sub">{date}</span>
        </span>
        <span className="bn-meta">{countdownLabel(entry, todayIso, t)}</span>
      </button>
    </li>
  )
}

/**
 * BİLDİRİMLER (panelin ilk görünümü): tek liste, önem sırasıyla — bekleyen soru (otomatik yanıt),
 * Keşfet'in yeni iş bildirimleri, yaklaşan resmî tatiller (bu ya da gelecek hafta) ve BUGÜNÜN
 * kutlamaları (doğum günü · iş yıl dönümü · aramıza katılan). Altta özel günler takvimine geçiş.
 * Kutlamalar yüklenirken üç satırlık iskelet; hiçbir şey yoksa sakin bir boş durum.
 */
export function BellInbox({ mobile, data, feed, feedOpen, notice, onClose, onCalendar }) {
  const { t, locale } = useLocale()
  const { today, todayIso, soon, people, peopleKnown, peopleLoading } = data
  const { groups, shown, photoOf } = useAgendaPeople({
    people,
    peopleKnown,
    offset: 0,
    windowDays: 0,
  })
  const fmtDayMonth = getDateTimeFormat(locale, OPTS_DAY_MONTH)
  const fmtWeekday = getDateTimeFormat(locale, OPTS_WEEKDAY)
  const hasFeed = feedOpen && (feed.items?.length ?? 0) > 0
  const empty = !notice && !hasFeed && !soon.length && !shown.length && !peopleLoading

  return (
    <>
      <div className="bn-head">
        {/* Telefonda başlık çekmecenin kendisinde. */}
        {!mobile && <h2 className="bn-title">{t("bell.title")}</h2>}
        <span className="bn-date">{getDateTimeFormat(locale, OPTS_TODAY).format(today)}</span>
      </div>

      <div className="bn-body">
        {notice && (
          <Suspense fallback={null}>
            <BellOof />
          </Suspense>
        )}

        {feedOpen && <FeedNotices feed={feed} onNavigate={onClose} />}

        {soon.length > 0 && (
          <BellSection label={t("bell.sec.holidays")}>
            <ul className="bn-list">
              {soon.map((s) => (
                <HolidayRow
                  key={s.id + s.from}
                  entry={s}
                  todayIso={todayIso}
                  fmtDayMonth={fmtDayMonth}
                  fmtWeekday={fmtWeekday}
                  t={t}
                  onOpen={onCalendar}
                />
              ))}
            </ul>
          </BellSection>
        )}

        {KINDS.map((kind) => (
          <PeopleGroup
            key={kind}
            kind={kind}
            people={groups?.[kind] ?? []}
            photoOf={photoOf}
            dayText={t("feed.cel.today")}
            isToday
            t={t}
            limit={GROUP_LIMIT}
          />
        ))}

        {peopleLoading && (
          <div className="bn-sec" aria-hidden="true">
            {SKELETON.map((i) => (
              <div key={i} className="bn-row" data-static="">
                <span className="bn-lead ms-skeleton" />
                <span className="bn-text">
                  <span className="bn-bar ms-skeleton" />
                  <span className="bn-bar ms-skeleton" />
                </span>
              </div>
            ))}
          </div>
        )}

        {empty && (
          <div className="bn-empty">
            <span className="bn-empty-ic" aria-hidden="true">
              <HugeiconsIcon icon={Notification01Icon} strokeWidth={1.8} />
            </span>
            <p className="bn-empty-title">{t("bell.empty.title")}</p>
            <p className="bn-empty-sub">{t("bell.empty.sub")}</p>
          </div>
        )}
      </div>

      <div className="bn-foot">
        <button
          type="button"
          className="bn-foot-btn"
          data-bn-focus="calendar"
          onClick={() => onCalendar(null, "calendar")}
        >
          <span className="bn-lead" aria-hidden="true">
            <HugeiconsIcon icon={Calendar03Icon} strokeWidth={1.8} />
          </span>
          <span className="bn-foot-label">{t("bell.calendar")}</span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            strokeWidth={2}
            aria-hidden="true"
            className="bn-chev"
          />
        </button>
      </div>
    </>
  )
}
