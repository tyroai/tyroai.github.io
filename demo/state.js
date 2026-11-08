// Veri seti içeriğini (demo/datasets/sets/*.js) Graph'ın anlayacağı iç nesnelere çevirir.
// Her şey "şimdi"ye göre hesaplanır: takvim, posta ve görevler hangi gün açılırsa açılsın güncel görünür.
import { ME, resolvePerson } from "./org.js"
import { DAY, HOUR, MIN, addDays, atTime, backAnchor, bizAdd, forwardAnchor, isoWeekday, startOfDay, ymd } from "./time.js"

export const DRIVE_ID = "b!demoDriveOmerGumus0001"
export const DRIVE_WEB = "https://tyrotech-my.sharepoint.example/personal/omer_gumus_tyrotech_example"

const htmlEscape = (s) =>
  String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")

// ───────────────────────────── takvim ─────────────────────────────

function normalizeMeeting(m, i) {
  const organizer = resolvePerson(m.organizer ?? "Ömer Gümüş")
  const attendees = (m.with ?? []).map((s) => ({ ...resolvePerson(s), type: "required", response: "accepted" }))
  const own = organizer.address === ME.mail
  return {
    key: `m${i}`,
    title: m.title,
    recur: m.recur ?? null,
    weekday: m.weekday ?? null,
    dom: m.dom ?? null,
    day: m.day ?? 0,
    time: m.time ?? "10:00",
    minutes: m.minutes ?? 30,
    allDay: Boolean(m.allDay),
    span: m.span ?? 1,
    where: m.where ?? "",
    teams: m.teams ?? /teams/i.test(m.where ?? ""),
    organizer,
    attendees,
    status: m.status ?? (own ? "organizer" : "accepted"),
    showAs: m.showAs ?? "busy",
    sensitivity: m.private ? "private" : "normal",
    body: m.body ?? "",
  }
}

export function meetingTemplates(meetings = []) {
  return meetings.map(normalizeMeeting)
}

// Tek seferlik kayıtlar İŞ GÜNÜ cinsinden verilir (day: 0 = bugün; hafta sonuysa sonraki pazartesi):
// demo hangi gün açılırsa açılsın normal bir çalışma haftası gibi görünür.
function dayMatches(t, d, anchor) {
  if (t.recur === "weekly") return isoWeekday(d) === t.weekday
  if (t.recur === "daily") return isoWeekday(d) <= 5
  if (t.recur === "monthly") return d.getDate() === t.dom
  const first = bizAdd(anchor, t.day)
  const last = addDays(first, t.allDay ? t.span - 1 : 0)
  return d >= first && d <= last
}

/** [from, to) aralığına değen oluşumlar (seri açılmış, her biri `series` kimliği taşır). */
export function occurrences(templates, from, to, now = new Date()) {
  const anchor = forwardAnchor(now)
  const out = []
  for (let d = addDays(startOfDay(from), -1); d < to; d = addDays(d, 1)) {
    for (const t of templates) {
      if (!dayMatches(t, d, anchor)) continue
      const start = t.allDay ? startOfDay(d) : atTime(d, t.time)
      const end = t.allDay ? addDays(start, t.recur ? 1 : t.span) : new Date(start.getTime() + t.minutes * MIN)
      if (end <= from || start >= to) continue
      // Tek günlük toplantı bir kez: yalnız ilk gününde (çok günlü tüm gün etkinliği için) üret
      if (!t.recur && t.allDay && ymd(d) !== ymd(bizAdd(anchor, t.day))) continue
      out.push({
        ...t,
        id: `AAMkADdemoEvt${t.key}${ymd(d).replaceAll("-", "")}`,
        series: t.recur ? `AAMkADdemoSeries${t.key}` : null,
        start,
        end,
      })
    }
  }
  return out.sort((a, b) => a.start - b.start)
}

const p2 = (n) => String(n).padStart(2, "0")

/** `tz` saat diliminde duvar saati: "YYYY-MM-DDTHH:mm:ss.0000000". */
export function wallClock(date, tz) {
  if (!tz || tz.toUpperCase() === "UTC") return date.toISOString().replace(/\.\d+Z$/, ".0000000")
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: tz,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      hourCycle: "h23",
    })
      .formatToParts(date)
      .map((p) => [p.type, p.value]),
  )
  return `${parts.year}-${parts.month}-${parts.day}T${parts.hour}:${parts.minute}:${parts.second}.0000000`
}

