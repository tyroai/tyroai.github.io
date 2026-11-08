// Graph: posta (gelen kutusu, Keşfet akışı), takvim, OOF ve posta ipuçları.
import { EVERYONE, ME } from "../org.js"
import { addDays, startOfDay } from "../time.js"
import { attachmentMeta, occurrences, toGraphEvent, toGraphMessage, wallClock } from "../state.js"
import { json, graphError, parseBody, uid } from "./util.js"
import { CTX, decode, mailClause, matchesFilter, paged, preferTimeZone, zonedToDate } from "./graph-util.js"

const folderId = (name) => `AAMkADdemoFolder${name[0].toUpperCase()}${name.slice(1)}`
const accepted = () => new Response(null, { status: 202 })

// ───────────────────────────── posta ─────────────────────────────

function poolFor(gs, folder) {
  if (folder === "inbox" || folder == null) return gs.mails
  if (folder === "sentitems") {
    // Alıcı önerileri için: gelen kutusundaki dış kişilere gönderilmiş yanıtlar gibi
    return gs.mails.slice(0, 30).map((m, i) => ({
      ...m,
      id: `AAMkADdemoSent${String(i).padStart(4, "0")}`,
      from: { name: ME.displayName, address: ME.mail },
      to: [m.from],
      cc: [],
      unread: false,
      flagged: false,
    }))
  }
  return []
}

function listMessages(url, gs, folder) {
  const pool = poolFor(gs, folder)
  const filter = url.searchParams.get("$filter") ?? ""
  let rows = pool.filter((m) => matchesFilter(filter, mailClause(m)))
  const order = url.searchParams.get("$orderby") ?? "receivedDateTime desc"
  if (/asc$/i.test(order)) rows = [...rows].sort((a, b) => a.received - b.received)
  const expandsAttachments = /attachments/i.test(url.searchParams.get("$expand") ?? "")
  return paged(url, rows, (m) => ({
    ...toGraphMessage(m),
    ...(expandsAttachments ? { attachments: m.cover ? [attachmentMeta(m)] : [] } : {}),
  }))
}

function handleMail({ url, method, body, path, gs }) {
  let m
  if (method === "GET") {
    if ((m = path.match(/^\/me\/mailFolders\/(\w+)\/messages$/))) return listMessages(url, gs, m[1].toLowerCase())
    if (path === "/me/messages") return listMessages(url, gs, null)
    if ((m = path.match(/^\/me\/mailFolders\/(\w+)$/))) {
      const name = m[1].toLowerCase()
      const unread = gs.mails.filter((x) => x.unread).length
      return json({ id: folderId(name), displayName: name, unreadItemCount: name === "inbox" ? unread : 0, totalItemCount: name === "inbox" ? gs.mails.length : 0 })
    }
    if ((m = path.match(/^\/me\/(?:mailFolders\/\w+\/)?messages\/([^/]+)\/attachments$/))) {
      const msg = gs.mails.find((x) => x.id === decode(m[1]))
      return json({ "@odata.context": CTX, value: msg?.cover ? [attachmentMeta(msg)] : [] })
    }
    if ((m = path.match(/^\/me\/(?:mailFolders\/\w+\/)?messages\/([^/]+)$/))) {
      const msg = gs.mails.find((x) => x.id === decode(m[1]))
      return msg ? json({ "@odata.context": CTX, ...toGraphMessage(msg, { withBody: true }) }) : graphError(404, "ErrorItemNotFound", "The specified object was not found in the store.")
    }
    if (path === "/me/mailboxSettings/automaticRepliesSetting") {
      const t = new Date().toISOString().replace(/\.\d+Z$/, ".0000000")
      return json({
        "@odata.context": CTX,
        status: "disabled",
        externalAudience: "all",
        internalReplyMessage: "",
        externalReplyMessage: "",
        scheduledStartDateTime: { dateTime: t, timeZone: "UTC" },
        scheduledEndDateTime: { dateTime: t, timeZone: "UTC" },
      })
    }
    return null
  }
  if (method === "POST") {
    if (path === "/me/sendMail") {
      gs.sent.push(body?.message ?? {})
      return accepted()
    }
    if (/\/messages\/[^/]+\/(forward|reply|replyAll)$/.test(path)) return accepted()
    if (path === "/me/getMailTips") {
      const addrs = body?.EmailAddresses ?? []
      return json({
        value: addrs.map((address) => ({ emailAddress: { address }, automaticReplies: { message: "" } })),
      })
    }
  }
  if (method === "PATCH" && path === "/me/mailboxSettings") return json({ "@odata.context": CTX, ...(body ?? {}) })
  if (method === "PATCH" && /^\/me\/messages\/[^/]+$/.test(path)) return json({})
  return null
}

