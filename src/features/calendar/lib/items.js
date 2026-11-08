import { TR_HOLIDAYS } from "@/lib/holidays"
import { fold } from "@/lib/fold"
import { addDays } from "@/lib/leaveDays"
import { isAbsence, leaveTypeName } from "@/lib/selfServiceNames"
import { isLive, statusText } from "@/lib/selfServiceStatus"
import { personHue } from "@/lib/personTone"
import { neutralLeaves } from "@/lib/selfServiceTeamPrivacy"
import { isTripEvent } from "@/lib/travel"
import { firstName } from "@/lib/calendar/attendees"
import { personLayer } from "@/lib/calendar/people"
import { dayKey, keyToDay } from "./range"

/**
 * Kaynak kayıtları → TEK takvim öğesi biçimi (saf, testli). Sayfa her kaynağı ayrı bir kancadan
 * okur; burada yalnız biçim birleşir. Metinler `ctx.t` ile ÇÖZÜLMÜŞ gelir (öğe ekrana hazır);
 * `ctx.todayKey` bugünün anahtarı.
 *
 * Öğe: `{ id, kind, title, tail, sub, allDay, start, end, firstKey, lastKey, state, icon, where,
 * people, hay, source }`. `firstKey`/`lastKey` kapsadığı günler (uçlar DAHİL, "YYYY-MM-DD").
 * Tüm gün öğede `start` yerel gece yarısı, `end` son günün ertesi gece yarısı (Graph'ın dışlayıcı
 * bitişi; izin ve görev de aynı biçimde). Saatli öğede gerçek an. `tail` başlığın yanında
 * kırpılmayan ek ("· İzinde"), `sub` blokta üçüncü satır.
 * `state`: "pending" (kesik kenarlık) · "tentative" · "done" · "overdue" · null.
 * Paylaşılan takvimin kaydı (`kind: "shared"`) ayrıca `layer` ("p:<adres>": kişinin açma-kapama
 * anahtarı), `hue` (kişinin rengi) ve `what` (kişi adı olmadan başlık) taşır.
 */

export const KINDS = [
  "meeting",
  "focus",
  "task",
  "myLeave",
  "teamLeave",
  "celebration",
  "holiday",
  "trip",
]

// Odak bloğunun konusu (`widgets.focusWindow.subject`, dört dil): bloğu yazanın dilinde durur,
// o yüzden liste dil seçiminden bağımsız. Kategori yazılmıyor, konu tek ipucu.
const FOCUS_SUBJECTS = new Set(["odak zamanı", "focus time", "время для фокуса", "وقت التركيز"])

/** Toplantı değil odak bloğu: bu konulardan biri, davetlisiz, saatli. */
export function isFocusEvent(e) {
  if (e.isAllDay || (e.attendees?.length ?? 0) > 0) return false
  return FOCUS_SUBJECTS.has(
    String(e.subject ?? "")
      .trim()
      .toLocaleLowerCase("tr"),
  )
}

/** Tüm gün aralığı: bitiş DIŞLAYICI (bir günlük etkinlik ertesi 00:00'da biter). */
export function allDaySpan(start, end) {
  const last = end > start ? new Date(end.getTime() - 1) : start
  return { firstKey: dayKey(start), lastKey: dayKey(last) }
}

/** Saatli aralık: tam gece yarısında biten etkinlik ertesi günü kapsamaz. */
export const timedSpan = allDaySpan

/** Eksik alanları doldurur, arama metnini (`hay`, katlanmış) bir kez üretir. */
const make = (item) => ({
  tail: null,
  sub: null,
  state: null,
  icon: null,
  where: "",
  people: [],
  ...item,
  hay: fold([item.title, item.tail, item.where, ...(item.people ?? [])].filter(Boolean).join(" ")),
})

const dayItem = (id, kind, title, firstKey, lastKey, extra) =>
  make({
    id,
    kind,
    title,
    allDay: true,
    start: keyToDay(firstKey),
    end: addDays(keyToDay(lastKey), 1),
    firstKey,
    lastKey,
    ...extra,
  })

/**
 * Paylaşılan takvimdeki başkasının etkinliği: kişinin renginde, "Ayşe · Konu" (`ctx.names`: kısa ad
 * tablosu, aynı ilk adlı iki kişiyi ayırır). Özel kayıt yalnız "Özel", konusu hiç gelmeyen kayıt
 * "Meşgul": konu, konum ve katılımcı çizilmez, kaynakta da temizlenir.
 */