export function toGraphEvent(o, tz = "UTC") {
  const start = o.allDay ? `${ymd(o.start)}T00:00:00.0000000` : wallClock(o.start, tz)
  const end = o.allDay ? `${ymd(o.end)}T00:00:00.0000000` : wallClock(o.end, tz)
  const join = o.teams ? `https://teams.microsoft.com/l/meetup-join/19%3ameeting_demo${o.id.slice(-12)}%40thread.v2/0` : null
  return {
    "@odata.etag": `W/"demo-${o.id}"`,
    id: o.id,
    subject: o.title,
    isAllDay: o.allDay,
    isCancelled: false,
    start: { dateTime: start, timeZone: tz },
    end: { dateTime: end, timeZone: tz },
    location: { displayName: o.where, locationType: o.where ? "default" : "default" },
    attendees: o.attendees.map((a) => ({
      type: a.type ?? "required",
      status: { response: a.response ?? "accepted", time: "0001-01-01T00:00:00Z" },
      emailAddress: { name: a.name, address: a.address },
    })),
    organizer: { emailAddress: { name: o.organizer.name, address: o.organizer.address } },
    isOnlineMeeting: o.teams,
    onlineMeetingProvider: o.teams ? "teamsForBusiness" : "unknown",
    onlineMeeting: join ? { joinUrl: join } : null,
    onlineMeetingUrl: join,
    webLink: `https://outlook.office.com/calendar/item/${encodeURIComponent(o.id)}`,
    responseStatus: { response: o.status, time: "0001-01-01T00:00:00Z" },
    bodyPreview: o.body.replace(/\s+/g, " ").slice(0, 220),
    body: { contentType: "html", content: `<div>${htmlEscape(o.body)}</div>` },
    seriesMasterId: o.series,
    showAs: o.showAs,
    sensitivity: o.sensitivity,
    iCalUId: `${o.id}@tyrotech.example`,
  }
}

// ───────────────────────────── posta ─────────────────────────────

/** Keşfet akışının altı sabit kaynağı (uygulamadaki `FEED_SOURCES` ile aynı adresler). */
export const FEED_SENDERS = {
  haberler: { name: "TYRO Haberler", address: "tyro.haberler@tyrotech.example" },
  duyuru: { name: "TYRO Duyuru", address: "tyro.duyuru@tyrotech.example" },
  ik: { name: "İnsan Kaynakları", address: "insankaynaklari@tyrotech.example" },
  egitim: { name: "TYRO Eğitim", address: "tyro.egitim@tyrotech.example" },
  akademi: { name: "TYRO Dijital Akademi", address: "tyrodijitalakademi@tyrotech.example" },
  kulup: { name: "TYRO Kulüp", address: "tyrokulup@tyrotech.example" },
}
export const FEED_ADDRESSES = Object.values(FEED_SENDERS).map((s) => s.address)

function mailBody(m, from) {
  const paras = Array.isArray(m.body) ? m.body : m.body ? [m.body] : [m.preview ?? ""]
  const html = paras.map((p) => (/^\s*</.test(p) ? p : `<p style="margin:0 0 12px">${p}</p>`)).join("")
  const sign = m.feed
    ? ""
    : `<p style="margin:16px 0 0;color:#5b6b80">${htmlEscape(from.name)}${from.org ? `<br>${htmlEscape(from.org)}` : ""}</p>`
  return `<div style="font-family:'Segoe UI',Arial,sans-serif;font-size:14px;line-height:1.5;color:#16202e">${html}${sign}</div>`
}

const stripTags = (h) => h.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim()

export function buildMails(items = [], now = new Date()) {
  const base = backAnchor(now)
  const mails = items.map((m, i) => {
    const from = m.feed ? FEED_SENDERS[m.feed] : resolvePerson(m.from)
    const at = m.at ?? { days: 0, time: "09:00" }
    let received
    if (at.minutesAgo != null) received = new Date(now.getTime() - at.minutesAgo * MIN)
    else if (at.hoursAgo != null) received = new Date(now.getTime() - at.hoursAgo * HOUR)
    else received = atTime(bizAdd(base, -(at.days ?? 0)), at.time ?? "09:00")
    if (received > now) received = new Date(now.getTime() - 7 * MIN)
    const body = mailBody(m, from)
    const to = (m.to ?? ["Ömer Gümüş"]).map(resolvePerson)
    const id = `AAMkADdemoMsg${String(i).padStart(4, "0")}`
    return {
      id,
      internetMessageId: `<demo-${i}@tyrotech.example>`,
      subject: m.subject,
      from,
      to,
      cc: (m.cc ?? []).map(resolvePerson),
      received,
      unread: m.unread ?? false,
      importance: m.important ? "high" : "normal",
      flagged: Boolean(m.flagged),
      preview: m.preview ?? stripTags(body).slice(0, 200),
      body,
      hasAttachments: false,
      feed: m.feed ?? null,
      webLink: `https://outlook.office.com/mail/id/${encodeURIComponent(id)}`,
    }
  })
  return mails.sort((a, b) => b.received - a.received)
}

