import { useMemo, useState } from "react"
import ChartColumnIcon from "@hugeicons/core-free-icons/ChartColumnIcon"
import { useLocale } from "@/hooks/useLocale"
import { STATUS } from "@/lib/graph"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { weekStats } from "@/features/myspace/lib/weekStats"
import { WidgetFrame } from "@/features/widgets/WidgetFrame"
import { OPTS_WEEKDAY_SHORT } from "./cardFormats"
import { InsightTip } from "./InsightTip"
import { useRhythmTips } from "./hooks/useRhythmTips"
import { rhythmWeeks } from "./lib/rhythmWeeks"
import { compactHours } from "./rhythmFormat"
import { WeekSelect } from "./RhythmWeek"
import "./rhythmMini.css"

/**
 * Toplantı ritmin — panodaki KÜÇÜK kart (2+1+1 ızgaranın dar hücresi). Büyük kartın özü:
 *
 * - başlıkta hafta seçici (geçen · bu · gelecek hafta, büyük kartla aynı);
 * - haftanın toplantı süresi büyük ("19 sa 30 dk"), altında kaç toplantı;
 * - haftanın ritmi: her gün ince bir sütun, ortak ölçekte (sakin hafta yoğun görünmesin); en yoğun
 *   gün paletin dolgusu, bugün paletin tonu, öteki günler sakin gri. **Her sütun bir düğme:**
 *   üstüne gelince ya da basınca büyük karttaki gün balonu açılır (`useRhythmTips`: o günün
 *   toplantıları, süresi, çakışma notu; listeden önizleme ve özet) — ayrı pencere yok;
 * - altta boş odak süresi (geçen haftada yok) ve mesai dışı toplantı sayısı (varsa uyarı tonu).
 */
export function RhythmMini({ cal, load, now, className }) {
  const { t, locale } = useLocale()
  const [week, setWeek] = useState("current")
  const { weeks, id, days } = rhythmWeeks(load, week, t)
  const offset = id === "previous" ? -1 : id === "next" ? 1 : 0
  const stats = useMemo(() => weekStats(cal.events, now, offset), [cal.events, now, offset])
  const { tipFor, countText, dialog } = useRhythmTips(now)
  const ready = cal.status === STATUS.ready
  const total = days.reduce((s, d) => s + d.minutes, 0)
  const h = Math.floor(total / 60)
  const m = total % 60
  // Ölçek üç haftanın ortak tepesi (büyük kartla aynı kural).
  const peak = Math.max(
    60,
    ...load.current.map((d) => d.minutes),
    ...(load.previous ?? []).map((d) => d.minutes),
    ...(load.next ?? []).map((d) => d.minutes),
  )
  const peakThis = Math.max(...days.map((d) => d.minutes))
  const todayKey = new Date(now).toDateString()
  const dayFmt = getDateTimeFormat(locale, OPTS_WEEKDAY_SHORT)

  return (
    <WidgetFrame
      id="rhythm"
      tour="rhythm"
      title={t("myspace.rhythm.title")}
      shortTitle={t("myspace.rhythm.titleShort")}
      icon={ChartColumnIcon}
      busy={cal.status === "loading"}
      className={className}
      action={
        ready && weeks.length > 1 ? (
          <WeekSelect value={id} onChange={setWeek} weeks={weeks} className="rm-week" />
        ) : null
      }
    >
      {cal.status === "loading" ? (
        <div aria-hidden="true" className="rm-skel">
          <span className="ms-skeleton" />
          <span className="ms-skeleton" />
          <span className="ms-skeleton" />
        </div>
      ) : !ready ? (
        <p className="rm-empty">{t("myspace.meeting.unavailable")}</p>
      ) : (
        <div className="rm-body">
          <p className="rm-hero">
            {h > 0 && (
              <>
                <b>{h}</b>
                <small>{t("myspace.rhythm.h")}</small>
              </>
            )}
            {(m > 0 || h === 0) && (
              <>
                <b>{m}</b>
                <small>{t("myspace.rhythm.m")}</small>
              </>
            )}
          </p>
          <p className="rm-sub">
            {countText(stats.count)}
            {id === "next" ? ` · ${t("myspace.rhythm.planned")}` : ""}
          </p>
          <div role="group" aria-label={t("myspace.rhythm.title")} className="rm-bars">
            {days.map((d) => {
              const pct = d.minutes ? Math.max(8, Math.round((d.minutes / peak) * 100)) : 0
              const isPeak = d.minutes > 0 && d.minutes === peakThis
              const isToday = id === "current" && d.date.toDateString() === todayKey
              const day = dayFmt.format(d.date)
              return (
                <InsightTip key={d.date.toISOString()} {...tipFor(d, isToday)}>
                  <button
                    type="button"
                    className="rm-day"
                    data-peak={isPeak || undefined}
                    data-today={isToday || undefined}
                    aria-label={t("myspace.rhythm.dayAria", { day, minutes: d.minutes })}
                  >
                    <span aria-hidden="true" className="rm-track">
                      {/* Degrade izin boyuna göre ölçeklenir (`--rm-k`): kısa çubuk degradenin başını, uzun çubuk
                    devamını gösterir — yedi çubuk tek renk cetvelini paylaşır. */}
                      <span
                        className="rm-fill"
                        style={{ height: `${pct}%`, "--rm-k": pct > 0 ? 100 / pct : 1 }}
                      />
                    </span>
                    <span aria-hidden="true" className="rm-label">
                      {day}
                    </span>
                  </button>
                </InsightTip>
              )
            })}
          </div>
          <p className="rm-foot">
            {stats.focusMinutes != null && (
              <span>
                {t("widgets.week.focusShort")} <b>{compactHours(stats.focusMinutes, t, locale)}</b>
              </span>
            )}
            <span data-warn={stats.afterHours > 0 || undefined}>
              {t("widgets.week.afterShort")} <b>{stats.afterHours}</b>
            </span>
          </p>
          {dialog}
        </div>
      )}
    </WidgetFrame>
  )
}
