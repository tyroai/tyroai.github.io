import { useMemo, useState } from "react"
import { useNavigate } from "react-router-dom"
import { useMsal } from "@azure/msal-react"
import { devOrbEvents, devOrbKinds, devOrbSamples } from "@/dev/orbSamples"
import { prepareMeeting } from "@/features/myspace/meetingUtils"
import { planQuestion } from "@/lib/planQuestion"
import { useInstallPromo } from "@/features/myspace/hooks/useInstallPromo"
import { useLocale } from "@/hooks/useLocale"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { requestOpenChat, setPendingAsk } from "@/lib/chatBus"
import { createFocusBlock, freeWindows } from "@/lib/focusWindow"
import { STATUS } from "@/lib/graph"
import { bridgeFor } from "@/lib/leaveBridges"
import { upcomingHolidays } from "@/lib/leaveDays"
import { getDateTimeFormat, getNumberFormat } from "@/lib/intl-cache"
import { notify } from "@/lib/notify"
import { orbSuggestions } from "@/features/myspace/lib/orbSuggest"
import { promptInstall, setInstallGuide } from "@/lib/pwaInstall"
import { planAgenda } from "@/lib/planAgenda"
import { openMeetingSummary } from "@/lib/summaryBus"
import { localDayKey } from "@/lib/todo"
import { upcomingTrips } from "@/lib/travel"
import { weekStats } from "@/features/myspace/lib/weekStats"
import { cityName } from "@/lib/worldClock"
import { loadQuestion } from "./orbQuestions"

const OFFICE = "tyroOffice"
const DAY = 86_400_000
const MAX_BLOCK = 2 * 3_600_000
const OPTS_TIME = { hour: "2-digit", minute: "2-digit", hourCycle: "h23" }
const OPTS_DAY = { weekday: "long", day: "numeric", month: "long" }
const OPTS_DATE = { day: "numeric", month: "long" }
const ONE_DECIMAL = { maximumFractionDigits: 1 }
const one = (n) => (n === 1 ? "one" : "other")

const dayStart = (d) => {
  const x = new Date(d)
  x.setHours(0, 0, 0, 0)
  return x.getTime()
}

/**
 * Küre kartının önerileri ve eylemleri: panonun verisinden girdileri çıkarır (davet, gecikmiş iş,
 * bugünkü boş odak, 1–3 gün içindeki seyahat, 21 gün içindeki köprü tatili, Keşfet), sırayı
 * `features/myspace/lib/orbSuggest` verir. Her önerinin cümlesi ve tek düğmesi; düğme gerçek işi yapar: hazırlık
 * sohbeti, toplantı özeti, takvim paneli (davetler), odak bloğu, izin formu (tarihi dolu), Keşfet.
 * Uygulama yüklenebiliyor ve yüklü değilse (`useInstallPromo` kuralları) ilk kart "Yükle": tarayıcının
 * penceresi, iPhone/iPad'de tarif; pencerede vazgeçmek öneriyi bu oturumda kapatır. `promo` da döner:
 * söylenecek başka bir şey yokken kart onu zengin kurulum kartıyla gösterir. `ctx` yoksa (pano
 * dışı) iş önerisi yok. `scene`: sahne kartlarının verisi (takvim, işler). Kişisel veri dışarı
 * çıkmaz; yalnız ekranda.
 */