export function toGraphMessage(m, { withBody = false } = {}) {
  const addr = (p) => ({ emailAddress: { name: p.name, address: p.address } })
  return {
    id: m.id,
    internetMessageId: m.internetMessageId,
    subject: m.subject,
    from: addr(m.from),
    sender: addr(m.from),
    toRecipients: m.to.map(addr),
    ccRecipients: m.cc.map(addr),
    receivedDateTime: m.received.toISOString(),
    sentDateTime: m.received.toISOString(),
    isRead: !m.unread,
    isDraft: false,
    importance: m.importance,
    bodyPreview: m.preview,
    hasAttachments: m.hasAttachments,
    webLink: m.webLink,
    parentFolderId: "AAMkADdemoFolderInbox",
    flag: { flagStatus: m.flagged ? "flagged" : "notFlagged" },
    conversationId: `AAQkADdemoConv${m.id.slice(-4)}`,
    singleValueExtendedProperties: [],
    ...(withBody ? { body: { contentType: "html", content: m.body } } : {}),
  }
}

// ───────────────────────────── görevler ─────────────────────────────

export function buildTodo(todo = {}, now = new Date()) {
  const today = startOfDay(now)
  const fwd = forwardAnchor(now)
  const back = backAnchor(now)
  return (todo.lists ?? []).map((l, li) => ({
    id: `AQMkADdemoList${li}`,
    displayName: l.name,
    wellknownListName: l.default || li === 0 ? "defaultList" : "none",
    isOwner: true,
    isShared: false,
    tasks: (l.tasks ?? []).map((t, ti) => {
      const done = t.status === "completed" || t.completedDaysAgo != null
      const created = addDays(today, -(t.createdDaysAgo ?? 6 + ti))
      const completed = done ? atTime(bizAdd(back, -(t.completedDaysAgo ?? 1)), "16:20") : null
      return {
        id: `AAMkADdemoTask${li}x${ti}`,
        title: t.title,
        status: done ? "completed" : (t.status ?? "notStarted"),
        importance: t.importance ?? "normal",
        due: t.due == null ? null : bizAdd(fwd, t.due),
        completed,
        created,
        modified: completed ?? addDays(today, -Math.max(0, (t.createdDaysAgo ?? 6 + ti) - 2)),
        note: t.note ?? "",
        steps: (t.steps ?? []).map((s, si) => ({
          id: `AAMkADdemoStep${li}x${ti}x${si}`,
          displayName: typeof s === "string" ? s : s.title,
          isChecked: typeof s === "string" ? false : Boolean(s.done),
          createdDateTime: created.toISOString(),
        })),
      }
    }),
  }))
}

const utcDay = (d) => `${ymd(d)}T00:00:00.0000000`

export function toGraphList(l) {
  return {
    "@odata.etag": `W/"demo-${l.id}"`,
    id: l.id,
    displayName: l.displayName,
    wellknownListName: l.wellknownListName,
    isOwner: l.isOwner,
    isShared: l.isShared,
  }
}

export function toGraphTask(t, { withSteps = false } = {}) {
  return {
    "@odata.etag": `W/"demo-${t.id}"`,
    id: t.id,
    title: t.title,
    status: t.status,
    importance: t.importance,
    isReminderOn: false,
    createdDateTime: t.created.toISOString(),
    lastModifiedDateTime: t.modified.toISOString(),
    hasAttachments: false,
    categories: [],
    body: { content: t.note, contentType: "text" },
    ...(t.due ? { dueDateTime: { dateTime: utcDay(t.due), timeZone: "UTC" } } : {}),
    ...(t.completed ? { completedDateTime: { dateTime: t.completed.toISOString().replace("Z", "0000"), timeZone: "UTC" } } : {}),
    ...(withSteps ? { checklistItems: t.steps } : {}),
  }
}

// ───────────────────────────── dosyalar ─────────────────────────────

const MIME = {
  xlsx: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  docx: "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  pptx: "application/vnd.openxmlformats-officedocument.presentationml.presentation",
  pdf: "application/pdf",
  csv: "text/csv",
  txt: "text/plain",
}