export function fromShared(e, ctx) {
  if (e.myResponse === "declined" || !e.start || !e.end) return null
  const who = String(e.owner.address ?? "").toLowerCase()
  const priv = e.sensitivity === "private"
  const hidden = priv || !e.subject
  // Özel kayıt "Özel"; konusu hiç gelmeyen (ayrıntısız paylaşım) "Meşgul": yalnız meşgul bloğu.
  const what = priv ? ctx.t("widgets.shared.private") : e.subject || ctx.t("calendar.presence.busy")
  return make({
    id: `shared:${who}:${e.id}`,
    kind: "shared",
    layer: personLayer(who),
    hue: personHue(e.owner.name ?? ""),
    title: `${ctx.names?.get(who) ?? firstName(e.owner)} · ${what}`,
    what,
    allDay: Boolean(e.isAllDay),
    start: e.start,
    end: e.end,
    ...(e.isAllDay ? allDaySpan(e.start, e.end) : timedSpan(e.start, e.end)),
    state: e.myResponse === "tentativelyAccepted" ? "tentative" : null,
    where: hidden ? "" : (e.location ?? ""),
    people: [e.owner.name],
    source: hidden ? { ...e, subject: "", location: "", attendees: [], bodyPreview: "" } : e,
  })
}

/** Outlook etkinliği → toplantı · odak bloğu · seyahat; reddedilen yok. Başkasının takvimindeyse `fromShared`. */
export function fromEvent(e, ctx) {
  if (e.owner) return fromShared(e, ctx)
  if (e.myResponse === "declined" || !e.start || !e.end) return null
  const trip = isTripEvent(e)
  const kind = trip ? "trip" : isFocusEvent(e) ? "focus" : "meeting"
  const unanswered = e.myResponse === "notResponded"
  const tentative = e.myResponse === "tentativelyAccepted"
  return make({
    id: `${kind}:${e.id}`,
    kind,
    title: e.subject || ctx.t("calendar.noSubject"),
    allDay: Boolean(e.isAllDay),
    start: e.start,
    end: e.end,
    ...(e.isAllDay ? allDaySpan(e.start, e.end) : timedSpan(e.start, e.end)),
    state: unanswered ? "pending" : tentative ? "tentative" : null,
    sub: unanswered
      ? ctx.t("calendar.page.awaiting")
      : tentative
        ? ctx.t("calendar.att.tentative")
        : null,
    icon: trip ? "trip" : kind === "focus" ? "focus" : null,
    where: e.location ?? "",
    people: [e.organizer, ...(e.attendees ?? []).map((a) => a.name)].filter(Boolean),
    source: e,
  })
}

/**
 * To Do görevi → tüm gün öğesi, teslim gününde. Teslim günü TARİH olarak okunur (To Do UTC gece
 * yarısı yazar): saat dilimine çevrilmez, gün kaymaz. Bitmemişler ve bugün bitenler gelir.
 */
export function fromTask(task, ctx) {
  if (!task.dueKey) return null
  if (task.done && task.doneKey !== ctx.todayKey) return null
  const overdue = !task.done && task.dueKey < ctx.todayKey
  return dayItem(
    `task:${task.id}`,
    "task",
    task.title || ctx.t("todo.untitled"),
    task.dueKey,
    task.dueKey,
    {
      state: task.done ? "done" : overdue ? "overdue" : null,
      icon: task.done ? "taskDone" : "task",
      source: task,
    },
  )
}

const clockOf = (extra, key) => {
  const m = /^(\d{1,2}):(\d{2})/.exec(String(extra?.find((x) => x.key === key)?.value ?? ""))
  return m ? [Number(m[1]), Number(m[2])] : null
}

/** Gün altı izinde başlangıç ve bitiş saati varsa o günün saatli aralığı, yoksa null. */
function hourlySpan(leave) {
  if (leave.days != null && leave.days >= 1) return null
  const from = clockOf(leave.extra, "startTime")
  const to = clockOf(leave.extra, "endTime")
  if (!from || !to || !leave.start) return null
  const [y, m, d] = [leave.start.getFullYear(), leave.start.getMonth(), leave.start.getDate()]
  const start = new Date(y, m, d, from[0], from[1])
  const end = new Date(y, m, d, to[0], to[1])
  return end > start ? { start, end } : null
}