// ───────────────────────────── takvim ─────────────────────────────

function allOccurrences(gs, from, to) {
  const own = occurrences(gs.templates, from, to, gs.now)
  const created = gs.created.filter((o) => o.end > from && o.start < to)
  return [...own, ...created]
    .map((o) => ({ ...o, status: gs.rsvp?.[o.series] ?? gs.rsvp?.[o.id] ?? o.status }))
    .sort((a, b) => a.start - b.start)
}

function findEvent(gs, id) {
  const made = gs.created.find((o) => o.id === id)
  if (made) return made
  const m = id.match(/^AAMkADdemoEvt(m\d+)(\d{4})(\d{2})(\d{2})$/)
  if (!m) return null
  const day = new Date(Number(m[2]), Number(m[3]) - 1, Number(m[4]))
  return allOccurrences(gs, addDays(day, -1), addDays(day, 2)).find((o) => o.id === id) ?? null
}

function newEventFrom(body, gs) {
  const tz = body?.start?.timeZone ?? "UTC"
  const start = zonedToDate(body?.start?.dateTime ?? new Date().toISOString(), tz)
  const end = zonedToDate(body?.end?.dateTime ?? new Date(start.getTime() + 30 * 60000).toISOString(), body?.end?.timeZone ?? tz)
  const attendees = (body?.attendees ?? []).map((a) => ({
    name: a.emailAddress?.name ?? a.emailAddress?.address,
    address: a.emailAddress?.address,
    type: a.type ?? "required",
    response: "notResponded",
  }))
  return {
    key: "new",
    id: `AAMkADdemoEvtnew${uid("e").replace(/[^a-z0-9]/gi, "")}`,
    title: body?.subject ?? "(Konu yok)",
    start,
    end,
    allDay: Boolean(body?.isAllDay),
    where: body?.location?.displayName ?? "",
    teams: Boolean(body?.isOnlineMeeting),
    organizer: { name: ME.displayName, address: ME.mail },
    attendees,
    status: "organizer",
    showAs: body?.showAs ?? "busy",
    sensitivity: body?.sensitivity ?? "normal",
    body: typeof body?.body === "string" ? body.body : (body?.body?.content ?? ""),
    series: null,
  }
}

function slotsFor(gs, address, startDate, endDate) {
  const slots = Math.max(1, Math.round((endDate - startDate) / (30 * 60000)))
  const busy = Array(slots).fill("0")
  const mark = (s, e) => {
    for (let i = 0; i < slots; i++) {
      const a = new Date(startDate.getTime() + i * 30 * 60000)
      if (a >= s && a < e) busy[i] = "2"
    }
  }
  if (address.toLowerCase() === ME.mail) {
    for (const o of allOccurrences(gs, startDate, endDate)) if (!o.allDay) mark(o.start, o.end)
  } else {
    // Diğer kişiler: günde iki sabit meşgul blok (adresten türetilmiş)
    const seed = [...address].reduce((a, c) => a + c.charCodeAt(0), 0)
    for (let d = startOfDay(startDate); d < endDate; d = addDays(d, 1)) {
      if (d.getDay() === 0 || d.getDay() === 6) continue
      const h1 = 9 + (seed % 3)
      const h2 = 13 + ((seed >> 2) % 4)
      mark(new Date(d.getFullYear(), d.getMonth(), d.getDate(), h1, 0), new Date(d.getFullYear(), d.getMonth(), d.getDate(), h1 + 1, 0))
      mark(new Date(d.getFullYear(), d.getMonth(), d.getDate(), h2, 30), new Date(d.getFullYear(), d.getMonth(), d.getDate(), h2 + 1, 30))
    }
  }
  return busy.join("")
}

