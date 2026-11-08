import { setClock, WORK_HOURS } from "@/lib/workHours"
import { keyToDay } from "./range"

/**
 * Resmî tatilin saat ızgarasındaki hâli (saf, testli). Veri öğesi (`holidayItems`: tüm gün, günler
 * boyunca TEK parça) olduğu gibi kalır: ay görünümü, özet sayıları ve arama ona bağlı. Hafta, gün
 * ve ajanda görünümü onu "Tüm gün" satırından çıkarıp her güne ayrı TÜREV bir saatli kopya çizer:
 * tatil günü mesai kadar (08:00–17:30), arife yarım gün (13:00–17:30). Hafta sonuna düşen bayram
 * günü de blok alır: tatil haftadan kaybolmasın. Kopya `origin`de asıl öğeyi taşır, ayrıntı
 * onunla açılır.
 */

export const isHolidayItem = (item) => item.kind === "holiday"

/** "Tüm gün" satırının öğeleri: tüm gün olanlar, resmî tatil hariç (o saat ızgarasında). */
export const allDayRowItems = (items) => items.filter((i) => i.allDay && !isHolidayItem(i))

/** Tıklanınca ayrıntısı açılacak öğe: türev blokta asıl tatil öğesi, ötekinde kendisi. */
export const openTarget = (item) => item.origin ?? item

const at = (key, hour) => setClock(keyToDay(key), hour)

/**
 * Tatil (ya da arife) öğesinin `key` gününe düşen saatli kopyası. Kopya her gün için ayrı kimlikli
 * (`<öğe>@<gün>`), bir günlüktür; arifede ek ("Arife") blokta üçüncü satır (`sub`) olur.
 */
export function holidayBlock(item, key) {
  const eve = Boolean(item.source?.eve)
  return {
    ...item,
    id: `${item.id}@${key}`,
    allDay: false,
    start: at(key, eve ? WORK_HOURS.eveFrom : WORK_HOURS.from),
    end: at(key, WORK_HOURS.to),
    firstKey: key,
    lastKey: key,
    sub: item.tail,
    origin: item,
  }
}

/**
 * Günü kapsayan tatillerin saatli kopyaları. Arife bayramın kendi gününe denk gelirse bayram
 * kazanır (`holidayIndex` ile aynı kural): aynı güne iki blok yan yana çizilmez.
 */
export function holidayBlocks(items, key) {
  const hit = items.filter((i) => isHolidayItem(i) && i.firstKey <= key && i.lastKey >= key)
  const full = hit.some((i) => !i.source?.eve)
  return hit.filter((i) => !(full && i.source?.eve)).map((i) => holidayBlock(i, key))
}
