import { addDays, parseYmd, startOfDay } from "@/lib/leaveDays"
import { leaveFrom, weekStart } from "@/lib/selfServiceTeam"

/**
 * Ekibim çizelgesinin dönemi (saf): Pazartesi'den başlayan `weeks` haftalık pencere, ileri ve
 * geri birer pencere boyu kayar. İzinler `leaveFrom(bugün)`den itibaren bütün gelecekle okunur
 * (`selfServiceTeamQuery`): ileri gitmek veriye bağlı değil, geri gitmek okunan ilk günde durur.
 */

/** Aralık seçenekleri: 6 hafta · 3 ay (13 hafta). */
export const TIMELINE_RANGES = { weeks6: 6, months3: 13 }

/**
 * `start`: gezinilen dönemin ilk günü (null = bu hafta). Dönüş: `first`…`last` (çizelge),
 * `from`…`to` (telefonun listesi: bugünü kapsayan dönemde bugünden `weeks` hafta — geçmiş günler
 * "yaklaşan" değil), `weeks`,
 * `current` (bugün bu dönemde mi), `home` (bu haftadan başlayan varsayılan dönem), `prev`/`next` (komşu dönemin ilk günü; okunan ilk günden
 * önceye geçilemez: `prev` null).
 */
export function timelineWindow(now = new Date(), { start = null, weeks = 6 } = {}) {
  const today = startOfDay(now)
  const floor = weekStart(parseYmd(leaveFrom(today)))
  const first = start ? weekStart(start < floor ? floor : start) : weekStart(today)
  const last = addDays(first, weeks * 7 - 1)
  const current = first <= today && today <= last
  const back = addDays(first, -weeks * 7)
  return {
    first,
    last,
    from: current ? today : first,
    to: current ? addDays(today, weeks * 7 - 1) : last,
    weeks,
    current,
    home: first.getTime() === weekStart(today).getTime(),
    prev: first > floor ? (back < floor ? floor : back) : null,
    next: addDays(first, weeks * 7),
  }
}