function handleCalendar({ url, method, body, path, headers, gs }) {
  gs.rsvp ??= {}
  const tz = preferTimeZone(headers)
  let m

  if (method === "GET") {
    if (path === "/me/calendarView") {
      const from = new Date(url.searchParams.get("startDateTime") ?? gs.now)
      const to = new Date(url.searchParams.get("endDateTime") ?? addDays(gs.now, 30))
      const rows = allOccurrences(gs, from, to)
      return paged(url, rows, (o) => toGraphEvent(o, tz))
    }
    if (/^\/users\/[^/]+\/calendarView$/.test(path)) {
      // Başkasının takvimi: paylaşılmamış (ekip dışı 403); ekip üyelerinde boş ve açık.
      const who = decode(path.split("/")[2]).toLowerCase()
      return EVERYONE.some((p) => p.mail === who) ? paged(url, [], (x) => x) : graphError(403, "ErrorAccessDenied", "Access is denied.")
    }
    if (path === "/me/events") {
      const rows = allOccurrences(gs, addDays(gs.now, -60), addDays(gs.now, 1)).reverse()
      return paged(url, rows, (o) => toGraphEvent(o, tz))
    }
    if ((m = path.match(/^\/me\/events\/([^/]+)$/))) {
      const o = findEvent(gs, decode(m[1]))
      return o ? json({ "@odata.context": CTX, ...toGraphEvent(o, tz) }) : graphError(404, "ErrorItemNotFound", "The specified object was not found in the store.")
    }
    if (path === "/me/calendars") {
      return json({ value: [{ id: "AAMkADdemoCal", name: "Takvim", owner: { name: ME.displayName, address: ME.mail } }] })
    }
    if (path === "/me/calendar") return json({ id: "AAMkADdemoCal", name: "Takvim" })
    if (path === "/me/onlineMeetings") return json({ value: [] })
    if (/^\/copilot\//.test(path)) return json({ value: [] })
    return null
  }

  if (method === "POST") {
    if (path === "/me/events") {
      const ev = newEventFrom(body, gs)
      gs.created.push(ev)
      return json({ "@odata.context": CTX, ...toGraphEvent(ev, tz) }, 201)
    }
    if ((m = path.match(/^\/me\/events\/([^/]+)\/(accept|tentativelyAccept|decline)$/))) {
      gs.rsvp[decode(m[1])] = { accept: "accepted", tentativelyAccept: "tentativelyAccepted", decline: "declined" }[m[2]]
      return accepted()
    }
    if (path === "/me/calendar/getSchedule") {
      const tzz = body?.startTime?.timeZone ?? "UTC"
      const start = zonedToDate(body?.startTime?.dateTime, tzz)
      const end = zonedToDate(body?.endTime?.dateTime, tzz)
      return json({
        "@odata.context": CTX,
        value: (body?.schedules ?? []).map((scheduleId) => ({
          scheduleId,
          availabilityView: slotsFor(gs, scheduleId, start, end),
          scheduleItems: [],
          workingHours: {
            daysOfWeek: ["monday", "tuesday", "wednesday", "thursday", "friday"],
            startTime: "09:00:00.0000000",
            endTime: "18:00:00.0000000",
            timeZone: { name: "Turkey Standard Time" },
          },
        })),
      })
    }
    return null
  }

  if (method === "PATCH" && (m = path.match(/^\/me\/events\/([^/]+)$/))) {
    const o = gs.created.find((x) => x.id === decode(m[1]))
    if (o && body?.end?.dateTime) o.end = zonedToDate(body.end.dateTime, body.end.timeZone ?? "UTC")
    if (o && body?.subject) o.title = body.subject
    return o ? json({ "@odata.context": CTX, ...toGraphEvent(o, tz) }) : new Response(null, { status: 204 })
  }
  if (method === "DELETE" && (m = path.match(/^\/me\/events\/([^/]+)$/))) {
    gs.created = gs.created.filter((x) => x.id !== decode(m[1]))
    return new Response(null, { status: 204 })
  }
  return null
}

export function handleMailAndCalendar(req) {
  return handleMail(req) ?? handleCalendar(req)
}

export { wallClock }
