import { useEffect, useMemo, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { briefItems, dayPart, isWeekend, meetingsOn, newSince, nextWorkday } from "@/lib/brief"
import { pendingInvites } from "@/lib/calendarInvites"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { useTibotPeek } from "@/lib/tibot/tibotPeek"

const VISIT_KEY = "tyro-widgets-last-visit"
const OPTS_DAY = { weekday: "long" }

/** Önceki ziyaretin anı (bu tarayıcıda); okunduktan sonra şimdiyle değişir. */
function useLastVisit() {
  const [since] = useState(() => {
    try {
      const v = Number(localStorage.getItem(VISIT_KEY))
      return v > 0 ? new Date(v) : null
    } catch {
      return null
    }
  })
  useEffect(() => {
    try {
      localStorage.setItem(VISIT_KEY, String(Date.now()))
    } catch {
      /* gizli pencere: "son ziyaret" satırı çizilmez */
    }
  }, [])
  return since
}

export const plural = (t, key, n, params = {}) =>
  t(`${key}.${n === 1 ? "one" : "other"}`, { n, ...params })

/**
 * Günün brifinginin verisi — Günün brifingi ve Karşılama kartı ortak: öncelik
 * sırasıyla maddeler (`lib/brief`), bugün kalan ve bir sonraki iş gününün
 * toplantıları, ipuçlarının listeleri ve "son girişten beri yeni posta". Cümleler
 * (vurgulu toplantı ifadeleriyle) `useBriefLines`ta.
 */
export function useBrief(ctx) {
  const { cal, mail, focus, feedFresh, now, pageAccess } = ctx
  // Ticket sayıları (yalnız kitlede): listenin son okumasından; okunmadıysa bir kez okunur — kod
  // ayrı parçada iner (Anasayfa paketine girmez).
  const peek = useTibotPeek()
  const tibot = pageAccess.tibot ? peek : null
  useEffect(() => {
    if (!pageAccess.tibot) return
    import("@/lib/tibot/tibotApi").then((m) => m.loadTickets()).catch(() => {})
  }, [pageAccess.tibot])
  const { locale } = useLocale()
  const since = useLastVisit()
  const date = useMemo(() => new Date(now), [now])
  const weekend = isWeekend(date)
  const part = dayPart(date)
  const invites = useMemo(() => pendingInvites(cal.events, now), [cal.events, now])
  const left = useMemo(() => meetingsOn(cal.events, date, date), [cal.events, date])
  const nextDay = useMemo(() => nextWorkday(date), [date])
  const nextMeetings = useMemo(() => meetingsOn(cal.events, nextDay), [cal.events, nextDay])
  const tasks = focus.tasks ?? []
  const important = (mail.messages ?? []).filter((m) => !m.isRead && m.importance === "high").length
  const items = briefItems({
    invites: invites.length,
    unread: mail.unread ?? 0,
    important,
    overdue: tasks.filter((x) => !x.done && x.overdue).length,
    open: tasks.filter((x) => !x.done && !x.overdue).length,
    feed: pageAccess.feed ? (feedFresh.count ?? 0) : 0,
    tibot: tibot?.assigned ?? 0,
    tibotLate: tibot?.late ?? 0,
    tibotWaiting: tibot?.waiting ?? 0,
  })
  // Header rozetiyle aynı küme: bugün gelen ve okunmamış (Anasayfa özetinin ipucu da bu).
  const unreadMail = useMemo(() => {
    const start = new Date(now)
    start.setHours(0, 0, 0, 0)
    return (mail.messages ?? []).filter(
      (m) => !m.isRead && m.received && m.received.getTime() >= start.getTime(),
    )
  }, [mail.messages, now])
  const dayName = getDateTimeFormat(locale, OPTS_DAY).format(nextDay)

  return {
    date,
    weekend,
    part,
    items,
    nextMeetings,
    /** Bugünün bitmemiş toplantıları (sıralı). */
    left,
    dayName,
    doneToday: tasks.filter((x) => x.done).length,
    fresh: newSince(mail.messages, since),
    loading: cal.status === "loading" || mail.status === "loading" || focus.loading,
    tipData: {
      invites,
      unreadMail,
      tasks,
      feedItems: pageAccess.feed ? (feedFresh.items ?? []) : [],
      todoOpen: pageAccess.todo,
      todoSynced: focus.mode === "todo",
      tibot,
    },
  }
}
