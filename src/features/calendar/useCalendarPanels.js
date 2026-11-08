import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { dayKey } from "@/features/calendar/lib/range"
import { indexItems } from "@/features/calendar/lib/statsLists"
import {
  awaitingIn,
  countItems,
  holidaysIn,
  holidaysOfYear,
  leaveDaysIn,
  leaveStats,
  meetingStats,
  teamAway,
} from "@/features/calendar/lib/stats"
import { leaveFrom } from "@/lib/selfServiceTeam"
import { leaveRows, meetingRows } from "./statsRows"
import { statTips } from "./statsTips"
import { periodLabel } from "./titles"

/**
 * "Takvim özeti" panelinin satırları: Self Servis açıksa bakiye (kullanılabilir gün, bekleyen talep,
 * toplam hak) ve görünen DÖNEME göre sayılar (kendi iznim, ekipten izinde olanlar, toplantı, görev,
 * kutlama, tatil); kapalıysa yalnız dönem sayıları. Okunamayan kaynağın satırı yazılmaz. `items`:
 * takvimin bütün öğeleri (katman ve aramadan bağımsız), `period`: `periodOf`, `windowLoading`:
 * Outlook yeni pencereyi getiriyor (eldeki olaylar eski pencerenin: toplantı sayısı yazılmaz).
 * `loading`: ana kaynak hâlâ cevap bekliyor (iskelet). `lists`: satır kimliğine göre balon içeriği
 * (satırın saydığı kayıtlar, `statsTips`).
 */
export function useCalendarPanels({
  access,
  leave,
  status,
  events,
  items,
  period,
  today,
  windowLoading,
}) {
  const { t, locale } = useLocale()
  const { first, last } = period
  const own = leave?.status === "ready" ? leave.data : null
  const team = leave?.team
  const teamOk = status.teamLeave === "ok" || status.teamLeave === "partial"
  const teamPeople = team?.people
  const teamMembers = team?.leave?.members
  const taskOk = status.task === "ok" || status.task === "partial"
  const meetingOk = status.meeting === "ok" && !windowLoading

  const balance = useMemo(
    () => (own ? leaveStats({ leaves: own.leaves ?? [], balance: own.balance, now: today }) : null),
    [own, today],
  )
  const r = useMemo(() => {
    const firstKey = dayKey(first)
    const lastKey = dayKey(last)
    // Ekibin izinleri ERP'den `leaveFrom`dan bu yana okunur: daha eski dönemde "0 kişi" denmez.
    const covered = firstKey >= leaveFrom(today)
    return {
      label: periodLabel(period, today, locale, t),
      myLeave: own ? leaveDaysIn(own.leaves, first, last) : null,
      away:
        teamOk && teamPeople && covered
          ? teamAway({ people: teamPeople, members: teamMembers, first, last }).length
          : null,
      meetings: meetingOk ? meetingStats(events, first, last) : null,
      awaiting: meetingOk ? awaitingIn(events, first, last, today) : 0,
      tasks: taskOk ? countItems(items, "task", firstKey, lastKey, true) : null,
      celebrations:
        status.celebration === "ok" ? countItems(items, "celebration", firstKey, lastKey) : null,
      // Tatil tablosu (2026–2028) yılı kapsamıyorsa satır yazılmaz: bağlantının gideceği liste yok.
      holidays: holidaysOfYear(last.getFullYear()).length ? holidaysIn(first, last) : null,
    }
  }, [
    period,
    first,
    last,
    today,
    locale,
    t,
    own,
    teamOk,
    teamPeople,
    teamMembers,
    meetingOk,
    events,
    taskOk,
    items,
    status.celebration,
  ])
  const index = useMemo(() => indexItems(items), [items])
  const lists = useMemo(
    () =>
      statTips({
        t,
        locale,
        today,
        period,
        own,
        team: teamOk && teamPeople ? { people: teamPeople, members: teamMembers } : null,
        events,
        index,
      }),
    [t, locale, today, period, own, teamOk, teamPeople, teamMembers, events, index],
  )
  const mode = access.selfService ? "leave" : "meeting"
  const rows = useMemo(
    () =>
      mode === "leave"
        ? leaveRows({ t, locale, stats: balance, r })
        : meetingRows({ t, locale, r }),
    [mode, t, locale, balance, r],
  )
  const loading =
    mode === "leave" ? leave?.status === "loading" : status.meeting === "loading" || windowLoading
  return { rows, lists, mode, loading, leaves: own?.leaves ?? null }
}
