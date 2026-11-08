import "@/lib/i18n/notchInd"
import { headerTitleKey } from "../headerWidgets/headerStore"

// Çentik yuvasının dar etiketi (4,5 rem): widget'ın kısa adı ("Hava durumu" → "Hava"). Anahtar
// widget'ın başlık anahtarından; listede olmayanın adı zaten kısa (Piyasa, Ufukta, OneNote…).
const SHORT = {
  "myspace.weather.title": "weather",
  "widgets.weather.title": "weather",
  "myspace.brief.title": "brief",
  "widgets.brief.title": "brief",
  "myspace.meeting.title": "meeting",
  "myspace.rhythm.title": "rhythm",
  "myspace.tasks.title": "focus",
  "widgets.focusTimer.title": "timer",
  "widgets.focusWindow.title": "freeTime",
  "widgets.holiday.title": "holiday",
  "widgets.leave.title": "leave",
  "widgets.mail.title": "mail",
  "widgets.outcomes.title": "insights",
  "widgets.planner.title": "planner",
  "widgets.region.title": "region",
  "widgets.reports.title": "report",
  "widgets.requests.title": "requests",
  "widgets.saved.title": "search",
  "widgets.shared.title": "calendars",
  "widgets.team.title": "team",
  "widgets.trader.title": "trader",
  "widgets.travel.title": "travel",
  "widgets.worldClock.title": "clock",
  "widgets.rm.title": "rm",
  "widgets.ask.title": "ask",
  "widgets.sticky.title": "notes",
  "widgets.tibotRings.title": "tibot",
}

/** Yuvanın kısa adının anahtarı; kısa karşılığı olmayan widget'ta başlığın kendisi. */
export function slotShortKey(id) {
  const title = headerTitleKey(id)
  return SHORT[title] ? `notchInd.short.${SHORT[title]}` : title
}
