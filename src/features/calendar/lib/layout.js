import { addDays } from "@/lib/leaveDays"
import { holidayBlocks, isHolidayItem } from "./holidayBlocks"
import { dayKey, keyToDay, minuteOf } from "./range"

/**
 * Takvim ızgarasının yerleşimi (saf, testli): günün tüm-gün ve saatli öğeleri, çakışan
 * toplantıların yan yana şeritleri, çok günlü çiplerin hafta satırındaki yeri.
 */

/** Blok en az bu kadar yüksek görünür (dakika): 5 dakikalık toplantı çizgiye dönmesin. */
export const MIN_MINUTES = 15
const DAY_MINUTES = 1440

/**
 * Günü kapsayan öğeler: tüm gün olanlar ve saatli olanlar ayrı. Resmî tatil tüm gün DEĞİL, o günün
 * saatli kopyası olarak saatlilere girer (`holidayBlocks`): hafta, gün ve ajanda görünümü böyle çizer.
 * Tatil başta: ajandada aynı saatteki toplantıdan önce gelir (günün başlığı gibi).
 */
export function splitDay(items, key) {
  const hit = items.filter((i) => i.firstKey <= key && i.lastKey >= key)
  return {
    allDay: hit.filter((i) => i.allDay && !isHolidayItem(i)),
    timed: [...holidayBlocks(hit, key), ...hit.filter((i) => !i.allDay)],
  }
}

/**
 * Saatli öğenin günün içindeki dakika aralığı. Gün sınırları TAKVİM GÜNÜYLE (`addDays`), saat
 * duvar saatinden (`minuteOf`): yaz saati geçişi olan günde "+24 saat" ertesi günü kaydırırdı.
 * Önceki günden gelen 0'dan, ertesi güne uzanan 1440'ta biter; en az `minMinutes` (ızgara dar
 * ölçekteyse okunur bir satır yüksekliğine denk gelen süre, `WeekGrid`).
 */
export function clipToDay(item, key, minMinutes = MIN_MINUTES) {
  const day = keyToDay(key)
  const next = addDays(day, 1)
  const from = item.start < day ? 0 : minuteOf(item.start)
  const to = item.end >= next ? DAY_MINUTES : minuteOf(item.end)
  const start = Math.min(from, DAY_MINUTES - minMinutes)
  return { from: start, to: Math.min(DAY_MINUTES, Math.max(to, start + minMinutes)) }
}

/**
 * Çakışan blokların şeritleri. Birbirine değen bloklar bir KÜME; küme içinde her blok ilk boş
 * şeride oturur, küme şerit sayısını paylaşır (`lanes`). Sağında boş şerit olan blok onlara
 * uzanır (`span`) — tek başına kalan geniş, çakışan dar.
 * Dönüş: `[{ item, from, to, lane, lanes, span }]` (başlangıca göre).
 * `maxLanes`: dar sütunda yan yana en çok bu kadar blok; ötesi gizlenir ve kümenin sonuna tek
 * `{ more, items, from, to, lane, lanes, span }` satırı ("+n" düğmesi, gizlenenlerin listesi) eklenir.
 */
export function packLanes(items, key, maxLanes = Infinity, minMinutes = MIN_MINUTES) {
  const rows = items
    .map((item) => ({ item, ...clipToDay(item, key, minMinutes) }))
    .sort((a, b) => a.from - b.from || b.to - a.to || a.item.id.localeCompare(b.item.id))
  const out = []
  let cluster = []
  let reach = -1
  const flush = () => {
    const ends = []
    for (const r of cluster) {
      let lane = ends.findIndex((end) => end <= r.from)
      if (lane < 0) lane = ends.length
      ends[lane] = r.to
      r.lane = lane
    }
    const shown = Math.min(ends.length, maxLanes)
    const hidden = cluster.filter((r) => r.lane >= shown)
    for (const r of cluster) {
      if (r.lane >= shown) continue
      let span = 1
      const free = (l) => !cluster.some((o) => o.lane === l && o.from < r.to && o.to > r.from)
      while (r.lane + span < shown && free(r.lane + span)) span += 1
      out.push({ ...r, lanes: shown, span })
    }
    if (hidden.length) {
      out.push({
        more: hidden.length,
        items: hidden.map((r) => r.item),
        from: Math.min(...hidden.map((r) => r.from)),
        to: Math.max(...hidden.map((r) => r.to)),
        lane: shown - 1,
        lanes: shown,
        span: 1,
      })
    }
    cluster = []
    reach = -1
  }
  for (const r of rows) {
    if (cluster.length && r.from >= reach) flush()
    cluster.push(r)
    reach = Math.max(reach, r.to)
  }
  flush()
  return out
}