/** Kendi iznim (iptal ve devamsızlık olmayanlar hariç); onaydaki kesik kenarlıklı. */
export function fromLeave(leave, ctx) {
  if (!leave.start || !isAbsence(leave) || !isLive(leave)) return null
  const pending = leave.statusKind === "pending"
  const title = leave.typeName || leaveTypeName(leave.type, ctx.t)
  const status = leave.statusName ?? statusText(leave.status, ctx.t)
  const base = {
    state: pending ? "pending" : null,
    sub: status || null,
    icon: "leave",
    source: leave,
  }
  const hourly = hourlySpan(leave)
  if (hourly) {
    return make({
      id: `myLeave:${leave.id}`,
      kind: "myLeave",
      title,
      allDay: false,
      ...hourly,
      ...timedSpan(hourly.start, hourly.end),
      ...base,
    })
  }
  const hours = leave.days === 0 && leave.hours > 0
  return dayItem(
    `myLeave:${leave.id}`,
    "myLeave",
    title,
    dayKey(leave.start),
    dayKey(leave.end ?? leave.start),
    { ...base, sub: hours ? ctx.t("selfService.hours", { n: leave.hours }) : base.sub },
  )
}

/**
 * Ekip arkadaşının izni: TÜRSÜZ — tür, saat ve açıklama veri katmanında düşer, burada bir kez
 * daha `neutralLeaves`ten geçer (idempotent). Yalnız kişinin adı ve gün aralığı.
 * `person`: `{ key, name, … }`.
 */
export function fromTeamLeaves(person, leaves, ctx) {
  return neutralLeaves(leaves).map((n) => {
    const pending = n.statusKind === "pending"
    return dayItem(
      `teamLeave:${person.key}:${n.id}`,
      "teamLeave",
      person.name,
      dayKey(n.start),
      dayKey(n.end),
      {
        tail: ctx.t(pending ? "selfService.team.pendingLeave" : "selfService.team.away"),
        state: pending ? "pending" : null,
        icon: "leave",
        people: [person.name],
        source: { person, leave: n },
      },
    )
  })
}

/** Doğum günü ya da iş yıl dönümü: kişi ve gün (doğum yılı ve yaş yok). */
export function fromOccasion({ person, occasion, self }, ctx) {
  const key = dayKey(occasion.date)
  const birthday = occasion.kind === "birthday"
  return dayItem(
    `celebration:${person.key ?? person.address}:${occasion.kind}:${key}`,
    "celebration",
    self ? ctx.t("person.selfDay") : person.name,
    key,
    key,
    {
      tail: birthday ? null : ctx.t("selfService.team.soon.years", { n: occasion.years }),
      icon: birthday ? "cake" : "award",
      people: [person.name],
      source: { person, occasion, self: Boolean(self) },
    },
  )
}

/** Resmî tatiller ve arifeler: `[firstKey, lastKey]` ile kesişenler. */
export function holidayItems(firstKey, lastKey, ctx) {
  const out = []
  for (const h of TR_HOLIDAYS) {
    const last = dayKey(addDays(keyToDay(h.start), h.days - 1))
    const name = ctx.t(`widgets.holiday.name.${h.key}`)
    if (h.start <= lastKey && last >= firstKey) {
      out.push(
        dayItem(`holiday:${h.key}:${h.start}`, "holiday", name, h.start, last, {
          icon: "flag",
          source: { holiday: h },
        }),
      )
    }
    if (h.eve && h.eve <= lastKey && h.eve >= firstKey) {
      out.push(
        dayItem(`holiday:${h.key}:${h.eve}:eve`, "holiday", name, h.eve, h.eve, {
          tail: ctx.t("calendar.page.eve"),
          icon: "flag",
          source: { holiday: h, eve: true },
        }),
      )
    }
  }
  return out
}

/** Öğenin `[firstKey, lastKey]` ile kesişimi. */
export const overlapsKeys = (item, firstKey, lastKey) =>
  item.firstKey <= lastKey && item.lastKey >= firstKey

/** Aranan metin (katlanmış) öğede geçiyor mu; boş arama hepsini geçirir. */
export const matchesQuery = (item, folded) => !folded || item.hay.includes(folded)
