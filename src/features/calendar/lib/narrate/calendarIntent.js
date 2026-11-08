import { meetingTimes, DEFAULT_MINUTES } from "@/features/calendar/lib/meeting"
import { dayKey, keyToDay } from "@/features/calendar/lib/range"
import { startOfDay } from "@/lib/leaveDays"
import { readPeople } from "./calendarPeople"
import { readTime } from "./calendarTime"
import { buildTitle, readPlace, readTeams } from "./calendarTitle"
import { MEETING_WORDS, TASK_MARKERS, TASK_VERBS, TASK_WORDS, hasWord } from "./calendarWords"
import { readDates } from "@/lib/narrate/dates"
import { narrate } from "@/lib/narrate/index"
import { saysLeave } from "@/lib/narrate/leave"
import { findStem, fold, words } from "@/lib/narrate/text"

/**
 * Takvim Anlat'ı — serbest cümleden toplantı, izin ya da görev (saf, cihazda; `lib/narrate`in kardeşi).
 * Tür sırayla: "izin" kelimesi → izin (toplantı kelimesi VE saat varsa toplantı); açık görev işareti
 * (görev, yapılacak, hatırlat), tarihe "kadar" (son gün) ya da saatsiz, kişisiz ve görev fiiliyle biten
 * cümle ("hazırla", "gönder", "ara") → görev; toplantı kelimesi (toplantı, görüşme, sunum, randevu,
 * call, meeting …) ya da saat + kişi → toplantı; görev kelimesi (teslim) → görev; kalanı: saat varsa
 * toplantı, yoksa görev. Görev işareti, son gün ve fiil toplantı kelimesinden önce gelir: "görev:
 * sunumu hazırla", "perşembeye kadar toplantı notlarını gönder", "toplantı için sunumu hazırla" görevdir.
 * İzin kelimesi yazılmasa da "3-5 kasım yıllık" gibi tarihli, saatsiz ve kişisiz yalın izin türü izindir.
 * Dönüş `{ kind, values, parts, warnings, text }` (`narrate()` ile aynı biçim); anlaşılmadıysa `kind` null:
 *  - izin: `narrate()`in izin değerleri (`kind`, `start`, `end`); yazılmayan tarih `target.day`.
 *  - toplantı: `{ title, date, from, to, who, teams?, where? }` — `useMeetingForm`un `initial`i;
 *    yazılmayan gün `target.day`, saat `target.minute`, süre 30 dk (pencerenin varsayılanı).
 *  - görev: `{ title, dueKey }`; teslim yazılmadıysa `target.day`.
 * `target`: `{ day, minute }` (boş saate basış ya da seçili gün), `kinds`: `{ leave, task }` kapalıysa
 * (kapı yok) o tür seçilmez, `now`: varsayılan saat için an.
 */

const CHAT = new Set(["merhaba", "selam", "naber", "nasilsin", "tesekkurler", "tesekkur", "tamam"])
const CHAT_MORE = new Set(["evet", "hayir", "test", "deneme", "sagol", "gunaydin"])
// "izin kelimesi yok ama izin" sayılan yalın türler (tarihle birlikte); "rapor", "randevu", "doktor" görev ve toplantıyla çakışır.
const PLAIN_LEAVE = [
  "yillik",
  "yilik",
  "senelik",
  "hastayim",
  "hastalandim",
  "cenaze",
  "taziye",
  "tatil",
]
// Tarih/saatin hemen ardından gelen ve tek başına anlamsız kalan kelimeler.
const TRAILERS = new Set(["kadar", "itibaren", "baslayarak", "gunu", "gunku", "arasi", "arasinda"])

const trimEnd = (s) => s.replace(/[,;:!?.]+$/u, "")

/** Anlaşılmayan: soru ya da sohbet ("merhaba", "Ahmet'in izni ne zaman?"). */
function notAsked(raw, list) {
  if (/\?/.test(raw) || /\b(?:ne zaman|nedir|nerede)\b/.test(list.join(" "))) return true
  if (/^(?:mi|mu|misin|musun|miyiz)$/.test(list.at(-1) ?? "")) return true
  const chat = list.filter((w) => CHAT.has(w) || CHAT_MORE.has(w)).length
  return chat > 0 && list.length <= 3
}

/** Kelime sıralarının katlanmış yazıdaki karakter aralıkları (kelimeler tek boşlukla birleşik). */
function spansOf(toks) {
  let at = 0
  return toks.map((t) => {
    const span = [at, at + t.f.length]
    at += t.f.length + 1
    return span
  })
}

/**
 * Toplantı günü: yazılan gün; yazılan aralık bugünü içeriyorsa bugün ("bu hafta"); yazılmadıysa seçili
 * gün ("bu akşam" ise bugün).
 */
function meetingDay(d, today, target, thisPart = false) {
  if (!d.start) return thisPart ? today : startOfDay(target?.day ?? today)
  return d.end > d.start && d.start < today && d.end >= today ? today : d.start
}

function leaveResult(raw, today, target) {
  const got = narrate(raw, { today, kind: "leave" })
  const day = startOfDay(target?.day ?? today)
  // Tarih yazılmadıysa form seçili günle açılır (Yeni › İzin talebi gibi).
  const dated = got.parts.some((p) => p.key === "dates")
  return {
    ...got,
    kind: "leave",
    values: { start: day, end: day, ...got.values },
    parts: dated ? got.parts : [...got.parts, { key: "dates", start: day, end: day }],
  }
}

