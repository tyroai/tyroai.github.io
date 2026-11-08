/**
 * Katman başına kaynak durumu (saf, testli): "ok" · "loading" · "partial" (okundu ama eksik
 * olabilir) · "failed" (okunamadı) · "off" (katman bu kişide yok: kapı kapalı, ekip yok, ERP'de
 * kaydı yok). Okunamayan kaynak ekranda hata kartı değil, katman çipinde küçük bir ipucu olur
 * ("soramadık ≠ yok").
 */

const graph = (s) => (s === "ready" ? "ok" : s === "loading" ? "loading" : "failed")

function taskState(board) {
  if (!board) return "off"
  if (board.status !== "ready") return graph(board.status)
  return board.skipped > 0 || board.doneMissing || board.truncated ? "partial" : "ok"
}

function leaveState(leave) {
  if (!leave) return "off"
  // ERP'de çalışan kaydı yok: izin katmanı bu kişide yok (hata değil).
  if (leave.status === "notFound") return "off"
  return graph(leave.status)
}

function teamState(leave) {
  const team = leave?.team
  if (!team) return "off"
  if (team.status !== "ready") return graph(team.status)
  if (!team.people?.length) return "off"
  switch (team.leave?.status) {
    case "loading":
      return "loading"
    case "ready":
      return team.leave.failed?.includes("leaves") ? "partial" : "ok"
    case "empty":
      return "ok"
    case "none":
      return "off"
    default:
      return "failed"
  }
}

/**
 * Outlook henüz bu pencerenin olaylarını getirmedi mi: ilk yükleme ya da pencere değişti de kanca
 * hâlâ ESKİ pencerenin olaylarını tutuyor (`cal.range` ≠ `key`). Karar pencere kimliğinden: olay
 * dizisinin kimliğine bakılsa, önbellekten AYNI nesne dönünce (A → B → A) sonsuza kadar takılırdı.
 * `range` yoksa (oturumsuz, sahte kanca) bekleyen bir şey yok.
 */
export const windowLoading = (cal, key) =>
  cal.status === "loading" || (cal.status === "ready" && cal.range != null && cal.range !== key)

/** Katman başına okunamama nedeninin kodu (`lib/errorCause`): çip balonunda cümle ve kod. */
export function layerDetails({ cal, board, leave }) {
  return {
    meeting: cal.detail,
    focus: cal.detail,
    trip: cal.detail,
    task: board?.detail,
    myLeave: leave?.detail,
    teamLeave: leave?.team?.detail,
  }
}

/** `cal`: `useCalendarEvents`, `board`: To-Do panosu ya da null, `leave`: izin kaynağı ya da null. */
export function layerStatus({ cal, board, leave, occasions }) {
  const meetings = graph(cal.status)
  return {
    meeting: meetings,
    focus: meetings,
    trip: meetings,
    task: taskState(board),
    myLeave: leaveState(leave),
    teamLeave: teamState(leave),
    celebration: occasions,
    holiday: "ok",
  }
}

/**
 * Paylaşılan takvimlerin kişi başına durumu: `{ person, state }`. "loading" (pencere okunuyor) ·
 * "ok" · "unreachable" (kişinin takvimi okunamadı: paylaşmamış ya da izin yok — ikisi de 403, ayırt
 * edilemez; kişi listeden atılmaz, çipinde küçük bir not olur) · "failed" (kendi takvimim okunamadı,
 * kimsenin durumu bilinmiyor). Hata kartı yok: "soramadık ≠ boş".
 */
export function peopleStatus(people, cal, loading) {
  const blocked = new Map((cal.unreachable ?? []).map((p) => [p.address.toLowerCase(), p.detail]))
  const whole = loading ? "loading" : cal.status === "ready" ? null : "failed"
  return people.map((person) => ({
    person,
    state: whole ?? (blocked.has(person.address.toLowerCase()) ? "unreachable" : "ok"),
    detail: whole ? cal.detail : blocked.get(person.address.toLowerCase()),
  }))
}
