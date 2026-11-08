import { fold } from "@/lib/fold"
import {
  fromEvent,
  fromLeave,
  fromOccasion,
  fromTask,
  fromTeamLeaves,
  holidayItems,
  matchesQuery,
  overlapsKeys,
} from "./items"
import { shortNames } from "@/lib/calendar/people"

/**
 * Bütün kaynaklardan TEK öğe listesi (saf, testli). Kaynak `undefined`/`null` ise (kapalı katman,
 * okunamadı) o katman boş kalır; hata ya da boşluk ayrımı ekranın işi (katman çipi). Aynı kimlikli
 * öğe bir kez: ekip ve departman aynı kişinin aynı gününü iki yoldan getirebilir. `events` kendi
 * etkinliklerimi ve (başkasına ait, `owner` dolu) paylaşılan takvimlerinkini birlikte taşıyabilir.
 *
 * `src`: `{ events, people, tasks, leaves, team: [{ person, leaves }], occasions, holidays: { first,
 * last } }` (tümü isteğe bağlı; `people` paylaşılan takvimin kişileri, kısa adları ayırmak için);
 * `ctx`: `{ t, todayKey }`.
 */
export function buildItems(src, ctx) {
  const out = new Map()
  const add = (item) => item && !out.has(item.id) && out.set(item.id, item)
  const events = src.events ?? []
  const withNames = { ...ctx, names: shortNames(src.people) }
  // Kendi toplantılarım önce; sonra paylaşılan takvimlerinki. Aynı toplantı (iCalUId + başlangıç)
  // benim takvimimde de görünüyorsa kişinin kopyası ayrıca çizilmez; benim kopyam reddedilmişse
  // (görünmüyorsa) kişinin kopyası kalır: o saatte meşgul olduğu bilgisi kaybolmasın.
  const shown = new Set()
  for (const e of events) {
    if (e.owner) continue
    const item = fromEvent(e, ctx)
    if (item && e.uid) shown.add(`${e.uid}|${e.start.getTime()}`)
    add(item)
  }
  for (const e of events) {
    if (e.owner && !shown.has(`${e.uid}|${e.start?.getTime()}`)) add(fromEvent(e, withNames))
  }
  for (const task of src.tasks ?? []) add(fromTask(task, ctx))
  for (const leave of src.leaves ?? []) add(fromLeave(leave, ctx))
  for (const m of src.team ?? []) for (const i of fromTeamLeaves(m.person, m.leaves, ctx)) add(i)
  for (const o of src.occasions ?? []) add(fromOccasion(o, ctx))
  if (src.holidays) for (const i of holidayItems(src.holidays.first, src.holidays.last, ctx)) add(i)
  return [...out.values()]
}

/**
 * Ekranda görünecekler: katmanı açık, görünen günlerle kesişen, aramaya uyan. Arama başlık, konum
 * ve kişi adlarında; eşleşmeyenler soluk değil GİZLİ. Paylaşılan takvimin kaydı türünün değil
 * kişinin katmanına bağlı (`layer`: "p:<adres>").
 */
export function visibleItems(
  items,
  { layers, firstKey, lastKey, query = "", hidePending = false },
) {
  const q = fold(query)
  return items.filter(
    (i) =>
      layers[i.layer ?? i.kind] !== false &&
      !(hidePending && i.state === "pending") &&
      overlapsKeys(i, firstKey, lastKey) &&
      matchesQuery(i, q),
  )
}
