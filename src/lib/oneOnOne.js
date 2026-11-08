import { STATUS, graphGet } from "@/lib/graph"
import { fetchMeetingInsight } from "@/lib/meetingInsights"
import { VOID_STATUSES } from "@/lib/selfServiceStatus"
import { fetchTeamLeave } from "@/lib/selfServiceTeamApi"

/**
 * Yönetici paketi — doğrudan bağlınla 1:1'e "Hazırlan": kişinin kalan ve yaklaşan izni (ERP,
 * yalnız bağlın için görünen bakiye), son birebir görüşmenin tarihi ve (izin verildiyse) Copilot
 * özeti, Planner'da ikinizin de atandığı açık işler. Hepsi tıklamada, süre sınırlı; düşen kaynak
 * sessizce atlanır. Bağlam yalnız kişinin kendi sohbetine gider.
 */
const DAY = 86_400_000
const LOOKBACK_DAYS = 60
const lower = (s) => String(s ?? "").toLowerCase()
const addressesOf = (p) => [p?.address, p?.upn].map(lower).filter(Boolean)

/** Toplantı doğrudan bağlınla 1:1 mi: senden başka tek kişi ve bağlıların arasında. */
export function oneOnOneReport(event, reports, myAddress) {
  const me = lower(myAddress)
  const others = new Set(
    [...(event?.attendees ?? []).map((a) => a.address), event?.organizerAddress]
      .map(lower)
      .filter((a) => a && a !== me),
  )
  if (others.size !== 1) return null
  const [only] = others
  return (reports ?? []).find((p) => addressesOf(p).includes(only)) ?? null
}

/** Planner'da ikinizin de atandığı açık işler, teslimi yakın önce (en çok beş). */
export function sharedTasks(tasks, userId) {
  if (!userId) return []
  return (tasks ?? [])
    .filter((x) => (x.percentComplete ?? 0) < 100 && x.assignments && userId in x.assignments)
    .map((x) => ({ title: x.title || "", due: x.dueDateTime ? new Date(x.dueDateTime) : null }))
    .sort((a, b) => (a.due?.getTime() ?? Infinity) - (b.due?.getTime() ?? Infinity))
    .slice(0, 5)
}

/** Bugün ya da sonra biten izinler (reddedilen, iptal, taslak düşer), başlangıca göre. */
export function upcomingLeave(leaves, now) {
  const today = new Date(now)
  today.setHours(0, 0, 0, 0)
  return (leaves ?? [])
    .filter((l) => l?.start && !VOID_STATUSES.includes(l.statusKind))
    .filter((l) => (l.end ?? l.start).getTime() >= today.getTime())
    .sort((a, b) => a.start - b.start)
}

const graphTime = (v) => (v?.dateTime ? new Date(`${v.dateTime.replace(/Z$/, "")}Z`) : null)

/** Kişiyle son birebir görüşme (son 60 gün): `{ start, end, joinUrl }` ya da `null`. */
async function lastMeetingWith(instance, account, person, now) {
  const p = new URLSearchParams({
    startDateTime: new Date(now - LOOKBACK_DAYS * DAY).toISOString(),
    endDateTime: new Date(now).toISOString(),
    $select: "start,end,attendees,organizer,onlineMeeting",
    $orderby: "start/dateTime desc",
    $top: "100",
  })
  const res = await graphGet(instance, account, {
    path: `/me/calendarView?${p}`,
    scopes: ["Calendars.Read"],
  })
  if (res.status !== STATUS.ready) return null
  const me = lower(account?.username)
  const hit = (res.data?.value ?? []).find((e) => {
    const event = {
      attendees: (e.attendees ?? []).map((a) => ({ address: a.emailAddress?.address })),
      organizerAddress: e.organizer?.emailAddress?.address,
    }
    return oneOnOneReport(event, [person], me)
  })
  if (!hit) return null
  return {
    start: graphTime(hit.start),
    end: graphTime(hit.end),
    joinUrl: hit.onlineMeeting?.joinUrl,
  }
}

const within = (promise, ms) =>
  Promise.race([promise.catch(() => null), new Promise((r) => setTimeout(() => r(null), ms))])

/** Bağlamın verisi: `{ remain, upcoming, last, recap, tasks }` (bilinmeyen alan `null`). */
export async function gatherOneOnOne(instance, account, person, now = Date.now()) {
  const [leave, last, tasks] = await Promise.all([
    within(fetchTeamLeave([{ ...person, relation: "report" }]), 6000),
    within(lastMeetingWith(instance, account, person, now), 4000),
    within(
      graphGet(instance, account, { path: "/me/planner/tasks", scopes: ["Tasks.ReadWrite"] }),
      4000,
    ),
  ])
  const member = leave?.status === "ready" ? Object.values(leave.members ?? {})[0] : null
  const insight = last?.joinUrl
    ? await within(fetchMeetingInsight(instance, account, last), 5000)
    : null
  return {
    remain: member?.balance?.remain ?? null,
    upcoming: member ? upcomingLeave(member.leaves, now) : null,
    last,
    recap: insight?.status === STATUS.ready ? insight.insight : null,
    tasks: tasks?.status === STATUS.ready ? sharedTasks(tasks.data?.value, person.id) : null,
  }
}
