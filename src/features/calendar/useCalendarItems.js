import { useMemo } from "react"
import { eventsRange, useCalendarEvents } from "@/hooks/useCalendarEvents"
import { useLocale } from "@/hooks/useLocale"
import { buildItems, visibleItems } from "@/features/calendar/lib/build"
import {
  layerDetails,
  layerStatus,
  peopleStatus,
  windowLoading,
} from "@/features/calendar/lib/status"
import { dayKey, fetchWindow } from "@/features/calendar/lib/range"
import { addDays } from "@/lib/leaveDays"
import { memberKey } from "@/lib/selfServiceTeamQuery"
import { useCalendarOccasions } from "./useCalendarOccasions"

const EMPTY = []

/** Ekip üyeleri ve türsüz izin kayıtları: `[{ person: { key, name, … }, leaves }]`. */
function teamLeaves(team) {
  if (team?.status !== "ready") return EMPTY
  return team.people.map((p) => ({
    person: { ...p, key: memberKey(p) },
    leaves: team.leave?.members?.[memberKey(p)]?.leaves ?? EMPTY,
  }))
}

/**
 * Takvimin bütün kaynakları tek yerde: Outlook (çapanın ayının ızgarası kadar, hafta gezerken
 * yeniden istek yok) ve paylaşılan takvimler (`people`: `useSharedPeople`, kararlı dizi; kişi başına
 * TEK istek, önbellekli), To-Do ve izinler (kapıya bağlı kaynaklar, `CalendarSources`), kutlamalar,
 * resmî tatiller. Dönen: `items` (ekranda görünecekler), `status` (katman başına), `people` (kişi
 * başına durum), `loading`, `refresh`, `events` (YALNIZ kendi etkinliklerim: özet sayıları ve
 * aday kişiler başkasınınkini saymaz). `tasks`/`leave` `null` ise o katman yok.
 */
export function useCalendarItems({
  anchor,
  today,
  firstDay,
  range,
  layers,
  hidePending = false,
  query,
  tasks,
  leave,
  people = EMPTY,
}) {
  const { t } = useLocale()
  const y = anchor.getFullYear()
  const m = anchor.getMonth()
  const win = useMemo(
    () => fetchWindow(new Date(y, m, 1), today, firstDay),
    [y, m, today, firstDay],
  )
  const cal = useCalendarEvents(win.start, win.end, true, people)
  // Pencere değişince eldeki olaylar ESKİ pencerenindir ve kanca yine "ready" der: yenisi gelene kadar.
  const loading = windowLoading(cal, eventsRange(win.start, win.end))

  const todayKey = dayKey(today)
  const firstMs = win.start.getTime()
  const lastMs = addDays(win.end, -1).getTime()
  const occasions = useCalendarOccasions({ firstMs, lastMs, today })
  const team = leave?.team
  const members = useMemo(() => teamLeaves(team), [team])
  const taskList = tasks?.tasks
  const leaves = leave?.data?.leaves

  const all = useMemo(
    () =>
      buildItems(
        {
          events: cal.events,
          people,
          tasks: taskList,
          leaves,
          team: members,
          occasions: occasions.entries,
          holidays: { first: dayKey(new Date(firstMs)), last: dayKey(new Date(lastMs)) },
        },
        { t, todayKey },
      ),
    [
      cal.events,
      people,
      taskList,
      leaves,
      members,
      occasions.entries,
      firstMs,
      lastMs,
      t,
      todayKey,
    ],
  )

  const firstKey = dayKey(range.start)
  const lastKey = dayKey(addDays(range.end, -1))
  const items = useMemo(
    () => visibleItems(all, { layers, firstKey, lastKey, query, hidePending }),
    [all, layers, firstKey, lastKey, query, hidePending],
  )
  const status = layerStatus({ cal, board: tasks, leave, occasions: occasions.status })
  const details = layerDetails({ cal, board: tasks, leave })
  const mine = useMemo(() => cal.events.filter((e) => !e.owner), [cal.events])
  const shared = useMemo(() => peopleStatus(people, cal, loading), [people, cal, loading])
  return {
    items,
    all,
    status,
    details,
    loading,
    refresh: cal.refresh,
    events: mine,
    people: shared,
  }
}