export function buildFiles(items = [], now = new Date()) {
  const back = backAnchor(now)
  return items.map((f, i) => {
    const ext = f.name.split(".").pop().toLowerCase()
    const by = resolvePerson(f.by ?? "Ömer Gümüş")
    const modified = atTime(bizAdd(back, -(f.daysAgo ?? i)), f.time ?? "15:10")
    const folder = f.folder ?? "Belgelerim"
    return {
      id: `01DEMOFILE${String(i).padStart(4, "0")}`,
      name: f.name,
      ext,
      size: f.size ?? 80000 + i * 23117,
      modified,
      created: addDays(modified, -(f.createdDaysBefore ?? 20)),
      by,
      folder,
      webUrl: `${DRIVE_WEB}/Documents/${encodeURIComponent(folder)}/${encodeURIComponent(f.name)}`,
      mime: MIME[ext] ?? "application/octet-stream",
    }
  })
}

export function toDriveItem(f) {
  const user = (p) => ({ user: { displayName: p.name, email: p.address, id: p.address } })
  return {
    id: f.id,
    name: f.name,
    size: f.size,
    lastModifiedDateTime: f.modified.toISOString(),
    createdDateTime: f.created.toISOString(),
    lastModifiedBy: user(f.by),
    createdBy: user(f.by),
    webUrl: f.webUrl,
    parentReference: {
      driveId: DRIVE_ID,
      driveType: "business",
      id: "01DEMOFOLDER0001",
      path: `/drive/root:/${f.folder}`,
    },
    file: { mimeType: f.mime },
    "@microsoft.graph.downloadUrl": f.webUrl,
  }
}

export function folderItems(files) {
  const names = [...new Set(files.map((f) => f.folder))]
  return names.map((name, i) => ({
    id: `01DEMODIR${String(i).padStart(4, "0")}`,
    name,
    size: 0,
    lastModifiedDateTime: new Date().toISOString(),
    createdDateTime: new Date(Date.now() - 90 * DAY).toISOString(),
    lastModifiedBy: { user: { displayName: ME.displayName, email: ME.mail, id: ME.mail } },
    createdBy: { user: { displayName: ME.displayName, email: ME.mail, id: ME.mail } },
    webUrl: `${DRIVE_WEB}/Documents/${encodeURIComponent(name)}`,
    parentReference: { driveId: DRIVE_ID, driveType: "business", id: "01DEMOROOT0001", path: "/drive/root:" },
    folder: { childCount: files.filter((f) => f.folder === name).length },
  }))
}

// ───────────────────────────── OneNote ─────────────────────────────

export function buildNotes(items = [], now = new Date()) {
  const back = backAnchor(now)
  return items.map((n, i) => ({
    id: `1-demonote${String(i).padStart(3, "0")}`,
    title: n.title,
    section: n.section ?? "Toplantı Notları",
    notebook: n.notebook ?? "Satış",
    modified: atTime(bizAdd(back, -(n.daysAgo ?? i)), n.time ?? "11:30"),
    html: `<html><head><title>${htmlEscape(n.title)}</title></head><body><h1>${htmlEscape(n.title)}</h1>${(
      Array.isArray(n.body) ? n.body : [n.body ?? ""]
    )
      .map((p) => (/^\s*</.test(p) ? p : `<p>${p}</p>`))
      .join("")}</body></html>`,
  }))
}

export function toOneNotePage(n) {
  return {
    id: n.id,
    title: n.title,
    createdDateTime: n.modified.toISOString(),
    lastModifiedDateTime: n.modified.toISOString(),
    links: { oneNoteWebUrl: { href: `https://tyrotech-my.sharepoint.example/personal/omer_gumus_tyrotech_example/_layouts/15/Doc.aspx?sourcedoc=${n.id}` } },
    parentSection: { id: `1-demosection-${n.section}`, displayName: n.section },
    parentNotebook: { id: `1-demonotebook-${n.notebook}`, displayName: n.notebook },
  }
}

/** Tek çatı: veri setinden bu oturumun durumu. */
export function buildState(ds, now = new Date()) {
  return {
    now,
    templates: meetingTemplates(ds.meetings),
    created: [], // kullanıcının oluşturduğu etkinlikler (bellekte)
    mails: buildMails(ds.mail, now),
    lists: buildTodo(ds.todo, now),
    files: buildFiles(ds.files, now),
    notes: buildNotes(ds.notes, now),
    sent: [],
  }
}