/**
 * Bir satırın (hafta ya da gün sütunları) şeritleri: çok günlü öğe günler boyunca TEK parça uzanır.
 * `days`: satırın günleri; `items`: satırla kesişenler seçilir. Her çip `{ item, col, span, lane,
 * before, after }` — `before`/`after` satır dışına taşıyor (uç yuvarlatılmaz). Tüm gün öğeler
 * saatlilerden önce yerleşir; `maxLanes`'ten sonrası gizlenir ve `more[col]` o gün kaç çipin
 * gizlendiğini sayar.
 */
export function placeSpans(items, days, maxLanes = Infinity) {
  const keys = days.map(dayKey)
  const first = keys[0]
  const last = keys.at(-1)
  const spans = items
    .filter((i) => i.firstKey <= last && i.lastKey >= first)
    .map((item) => {
      const col = Math.max(
        0,
        keys.findIndex((k) => k >= item.firstKey),
      )
      const end = keys.findLastIndex((k) => k <= item.lastKey)
      return {
        item,
        col,
        span: end - col + 1,
        before: item.firstKey < first,
        after: item.lastKey > last,
      }
    })
    .sort(
      (a, b) =>
        Number(!a.item.allDay) - Number(!b.item.allDay) ||
        // Kendi öğelerim şeritlerde önce: yer dar kalınca "+n"e paylaşılanlar düşer.
        Number(Boolean(a.item.layer)) - Number(Boolean(b.item.layer)) ||
        a.col - b.col ||
        b.span - a.span ||
        a.item.start - b.item.start ||
        a.item.id.localeCompare(b.item.id),
    )
  const taken = []
  const more = keys.map(() => 0)
  const chips = []
  for (const s of spans) {
    let lane = 0
    const fits = (l) => {
      taken[l] ??= []
      return !taken[l].slice(s.col, s.col + s.span).some(Boolean)
    }
    while (!fits(lane)) lane += 1
    for (let c = s.col; c < s.col + s.span; c++) taken[lane][c] = true
    if (lane < maxLanes) chips.push({ ...s, lane })
    else for (let c = s.col; c < s.col + s.span; c++) more[c] += 1
  }
  return { chips, more, lanes: Math.min(taken.length, maxLanes) }
}

/** Görünen günlerde en az bir öğesi olanlar: telefonun hafta şeridindeki noktalar. */
export function markedDays(items, days) {
  const out = new Set()
  for (const d of days) {
    const k = dayKey(d)
    if (items.some((i) => i.firstKey <= k && i.lastKey >= k)) out.add(k)
  }
  return out
}

/**
 * Saat ızgarasının parçaları: şeritlere dizilen saatli öğeler (`rows`) ve resmî tatil zeminleri
 * (`bands`). Tatil şeride girmez: aynı güne düşen toplantıyı daraltmasın; günün tam genişliğinde,
 * toplantıların ARKASINDA çizilir ve boş yerine basış sütuna geçer (Yeni menüsü).
 */
export function hourParts(items, key, maxLanes = Infinity, minMinutes = MIN_MINUTES) {
  const { timed } = splitDay(items, key)
  return {
    rows: packLanes(
      timed.filter((i) => !isHolidayItem(i)),
      key,
      maxLanes,
      minMinutes,
    ),
    bands: timed
      .filter(isHolidayItem)
      .map((item) => ({ item, ...clipToDay(item, key), lane: 0, lanes: 1, span: 1 })),
  }
}
