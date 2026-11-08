import { countText, number } from "@/features/selfservice/kinds"
import { keyToDay } from "@/features/calendar/lib/range"
import { selectLists } from "@/features/calendar/lib/statsLists"
import { addDays } from "@/lib/leaveDays"
import { leaveSummary } from "@/lib/leaveSummary"
import { leaveTypeName } from "@/lib/selfServiceNames"
import { clock, dayLabel, dayMonth, spanLabel } from "./format"

/**
 * "Takvim özeti" satırlarının balon içeriği (saf, testli): her satır için `{ intro, entries, empty,
 * footer }`. `entries` satırın saydığı kayıtlar (`features/calendar/lib/statsLists`): `{ key, title, meta,
 * time, item }`; `item` takvim öğesi (satıra basınca ayrıntı onunla açılır), yoksa null (tıklanamaz).
 * `empty` sıfır kayıtta tek cümle; `footer`: alttaki eylem ("newLeave" · "selfService" · "holidays").
 */

/** Balonda en çok bu kadar satır; fazlası "+n daha" yazısı (düğme değil). */
export const TIP_LIMIT = 6

const join = (...parts) => parts.filter(Boolean).join(" · ")
const clip = (d, lo, hi) => (d < lo ? lo : d > hi ? hi : d)
const entry = (key, title, meta, item, time = null) => ({
  key: String(key),
  title,
  meta,
  time,
  item,
})

/** İzin kaydının süresi: gün, günü olmayan saatlik kayıtta saat. */
function amount(t, locale, r) {
  if (r.days > 0) return countText(t, locale, "selfService.days", r.days)
  return r.hours > 0 ? t("selfService.hours", { n: number(r.hours, locale) }) : ""
}
const leaveTitle = (t, r, item) => item?.title ?? (r.typeName || leaveTypeName(r.type, t))

/** Bakiye satırlarının açıklaması: `leaveSummary`nin gerçekten verdiği sayılardan. */
function balanceIntro({ t, locale, own, today }) {
  const s = own ? leaveSummary({ balance: own.balance, leaves: own.leaves, now: today }) : null
  if (!s) return { available: null, claim: null }
  const days = (n) => countText(t, locale, "selfService.days", n)
  const remain = days(s.remain ?? 0)
  let available = null
  if (s.remain != null) {
    available =
      s.pending > 0
        ? t("calendar.page.tip.available", { remain, pending: days(s.pending) })
        : t("calendar.page.tip.availableClear", { remain })
  }
  const claim =
    s.used != null
      ? t("calendar.page.tip.claimUsed", { used: days(s.used) })
      : t("calendar.page.tip.claim")
  return { available, claim }
}

/** Satır başına kayıt satırları (`sel`: `selectLists` çıktısı). */
function entriesOf({ t, locale, first, last }, sel) {
  const eventEntry = ({ event: e, item }) =>
    entry(
      e.id,
      item?.title ?? (e.subject || t("calendar.noSubject")),
      dayLabel(e.start, locale),
      item,
      `${clock(e.start, locale)} – ${clock(e.end, locale)}`,
    )
  return {
    pending: sel.pending.map(({ record: r, item }) =>
      entry(
        r.id,
        leaveTitle(t, r, item),
        join(spanLabel(r.start, r.end ?? r.start, locale), amount(t, locale, r)),
        item,
      ),
    ),
    // Dönemin içine kırpılmış aralık ve payı: sayı da dönem payıdır (`leavesIn`).
    myLeave: sel.myLeave.map(({ record: r, days, item }) =>
      entry(
        r.id,
        leaveTitle(t, r, item),
        join(
          spanLabel(clip(r.start, first, last), clip(r.end ?? r.start, first, last), locale),
          countText(t, locale, "selfService.days", days),
        ),
        item,
      ),
    ),
    // Kişinin dönemdeki her izni ayrı aralık ("27 Eki, 2–6 Kas"): birleşik aralık aradaki günleri de kapsardı.
    team: sel.team.map(({ row, items, item }) =>
      entry(
        row.key,
        row.name,
        items.length
          ? items
              .map((i) =>
                spanLabel(
                  clip(keyToDay(i.firstKey), first, last),
                  clip(keyToDay(i.lastKey), first, last),
                  locale,
                ),
              )
              .join(", ")
          : spanLabel(row.from, row.to, locale),
        item,
      ),
    ),
    meetings: sel.meetings.map(eventEntry),
    awaiting: sel.awaiting.map(eventEntry),
    tasks: sel.tasks.map(({ item }) =>
      entry(
        item.id,
        item.title,
        item.state === "overdue"
          ? t("todo.due.overdue", { date: dayMonth(item.start, locale) })
          : dayLabel(item.start, locale),
        item,
      ),
    ),
    celebrations: sel.celebrations.map(({ item }) =>
      entry(
        item.id,
        item.title,
        join(
          t(
            item.source?.occasion?.kind === "birthday"
              ? "person.ctx.birthday"
              : "person.ctx.anniversary",
          ),
          item.tail,
          dayLabel(item.start, locale),
        ),
        item,
      ),
    ),
    holidays: sel.holidays.map(({ holiday: h, item }) => {
      const from = keyToDay(h.start)
      return entry(
        `${h.key}:${h.start}`,
        item?.title ?? t(`widgets.holiday.name.${h.key}`),
        spanLabel(from, addDays(from, h.days - 1), locale),
        item,
      )
    }),
  }
}

/**
 * Bütün satırların balon içeriği, satır kimliğine göre. `own`: `{ leaves, balance }` (izin kaynağı
 * hazırsa, yoksa null), `team`: `{ people, members }` ya da null, `index`: `indexItems(öğeler)`,
 * `period`: `periodOf`.
 */
export function statTips({ t, locale, today, period, own, team, events, index }) {
  const { first, last } = period
  const sel = selectLists({ index, leaves: own?.leaves, team, events, first, last, today })
  const list = entriesOf({ t, locale, first, last }, sel)
  const intro = balanceIntro({ t, locale, own, today })
  const tip = (id, extra) => ({
    intro: null,
    entries: list[id] ?? [],
    empty: null,
    footer: null,
    ...extra,
  })
  return {
    available: tip("available", { intro: intro.available, footer: "newLeave" }),
    pending: tip("pending", { empty: t("calendar.page.tip.emptyPending") }),
    claim: tip("claim", { intro: intro.claim, footer: "selfService" }),
    myLeave: tip("myLeave"),
    team: tip("team", { empty: t("calendar.page.tip.emptyTeam") }),
    meetings: tip("meetings", { empty: t("calendar.page.tip.emptyMeetings") }),
    awaiting: tip("awaiting"),
    tasks: tip("tasks"),
    celebrations: tip("celebrations"),
    holidays: tip("holidays", { empty: t("calendar.page.tip.emptyHolidays"), footer: "holidays" }),
  }
}
