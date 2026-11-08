// Sayfa başlıklarının göstergeleri (InsightChips öğeleri). Sayfanın cevabı: önce rakam, ton durum
// rengi; açıklama "bu sayı neyi sayar?" sorusunu cevaplar, ekranı anlatmaz.
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import CalendarRemove01Icon from "@hugeicons/core-free-icons/CalendarRemove01Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import DashboardSpeed01Icon from "@hugeicons/core-free-icons/DashboardSpeed01Icon"
import File02Icon from "@hugeicons/core-free-icons/File02Icon"
import Fire03Icon from "@hugeicons/core-free-icons/Fire03Icon"
import Folder01Icon from "@hugeicons/core-free-icons/Folder01Icon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import UserRemove01Icon from "@hugeicons/core-free-icons/UserRemove01Icon"
import UserWarning01Icon from "@hugeicons/core-free-icons/UserWarning01Icon"
import { day, monthLabel, num, pct } from "@/features/rm/lib/format"

const loadTone = (x) => (x > 1 ? "danger" : x > 0.9 ? "warn" : "neutral")

/** En yoğun ekip-ay (>%100) ya da genel doluluk. */
function peakOrUtil(peak, util, rt, locale, { utilKey, peakTip, utilTip, onPeak, onUtil }) {
  if (peak && peak.x > 1) {
    return {
      key: "peak",
      icon: Fire03Icon,
      text: rt("rm.answer.peak"),
      vars: {
        team: peak.team,
        month: monthLabel(peak.month.y, peak.month.m, locale, { long: true }),
        pct: pct(peak.x, locale),
      },
      tone: "danger",
      tip: rt(peakTip),
      onClick: onPeak,
    }
  }
  if (util == null) return null
  return {
    key: "util",
    icon: DashboardSpeed01Icon,
    text: rt(utilKey),
    vars: { pct: pct(util, locale) },
    tone: loadTone(util),
    tip: rt(utilTip),
    onClick: onUtil,
  }
}

function overChip(n, rt, { key = "rm.ins.over", none = "rm.answer.overNone", tip, onClick }) {
  return n > 0
    ? {
        key: "over",
        icon: UserWarning01Icon,
        text: rt(key),
        vars: { n },
        tone: "danger",
        tip: rt(tip),
        onClick,
      }
    : { key: "over", icon: CheckmarkCircle02Icon, text: rt(none), tone: "ok", tip: rt(tip) }
}

export function projectInsights({ open, risk, unstaffed }, rt, setSig) {
  return [
    {
      key: "open",
      icon: Folder01Icon,
      text: rt("rm.projects.answerOpen"),
      vars: { n: open },
      tip: rt("rm.ins.openTip"),
    },
    {
      key: "risk",
      icon: risk > 0 ? CalendarRemove01Icon : CheckmarkCircle02Icon,
      text: rt("rm.projects.answerRisk"),
      vars: { n: risk },
      tone: risk > 0 ? "warn" : "ok",
      tip: rt("rm.kpi.hint.risk"),
      onClick: risk > 0 ? () => setSig("risk") : undefined,
    },
    {
      key: "unstaffed",
      icon: unstaffed > 0 ? UserRemove01Icon : CheckmarkCircle02Icon,
      text: rt("rm.projects.answerUnstaffed"),
      vars: { n: unstaffed },
      tone: unstaffed > 0 ? "warn" : "ok",
      tip: rt("rm.kpi.hint.unstaffed"),
      onClick: unstaffed > 0 ? () => setSig("unstaffed") : undefined,
    },
  ]
}

export function matrixInsights({ from, to, over, byPerson }, rt, locale, showPeople) {
  return [
    from &&
      to && {
        key: "window",
        icon: Calendar03Icon,
        text: rt("rm.matrix.answerWindow"),
        vars: { from: day(from, locale), to: day(to, locale, { year: true }) },
      },
    overChip(over, rt, {
      key: "rm.ins.rangeOver",
      none: "rm.ins.rangeOverNone",
      tip: "rm.ins.rangeOverTip",
      onClick: byPerson ? undefined : showPeople,
    }),
  ]
}

/** Kapasite göstergeleri seçili ölçüye göre: proje doluluğu ya da mesaiye göre toplam iş yükü. */
export function capacityInsights(cap, rt, locale, dayHours, measure = "project") {
  const load = measure === "load"
  return [
    peakOrUtil(cap.peak, cap.util, rt, locale, {
      utilKey: "rm.capacity.answerUtil",
      peakTip: "rm.ins.capPeakTip",
      utilTip: load ? "rm.capacity.hint.utilLoad" : "rm.capacity.hint.utilProject",
    }),
    overChip(cap.over.length, rt, {
      key: "rm.ins.capOver",
      none: "rm.ins.capOverNone",
      tip: load ? "rm.capacity.hint.overLoad" : "rm.capacity.hint.overProject",
    }),
    {
      key: "open",
      icon: cap.open >= 0 ? CheckmarkCircle02Icon : Alert02Icon,
      text: rt(cap.open >= 0 ? "rm.capacity.openFree" : "rm.capacity.openShort"),
      vars: { n: num(Math.abs(cap.open), locale) },
      tone: cap.open >= 0 ? "ok" : "danger",
      tip: rt(load ? "rm.capacity.openTipLoad" : "rm.ins.openDaysTip", { h: dayHours }),
    },
  ]
}

export function resourceInsights({ people, teams, over }, rt, go) {
  return [
    { key: "people", icon: UserGroupIcon, text: rt("rm.ins.people"), vars: { n: people } },
    { key: "teams", icon: Building03Icon, text: rt("rm.ins.teams"), vars: { n: teams } },
    overChip(over, rt, { tip: "rm.ins.overTip", onClick: () => go("kapasite") }),
  ]
}

export function settingsInsights(st, src, rt) {
  if (!src?.name) {
    return [{ key: "empty", icon: Alert02Icon, text: rt("rm.settings.answerEmpty"), tone: "warn" }]
  }
  return [
    {
      key: "plan",
      icon: File02Icon,
      text: "{name}",
      vars: { name: src.name },
      tone: "brand",
      tip: rt("rm.ins.planTip"),
    },
    {
      key: "projects",
      icon: Folder01Icon,
      text: rt("rm.ins.projects"),
      vars: { n: st.projects?.length ?? 0 },
    },
    {
      key: "people",
      icon: UserGroupIcon,
      text: rt("rm.ins.people"),
      vars: { n: st.resources.length },
    },
    {
      key: "teams",
      icon: Building03Icon,
      text: rt("rm.ins.teams"),
      vars: { n: new Set(st.resources.map((r) => r.team)).size },
    },
  ]
}
