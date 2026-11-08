import { pendingLeaves } from "@/lib/leaveImpact"
import { overlapsKeys } from "./items"
import { dayKey } from "./range"
import { awaitingOf, holidaysOf, itemsIn, leavesIn, meetingsOf, teamAway } from "./stats"

/**
 * "Takvim özeti" satırlarının BALON listeleri (saf, testli): "3 toplantı" satırının balonu o üç
 * toplantıyı gösterir. Süzgeçler `stats.js`teki sayım işlevleriyle AYNI işlevler: liste satırın
 * sayısından ayrışamaz. Her kayıt takvimdeki öğesine (`item`) bağlanır, balondaki satıra basınca
 * ayrıntı o öğeyle açılır. Öğesi bulunamayan kayıtta `item` null kalır: satır tıklanamaz, uydurma yok.
 */

/**
 * Öğeleri üç yoldan indeksler: kaynak nesneye göre (etkinlik ve izin kaydı: `fromEvent` ile
 * `fromLeave` kaynağı öğeye koyar), kimliğe göre (tatil) ve kişiye göre (ekip izni: kaynağı her
 * seferinde yeni nesne, kişi anahtarı tek ortak nokta).
 */
export function indexItems(items) {
  const all = items ?? []
  const bySource = new Map()
  const byId = new Map()
  const teamLeave = new Map()
  for (const item of all) {
    byId.set(item.id, item)
    if (item.source && !bySource.has(item.source)) bySource.set(item.source, item)
    if (item.kind === "teamLeave") {
      const key = item.source.person.key
      teamLeave.set(key, [...(teamLeave.get(key) ?? []), item])
    }
  }
  return { items: all, bySource, byId, teamLeave }
}

const byDay = (a, b) => a.firstKey.localeCompare(b.firstKey) || a.title.localeCompare(b.title)

/**
 * Ekip satırının (kişi) takvim öğeleri: o kişinin dönemle kesişen, onaydaki olmayan ekip izinleri,
 * başlangıca göre. Eşleşme kişi anahtarından (`memberKey`: satırı da öğeleri de kuran kod aynı).
 */
const teamItems = (index, row, firstKey, lastKey) =>
  (index.teamLeave.get(row.key) ?? [])
    .filter((i) => i.state !== "pending" && overlapsKeys(i, firstKey, lastKey))
    .sort((a, b) => a.start - b.start)

/**
 * Dönem satırlarının kayıtları: `{ pending, myLeave, team, meetings, awaiting, tasks, celebrations,
 * holidays }`, her biri `[{ item, …kayıt }]` (`team`te kişinin bütün izin öğeleri `items`, ayrıntı
 * açılan ilki `item`). `pending` dönemden bağımsız (bakiye satırı); öteki satırlar `first`–`last`
 * uçlar DAHİL, yerel gece yarısı. `team`: `{ people, members }` ya da null.
 */
export function selectLists({ index, leaves, team, events, first, last, today }) {
  const firstKey = dayKey(first)
  const lastKey = dayKey(last)
  const of = (source) => index.bySource.get(source) ?? null
  return {
    pending: pendingLeaves(leaves, today).map((record) => ({ record, item: of(record) })),
    myLeave: leavesIn(leaves, first, last).map(({ record, days }) => ({
      record,
      days,
      item: of(record),
    })),
    team: teamAway({ people: team?.people, members: team?.members, first, last }).map((row) => {
      const items = teamItems(index, row, firstKey, lastKey)
      return { row, items, item: items[0] ?? null }
    }),
    meetings: meetingsOf(events, first, last).map((event) => ({ event, item: of(event) })),
    awaiting: awaitingOf(events, first, last, today).map((event) => ({ event, item: of(event) })),
    tasks: itemsIn(index.items, "task", firstKey, lastKey, true)
      .sort(byDay)
      .map((item) => ({ item })),
    celebrations: itemsIn(index.items, "celebration", firstKey, lastKey)
      .sort(byDay)
      .map((item) => ({ item })),
    holidays: holidaysOf(first, last).map((holiday) => ({
      holiday,
      item: index.byId.get(`holiday:${holiday.key}:${holiday.start}`) ?? null,
    })),
  }
}
