import { getDateTimeFormat, getNumberFormat } from "@/lib/intl-cache"
import { durationText, timeFormat, weekdayName } from "../dayInsightText"

const OPTS_DATE = { weekday: "long", day: "numeric", month: "long" }

/** Ortalamaya göre yük: belirgin fark yoksa "ortalama düzeyde". */
function avgText(t, locale, ratio) {
  if (ratio == null) return null
  if (ratio >= 1.2) {
    const x = getNumberFormat(locale, { maximumFractionDigits: 1 }).format(
      Math.round(ratio * 10) / 10,
    )
    return t("insight.tip.avgTimes", { x })
  }
  return ratio <= 0.8 ? t("insight.tip.avgBelow") : t("insight.tip.avgSame")
}

/**
 * İpucu kartının içeriği (tembel parça): şeridin verisi, en çok dört satır (Yük · Boşluk ·
 * Hafta · İşler; izin, yolculuk ve köprüde o satır başta), kaynak notu ve eylemin metni.
 * Satır yalnız verisi varsa: taban yoksa kıyas yazılmaz, aralık haftayı kapsamıyorsa hafta yok.
 */
export function insightRows(ins, { t, locale }) {
  const f = ins.facts
  const time = timeFormat(locale)
  const fmt = (d) => (d ? time.format(d) : "")
  const range = (a, b) => `${fmt(a)}–${fmt(b)}`
  const rows = []

  if (f.away)
    rows.push({ key: "away", label: t("insight.tip.away"), value: t("insight.tip.awayValue") })
  if ((ins.id === "trip" || ins.id === "tripCity") && ins.time) {
    const city = ins.city ? (ins.city[locale] ?? ins.city.en ?? Object.values(ins.city)[0]) : ""
    rows.push({ key: "trip", label: t("insight.tip.trip"), value: city || fmt(ins.time) })
  }
  if (ins.id === "bridge" && ins.holiday)
    rows.push({
      key: "bridge",
      label: t("insight.tip.bridge"),
      value: t("insight.tip.bridgeValue", {
        holiday: t(`widgets.holiday.name.${ins.holiday}`),
        n: ins.n ?? "",
      }),
    })

  const b = f.baseline
  const sub = [
    avgText(t, locale, b?.ratio ?? null),
    b?.lastWeek != null ? t("insight.tip.lastWeek", { time: durationText(t, b.lastWeek) }) : null,
  ].filter(Boolean)
  rows.push({
    key: "load",
    label: t("insight.tip.load"),
    value: f.meetings
      ? t("insight.tip.loadValue", { n: f.meetings, time: durationText(t, f.minutes) })
      : t("insight.tip.none"),
    sub: sub.join(" · ") || null,
  })

  // Toplantısız günde boşluk satırı bir şey söylemez (bütün gün boş).
  if (f.meetings) {
    const best = f.windows.reduce((a, w) => (!a || w.minutes > a.minutes ? w : a), null)
    rows.push({
      key: "gaps",
      label: t("insight.tip.gaps"),
      value: f.pieces
        ? t(f.pieces === 1 ? "insight.tip.gapsOne" : "insight.tip.gapsValue", {
            free: durationText(t, f.free),
            n: f.pieces,
          })
        : t("insight.tip.gapsNone"),
      sub:
        best && f.pieces > 1
          ? t("insight.tip.longest", { range: range(best.start, best.end) })
          : null,
    })
  }

  // Bir buçuk saatlik "en yoğun gün" bir şey anlatmaz.
  const peak = f.week?.busiest
  if (peak && peak.minutes >= 120)
    rows.push({
      key: "week",
      label: t("insight.tip.week"),
      value: f.week.peak
        ? t("insight.tip.weekPeak")
        : t("insight.tip.weekOther", {
            weekday: weekdayName(peak.date, locale),
            time: durationText(t, peak.minutes),
          }),
    })

  if (f.tasks)
    rows.push({
      key: "tasks",
      label: t("insight.tip.tasks"),
      value: f.tasks.open
        ? [
            t("insight.tip.tasksValue", { n: f.tasks.open }),
            f.tasks.overdue ? t("insight.tip.tasksLate", { n: f.tasks.overdue }) : null,
          ]
            .filter(Boolean)
            .join(" · ")
        : t("insight.tip.tasksNone"),
    })

  const list = ins.sources.map((s) => t(`insight.tip.src.${s}`)).join(", ")
  return {
    rows: rows.slice(0, 4),
    note: t("insight.tip.sources", { list }),
    action: actionText(ins.action, { t, locale, range, fmt }),
  }
}

/** Eylemin etiketi ve ne yapacağını anlatan cümlesi. */
function actionText(action, { t, locale, fmt }) {
  if (!action) return null
  if (action.kind === "focus") {
    const p = { start: fmt(action.start), end: fmt(action.end) }
    return {
      ...action,
      label: t("insight.act.focus", p),
      why: t("insight.act.focusWhy", { ...p, subject: t("widgets.focusWindow.subject") }),
    }
  }
  if (action.kind === "plan")
    return { ...action, label: t("insight.act.plan"), why: t("insight.act.planWhy") }
  const date = getDateTimeFormat(locale, OPTS_DATE).format(action.day)
  return { ...action, label: t("insight.act.leave"), why: t("insight.act.leaveWhy", { date }) }
}
