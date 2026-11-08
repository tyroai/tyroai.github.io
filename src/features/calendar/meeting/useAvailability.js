import { useEffect, useMemo, useState } from "react"
import { useMsal } from "@azure/msal-react"
import {
  availabilityOf,
  minutesBetween,
  scheduleWindow,
  wallTime,
} from "@/features/calendar/lib/meeting"
import { fetchSchedules } from "@/features/calendar/lib/meetingApi"
import { isMsalConfigured } from "@/lib/msal"

const DEBOUNCE_MS = 400

/**
 * Katılımcıların müsaitliği: seçilen günden başlayan bir pencere için TEK `getSchedule` (kişi ve
 * gün değişince, kısa bir beklemeden sonra); saat değişince yeniden sorulmaz, durum aynı pencereden
 * hesaplanır. Sonuç yalnız bu pencerede (bellekte, kapanınca gider): başkasının takvim durumu
 * kişisel veri, ayrıca saklanmaz. Dönen `{ status, view }`: `status` idle · loading · ready · error;
 * `view` `availabilityOf` sonucu (yalnız ready'de).
 */
export function useAvailability(v, me) {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  // "Şimdi" pencere açılırken bir kez: öneri bundan öncesine düşmez.
  const [now] = useState(() => Date.now())
  const [state, setState] = useState({ key: "", res: null })
  const { date, people } = v
  const addresses = useMemo(
    () => [me, ...people.map((p) => p.address)].map((a) => a.toLowerCase()),
    [me, people],
  )
  const key = `${date}|${addresses.join(",")}`
  const active = isMsalConfigured && Boolean(account) && Boolean(me) && people.length > 0

  useEffect(() => {
    if (!active) return undefined
    let live = true
    const timer = setTimeout(async () => {
      const { from, to } = scheduleWindow(date)
      const res = await fetchSchedules(instance, account, {
        addresses: [...new Set(addresses)],
        from,
        to,
      })
      if (live) setState({ key, res: { ...res, from } })
    }, DEBOUNCE_MS)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [active, key, date, addresses, instance, account])

  const sched = state.key === key ? state.res : null
  const start = wallTime(v.date, v.from)?.getTime() ?? null
  const end = wallTime(v.date, v.to)?.getTime() ?? null
  const minutes = minutesBetween(v.from, v.to)
  const view = useMemo(() => {
    if (sched?.status !== "ready" || !start || !end || !minutes) return null
    return availabilityOf(sched, people, me, { start, end, minutes, now })
  }, [sched, people, me, start, end, minutes, now])

  if (!active) return { status: "idle", view: null }
  if (!sched) return { status: "loading", view: null }
  return { status: sched.status, view }
}
