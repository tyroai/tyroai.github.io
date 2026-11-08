import { useMemo } from "react"
import { useCalendarEvents } from "@/hooks/useCalendarEvents"
import { useMyManager } from "@/hooks/useMyManager"
import { useSelfServiceTeam } from "@/hooks/useSelfServiceTeam"
import { bridgeAround, upcomingBridges } from "@/lib/leaveBridges"
import {
  addDays,
  dayBreakdown,
  isCovered,
  nonWorkingEdgeHint,
  startOfDay,
  ymd,
} from "@/lib/leaveDays"
import {
  balanceImpact,
  meetingsInRange,
  ownLeaveDays,
  ownOverlap,
  pendingAnnual,
  pendingLeaves,
  teamLeaveDays,
  teamOverlap,
} from "@/lib/leaveImpact"
import { leaveWorkdays } from "@/lib/requestForm"

// Takvim katmanları için kendi ve ekibin izinlerinin penceresi: geçmiş üç ay, gelecek bir yıl.
const BACK = 90
const AHEAD = 400
const NO_DAYS = new Map()

/**
 * İzin formunun canlı etkisi (`ImpactCard` ve takvim okur): iş günü, bakiye (bekleyen yıllık
 * izinlerle), köprü, kendi izniyle çakışma, tatile denk gelen uç, ekip (yalnız Ekibim'i
 * görebilende — `teamEnabled`, türsüz; `teamDays` takvimin ekip katmanı), aralıktaki toplantılar
 * ve yönetici. Veri sayfanın (`leaves`, `balance`) ve var olan kancaların; bilinmeyen satır
 * `null`/boş döner, kart onu çizmez.
 */
export function useLeaveImpact({ values, leaves, balance, teamEnabled, today }) {
  const { kind, start, end } = values
  const annual = kind === "annual"
  const has = Boolean(start && end && end >= start)
  const sKey = start ? ymd(start) : ""
  const eKey = end ? ymd(end) : ""
  const tKey = ymd(today)

  const own = useMemo(
    () => ownLeaveDays(leaves, addDays(today, -BACK), addDays(today, AHEAD)),
    // `today` gün değişince yenilenir; nesne kimliği değil tarih.
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leaves, tKey],
  )
  const pending = useMemo(
    () => pendingAnnual(leaves, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leaves, tKey],
  )
  const waiting = useMemo(
    () => pendingLeaves(leaves, today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [leaves, tKey],
  )
  const bridges = useMemo(
    () => upcomingBridges(today),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [tKey],
  )

  const range = useMemo(() => {
    if (!has) return null
    const days = leaveWorkdays(start, end) ?? 0
    const breakdown = dayBreakdown(start, end)
    return {
      days,
      calendarDays: breakdown.length,
      breakdown,
      covered: isCovered(start, end),
      edge: nonWorkingEdgeHint(start, end),
      overlap: ownOverlap(leaves, start, end),
      bridge: annual ? bridgeAround(start, end, { blocked: (d) => own.has(ymd(d)) }) : null,
    }
    // Tarihler gün anahtarıyla izlenir: aynı gün yeni Date nesnesiyle hesap yinelenmesin.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [has, sKey, eKey, annual, leaves, own])

  const balanceInfo =
    annual && range
      ? balanceImpact({ remain: balance?.remain ?? null, days: range.days, pending: pending.days })
      : null

  // Toplantılar yalnız aralık seçiliyken istenir; düşerse satır çizilmez.
  const from = has ? startOfDay(start) : today
  const to = has ? addDays(startOfDay(end), 1) : today
  const cal = useCalendarEvents(from, to, has)
  const meetings = useMemo(
    () => (has && cal.status === "ready" ? meetingsInRange(cal.events, start, end) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [has, cal.status, cal.events, sKey, eKey],
  )
  // Ekip form açılınca istenir (takvim katmanı tarih seçilmeden de görünür); yalnız Ekibim'i
  // görebilene.
  const team = useSelfServiceTeam(Boolean(teamEnabled))
  const members = team.leave?.members
  const teamDays = useMemo(
    () =>
      teamEnabled && members
        ? teamLeaveDays(team.people, members, addDays(today, -BACK), addDays(today, AHEAD))
        : NO_DAYS,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teamEnabled, members, team.people, tKey],
  )
  const teamRows = useMemo(
    () => (teamEnabled && has && members ? teamOverlap(team.people, members, start, end) : []),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [teamEnabled, has, members, team.people, sKey, eKey],
  )
  const manager = useMyManager()

  return {
    annual,
    has,
    own,
    pending,
    waiting,
    bridges,
    range,
    balance: balanceInfo,
    meetings,
    team: teamRows,
    teamDays,
    manager,
  }
}