export function useOrbSuggestions(ctx) {
  const { t, locale } = useLocale()
  const navigate = useNavigate()
  const { instance, accounts } = useMsal()
  const [done, setDone] = useState(() => new Set())
  const promo = useInstallPromo()
  const touch = useMediaQuery("(pointer: coarse)")
  const events = ctx?.cal?.status === STATUS.ready ? ctx.cal.events : null
  const tasks = ctx?.focus?.tasks
  const now = ctx?.now
  const canFeed = Boolean(ctx?.pageAccess?.feed)
  const canLeave = Boolean(ctx?.pageAccess?.selfService)
  const feed = canFeed ? (ctx?.feedFresh?.count ?? 0) : 0

  const raw = useMemo(() => {
    if (now == null) return []
    // DEV: `?orb=all|tür,tür` sahneleri tek tek gösterir (src/dev/orbSamples); üretimde ölü kod.
    const dev = import.meta.env.DEV ? devOrbKinds() : null
    if (dev) return devOrbSamples(dev, now)
    const date = new Date(now)
    const list = events ?? []
    const free =
      events && date.getHours() < 16
        ? (freeWindows(list, date, now).find((w) => w.minutes >= 90) ?? null)
        : null
    const trip =
      upcomingTrips(list, now, 4).find((x) => {
        const days = Math.round((dayStart(x.start) - dayStart(date)) / DAY)
        return days >= 1 && days <= 3
      }) ?? null
    const holiday = canLeave
      ? upcomingHolidays(date).find((h) => h.inDays > 0 && h.inDays <= 21 && bridgeFor(h))
      : null
    // Ağır hafta: bu haftanın ve geçen haftanın toplantı süresi (ritim kartının hesabı).
    const week = events
      ? { minutes: weekStats(list, now, 0).minutes, last: weekStats(list, now, -1).minutes }
      : null
    return orbSuggestions({
      now,
      events: list,
      week,
      free,
      trip,
      bridge: holiday ? { holiday, ...bridgeFor(holiday) } : null,
      feed,
      install: promo.show,
    })
  }, [events, now, feed, canLeave, promo.show])

  const time = getDateTimeFormat(locale, OPTS_TIME)
  const feedItems = ctx?.feedFresh?.items
  const list = raw
    .filter((s) => !done.has(s.kind))
    .map((s) => ({
      ...s,
      ...(s.kind === "feed" && !s.items && feedItems ? { items: feedItems } : null),
      text: textOf(s),
      act: actOf(s),
    }))
  // Sahne kartlarının verisi (`orb/OrbScene`): okunmamış takvim ya da iş listesi null kalır.
  // Okunamayan görev listesi (hata) "0 görev" değil: sayı hiç gösterilmez.
  const tasksReady = !ctx?.focus?.loading && ctx?.focus?.status !== "error"
  const scene = useMemo(() => {
    const dev = import.meta.env.DEV && now != null && devOrbKinds() ? devOrbEvents(now) : null
    return {
      now,
      events: dev ?? events,
      tasks: dev ? [] : tasksReady ? (tasks ?? null) : null,
    }
  }, [now, events, tasks, tasksReady])

  function actOf(s) {
    if (s.kind === "install") return t(promo.ios ? "pwa.promo.how" : "pwa.promo.install")
    return t(`widgets.nudge.act.${s.kind}`)
  }

  function textOf(s) {
    switch (s.kind) {
      case "prepare":
      case "recap":
        return t(`widgets.nudge.text.${s.kind}`, {
          subject: s.event.subject || t("calendar.noSubject"),
        })
      case "feed":
        return t(`widgets.nudge.text.feed.${one(s.n)}`, { n: s.n })
      case "load": {
        const h = getNumberFormat(locale, ONE_DECIMAL).format(s.minutes / 60)
        return s.last > 0
          ? t("widgets.nudge.text.load", { h, p: Math.round((s.minutes / s.last - 1) * 100) })
          : t("widgets.nudge.text.loadFlat", { h })
      }
      case "focusFree":
        return t("widgets.nudge.text.focusFree", {
          time: `${time.format(s.window.start)}–${time.format(s.window.end)}`,
        })
      case "trip": {
        const n = Math.round((dayStart(s.trip.start) - dayStart(new Date(now))) / DAY)
        return t(`widgets.nudge.text.trip.${one(n)}`, { place: placeOf(s.trip), n })
      }
      case "install":
        return t(
          promo.ios || touch ? "widgets.nudge.text.installPhone" : "widgets.nudge.text.install",
        )
      case "bridge":
        return t("widgets.nudge.text.bridge", {
          day: getDateTimeFormat(locale, OPTS_DAY).format(s.bridge.bridge),
          n: s.bridge.total,
        })
      default:
        return t(`widgets.nudge.text.${s.kind}`)
    }
  }

  function placeOf(trip) {
    const name = trip.city ? cityName(trip.city, locale) : trip.location || trip.subject || ""
    return name.length > 28 ? `${name.slice(0, 27)}…` : name
  }

  function ask(question) {
    setPendingAsk({ question, agent: OFFICE })
    requestOpenChat({ focusComposer: true })
  }

  async function book(w) {
    const end = new Date(Math.min(w.end.getTime(), w.start.getTime() + MAX_BLOCK))
    const res = await createFocusBlock(instance, accounts[0], {
      start: w.start,
      end,
      subject: t("widgets.focusWindow.subject"),
    })
    if (res.status === STATUS.ready) {
      setDone((s) => new Set(s).add("focusFree"))
      notify.success(
        t("widgets.focusWindow.done", { time: `${time.format(w.start)}–${time.format(end)}` }),
      )
      ctx?.cal?.refresh?.()
    } else notify.error(t("widgets.focusWindow.failed"))
  }

  async function install() {
    if (promo.ios) setInstallGuide(true)
    else if ((await promptInstall()) === "dismissed") promo.dismiss()
  }

  function act(s) {
    switch (s.kind) {
      case "install":
        return install()
      case "prepare":
        return prepareMeeting(s.event, t, locale)
      case "recap":
        return openMeetingSummary(s.event)
      case "focusFree":
        return book(s.window)
      case "load":
        return ask(loadQuestion(events, now, t, locale))
      case "bridge":
        return navigate(`/self-service?new=leave&day=${localDayKey(s.bridge.bridge)}`)
      case "feed":
        return navigate("/feed")
      case "planDay":
      case "tomorrow": {
        const kind = s.kind === "planDay" ? "today" : "tomorrow"
        const agenda = planAgenda(kind, {
          events: events ?? [],
          tasks: tasks ?? [],
          now,
          calendarReady: Boolean(events),
          tasksReady: !ctx?.focus?.loading,
        })
        return ask(planQuestion(kind, agenda, t, locale))
      }
      case "trip":
        return ask(
          t("widgets.nudge.ask.trip", {
            place: placeOf(s.trip),
            date: getDateTimeFormat(locale, OPTS_DATE).format(s.trip.start),
          }),
        )
      default:
        return ask(t(`widgets.nudge.ask.${s.kind}`))
    }
  }

  return { list, act, promo, scene }
}
