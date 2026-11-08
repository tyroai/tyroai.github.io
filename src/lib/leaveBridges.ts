import { TR_HOLIDAYS } from "@/lib/holidays"
import type { Holiday, HolidayKey } from "@/lib/holidays"
import type { HolidayIndex } from "@/lib/leaveDays"
import {
  HOLIDAY_INDEX,
  addDays,
  dayDiff,
  dayInfo,
  startOfDay,
  upcomingHolidays,
  ymd,
} from "@/lib/leaveDays"

/**
 * Köprü günleri (saf), TEK kural (`bridgeAround`, çalışma günü takviminin ağırlığıyla): seçilen
 * aralığın yanındaki öneri, tatil kartlarının köprüsü (`bridgeFor`) ve boş formun "Köprü
 * fırsatları" (`upcomingBridges`) aynı yoldan. Kişinin kendi izinleri bloğa katılmaz.
 */

/** Üst üste tatil bloğu: ilk ve son gün, takvim günü sayısı. */
export interface Block {
  start: Date
  end: Date
  days: number
}

/** Köprü önerisi: alınacak gün, bloğun hangi yanında, iş günü bedeli (1 ya da ½) ve kazanç. */
export interface Bridge {
  day: Date
  side: "start" | "end"
  /** O gün alınınca üst üste tatil. */
  block: Block
  cost: number
  /** Kazandırdığı takvim günü. */
  gain: number
}

/** Boş formun köprü fırsatı (`upcomingBridges`). */
export interface UpcomingBridge {
  holiday: HolidayKey
  day: Date
  cost: number
  block: Block
}

// Bir yönde en çok bu kadar gün yürünür (en uzun bayram + iki hafta sonu rahat sığar).
const WALK = 31
/** Önerinin eşiği: en az bu kadar takvim günü kazandırmalı. */
export const BRIDGE_GAIN = 3

const off = (d: Date, index: HolidayIndex) => dayInfo(d, index).weight === 0

/** Blokta resmî tatil var mı: yalnız hafta sonuna uzanan her gün "köprü" sayılmasın. */
function hasHoliday(block: Block, index: HolidayIndex): boolean {
  for (let i = 0; i < block.days; i++)
    if (dayInfo(addDays(block.start, i), index).kind === "holiday") return true
  return false
}

/** Aralığı iki yanındaki hafta sonları ve bayramlarla büyütür: üst üste tatil bloğu. */
export function blockAround(start: Date, end: Date, index: HolidayIndex = HOLIDAY_INDEX): Block {
  let s = startOfDay(start)
  let e = startOfDay(end)
  for (let i = 0; i < WALK && off(addDays(s, -1), index); i++) s = addDays(s, -1)
  for (let i = 0; i < WALK && off(addDays(e, 1), index); i++) e = addDays(e, 1)
  return { start: s, end: e, days: dayDiff(s, e) + 1 }
}

/**
 * Seçimin köprü önerisi. Önce seçim bitişik hafta sonu ve bayramlarla büyür (`block`); bloğu
 * başka bir tatil dizisinden TEK iş günü (ya da arife) ayırıyorsa o gün önerilir — yalnız en az
 * `BRIDGE_GAIN` takvim günü kazandırıyor, en çok 1 iş günü tutuyor ve işin içinde resmî tatil
 * varsa (sıradan hafta ortası izne "pazartesiyi de ekle" denmez). İki yanda da varsa çok
 * kazandıran, eşitse ucuz olan (arife), o da eşitse sonraki gün. `blocked(gün)`: önerilemeyecek
 * gün (kişinin kendi izni). Dönüş `{ block, bridge }`; eksik ya da ters aralıkta null.
 */
export function bridgeAround(
  start: Date | null | undefined,
  end: Date | null | undefined,
  {
    index = HOLIDAY_INDEX,
    blocked = null,
  }: { index?: HolidayIndex; blocked?: ((day: Date) => boolean) | null } = {},
): { block: Block; bridge: Bridge | null } | null {
  if (!start || !end || end < start) return null
  const block = blockAround(start, end, index)
  const options: Omit<Bridge, "cost" | "gain">[] = []
  const after = addDays(block.end, 1)
  if (off(addDays(after, 1), index))
    options.push({ day: after, side: "end", block: blockAround(block.start, after, index) })
  const before = addDays(block.start, -1)
  if (off(addDays(before, -1), index))
    options.push({ day: before, side: "start", block: blockAround(before, block.end, index) })
  const bridge =
    options
      .map((o) => ({ ...o, cost: dayInfo(o.day, index).weight, gain: o.block.days - block.days }))
      .filter(
        (o) =>
          o.cost > 0 &&
          o.cost <= 1 &&
          o.gain >= BRIDGE_GAIN &&
          !blocked?.(o.day) &&
          hasHoliday(o.block, index),
      )
      .sort((a, b) => b.gain - a.gain || a.cost - b.cost || (a.side === "end" ? -1 : 1))[0] ?? null
  return { block, bridge }
}

/**
 * Tatil kartının köprüsü (Sıradaki tatil, Takvim, Anlat, orb): tatilin kendisi için
 * `bridgeAround` — izin formuyla aynı kural ve aynı gün. `holiday`: `{ from, to }` (yerel gün).
 * Dönüş `{ bridge: Date, total }` (`total`: o gün alınınca üst üste tatil) ya da null.
 */
export function bridgeFor(
  holiday: { from: Date; to: Date },
  index: HolidayIndex = HOLIDAY_INDEX,
): { bridge: Date; total: number } | null {
  const hit = bridgeAround(holiday.from, holiday.to, { index })?.bridge
  return hit ? { bridge: hit.day, total: hit.block.days } : null
}

/**
 * Boş formun "Köprü fırsatları": önümüzdeki `months` ay içindeki bayramların köprü günleri, en
 * çok `max` tane, tarih sırasıyla. `cost` 1 ya da ½ (arife), `block` o gün alınınca üst üste tatil.
 */
export function upcomingBridges(
  today: Date | number,
  {
    months = 6,
    max = 3,
    index = HOLIDAY_INDEX,
    list = TR_HOLIDAYS,
  }: { months?: number; max?: number; index?: HolidayIndex; list?: readonly Holiday[] } = {},
): UpcomingBridge[] {
  const base = startOfDay(today)
  const limit = new Date(base.getFullYear(), base.getMonth() + months, base.getDate())
  const out: UpcomingBridge[] = []
  const seen = new Set<string>()
  for (const h of upcomingHolidays(base, list)) {
    if (h.from > limit || out.length >= max) continue
    const hit = bridgeFor(h, index)
    if (!hit) continue
    const day = hit.bridge
    const cost = dayInfo(day, index).weight
    if (day < base || cost <= 0 || seen.has(ymd(day))) continue
    seen.add(ymd(day))
    out.push({ holiday: h.key, day, cost, block: blockAround(day, day, index) })
  }
  return out
}