export function narrateCalendar(text, { today, now = new Date(), target = null, kinds = {} } = {}) {
  const raw = String(text ?? "").trim()
  if (!raw) return null
  const empty = { kind: null, values: {}, parts: [], warnings: [], text: raw }
  const toks = raw
    .split(/\s+/)
    .map((r) => ({ raw: r, f: fold(r) }))
    .filter((t) => t.f)
  const folded = toks.map((t) => t.f).join(" ")
  const list = words(folded)
  if (!list.length || notAsked(raw, list)) return empty
  const can = { leave: kinds.leave !== false, task: kinds.task !== false }

  // Saat tarihten önce okunur ("14.30" gün.ay, "14-15 arası" ay içi aralık sanılmasın).
  const time = readTime(folded)
  const timed = time.from != null && !time.soft
  const meetingWord = hasWord(list, MEETING_WORDS)
  if (can.leave && saysLeave(folded) && !(meetingWord && timed))
    return leaveResult(raw, today, target)

  const dead = new Set()
  const ranges = spansOf(toks)
  const kill = (spans) =>
    spans.forEach(([a, b]) => ranges.forEach(([x, y], i) => a < y && b > x && dead.add(i)))
  kill(time.spans)
  const d = readDates(time.rest, today, { numeric: true })
  // Tarihsiz süre ("3 gün içinde", "10 dk sonra") okunmaz: yazı konuda kalır, bilgi sessizce kaybolmasın.
  const duration = ([a, b]) => /^\d{1,2} ?(?:is ?)?(?:gun|hafta|ay)/.test(time.rest.slice(a, b))
  kill(d.start ? d.spans : d.spans.filter((span) => !duration(span)))
  // "perşembeye kadar", "cuma günü": tarihin ardındaki bağlaçlar da gider.
  toks.forEach((t, i) => TRAILERS.has(trimEnd(t.f)) && dead.has(i - 1) && dead.add(i))

  const teams = readTeams(toks, dead)
  const people = readPeople(toks, dead)
  const taskWord = hasWord(list, TASK_WORDS) || list.includes("kadar")
  const person = people.names.length > 0
  // Yalın izin türü: tarih dışında en çok iki kelime kalmalı ("yarın yıllık rapor hazırla" izin değil).
  const plainLeave = findStem(list, PLAIN_LEAVE, 6) && toks.length - dead.size <= 2

  // Açık işaret ya da tarihe "kadar" (saat değil): toplantı kelimesi geçse de görev.
  const alive = toks.filter((_, i) => !dead.has(i))
  const verbEnd = TASK_VERBS.has(trimEnd(alive.at(-1)?.f ?? "")) && time.from == null && !person
  const taskLead =
    hasWord(list, TASK_MARKERS) ||
    time.until ||
    (list.includes("kadar") && d.start && !timed) ||
    verbEnd
  let kind
  if (
    can.leave &&
    plainLeave &&
    d.start &&
    !meetingWord &&
    !taskWord &&
    time.from == null &&
    !person
  )
    kind = "leave"
  else if (taskLead && can.task) kind = "task"
  else if (meetingWord || (time.from != null && person)) kind = "meeting"
  else if (taskWord && can.task) kind = "task"
  else kind = timed || !can.task ? "meeting" : "task"
  if (kind === "leave") return leaveResult(raw, today, target)

  if (kind === "task") {
    const title = buildTitle(toks, dead, false)
    if (!title) return empty
    const due = d.end ?? d.start ?? startOfDay(target?.day ?? today)
    return {
      kind,
      values: { title, dueKey: dayKey(due) },
      parts: [
        { key: "due", date: due },
        { key: "title", value: title },
      ],
      warnings: d.start && due < today ? ["past"] : [],
      text: raw,
    }
  }

  const place = readPlace(toks, new Set([...dead, ...teams.used, ...people.used]))
  const drop = new Set([...dead, ...teams.used, ...people.used, ...(place?.used ?? [])])
  const title = buildTitle(toks, drop, true)
  const minutes = time.to != null ? time.to - time.from : (time.minutes ?? DEFAULT_MINUTES)
  const day = meetingDay(d, today, target, /\bbu (?:aksam|sabah|oglen|ogleden)/.test(folded))
  const slot = meetingTimes(day, {
    minute: time.from ?? target?.minute ?? null,
    now,
    minutes,
  })
  const values = { title, ...slot, who: people.names }
  if (teams.on != null) values.teams = teams.on
  if (place) values.where = place.text
  // Yalnız varsayılanlar anlaşıldıysa (ne gün, ne saat, ne kişi, ne konu): anlaşılmadı.
  if (!title && !d.start && time.from == null && !person && teams.on == null && !place) return empty
  return {
    kind,
    values,
    parts: [
      {
        key: "when",
        day: keyToDay(slot.date),
        from: slot.from,
        to: slot.to,
      },
      ...people.names.map((value) => ({ key: "who", value })),
      ...(teams.on == null ? [] : [{ key: teams.on ? "teams" : "inPerson" }]),
      ...(place ? [{ key: "where", value: place.text }] : []),
      ...(title ? [{ key: "title", value: title }] : []),
    ],
    warnings: d.start && day < today ? ["past"] : [],
    text: raw,
  }
}
