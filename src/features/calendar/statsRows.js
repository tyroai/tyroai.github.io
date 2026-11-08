import { countText } from "@/features/selfservice/kinds"
import { getNumberFormat, pluralKey } from "@/lib/intl-cache"

/**
 * "Takvim özeti" panelinin satırları (saf, testli): her satır `{ id, tone, icon, title, sub,
 * action? }`. Sayılar dile uygun biçimde (`1,5` · `1.5`), çoğul biçimler sözlükten (dört dilde
 * altı biçim). Kaynağı okunamayan satır yazılmaz: boş sayı "0" demek olurdu.
 *
 * İki grup: BAKİYE satırları (kullanılabilir gün, bekleyen talep, toplam hak) döneme bağlı değil;
 * DÖNEM satırları görünen döneme (gün · hafta · ay) göre hesaplanır ve alt yazıları dönemin adıdır
 * (`r.label`: "Bu hafta", "14–20 Ara"). Sıfırın bilgi olmadığı satırlar (kendi iznim, görev,
 * kutlama, yanıt bekleyen davet) sıfırken yazılmaz, panel sessiz kalır; ekip, toplantı ve tatil
 * sıfırı da söyler ("bu hafta kimse izinde değil" bilgidir).
 */

const nf = (n, locale) => getNumberFormat(locale, { maximumFractionDigits: 1 }).format(n)
const plural = (t, locale, base, n) => t(pluralKey(base, locale, n), { n: nf(n, locale) })
const days = (t, locale, n) => countText(t, locale, "selfService.days", n)

const row = (id, tone, icon, title, sub, action) => ({
  id,
  tone,
  icon,
  title,
  sub,
  ...(action ? { action } : {}),
})

/**
 * Bakiye satırları. `stats`: `leaveStats` çıktısı (izin kaynağı okunamadıysa null); bakiye
 * okunamadıysa "0 gün" yerine "Bakiye okunamadı".
 */
function balanceRows({ t, locale, stats }) {
  if (!stats) return []
  const rows = [
    stats.free == null
      ? row(
          "available",
          "ok",
          "check",
          t("calendar.page.stat.noBalance"),
          t("calendar.page.stat.noBalanceSub"),
        )
      : stats.free < 0
        ? // Bakiye aşıldı: eksi sayı ("−16,5 kullanılabilir") yerine açık cümle; RTL'de eksi işareti de yerini şaşırmaz.
          row(
            "available",
            "warn",
            "clock",
            t("calendar.page.stat.overdrawn", { days: days(t, locale, -stats.free) }),
            t("calendar.page.stat.overdrawnSub"),
          )
        : row(
            "available",
            "ok",
            "check",
            t("calendar.page.stat.available", { days: days(t, locale, stats.free) }),
            t("calendar.page.stat.availableSub"),
          ),
    row(
      "pending",
      "warn",
      "clock",
      plural(t, locale, "calendar.page.unit.pending", stats.pending),
      t("calendar.page.stat.pendingSub"),
    ),
  ]
  if (stats.claim != null)
    rows.push(
      row(
        "claim",
        "teamLeave",
        "calendar",
        t("calendar.page.stat.claim", { days: days(t, locale, stats.claim) }),
        t("calendar.page.stat.claimSub"),
      ),
    )
  return rows
}

/**
 * Dönem satırları, `ids` sırasıyla (`range: true`: telefon çubuğu ilk satırda dönemi de yazar).
 * `r`: `{ label, myLeave, away, meetings, awaiting, tasks,
 * celebrations, holidays }` — kendi izin günlerim · ekipten izinde kişi · `{ count, hours }` ·
 * yanıt bekleyen davet · bitmemiş görev · kutlama · resmî tatil; okunamayan kaynak null.
 */
function rangeRows({ t, locale, r }, ids) {
  const sub = r.label
  const rows = {
    myLeave: () =>
      r.myLeave > 0 &&
      row(
        "myLeave",
        "myLeave",
        "leave",
        t("calendar.page.stat.myLeave", { days: days(t, locale, r.myLeave) }),
        sub,
      ),
    team: () =>
      r.away != null &&
      row(
        "team",
        "celebration",
        "people",
        t("calendar.page.stat.teamAway", {
          people: plural(t, locale, "calendar.page.unit.people", r.away),
        }),
        sub,
      ),
    meetings: () =>
      r.meetings != null &&
      row(
        "meetings",
        "meeting",
        "calendar",
        r.meetings.count
          ? t("calendar.page.stat.meetings", {
              meetings: plural(t, locale, "calendar.page.unit.meetings", r.meetings.count),
              hours: t("selfService.hours", { n: nf(r.meetings.hours, locale) }),
            })
          : plural(t, locale, "calendar.page.unit.meetings", 0),
        sub,
      ),
    awaiting: () =>
      r.awaiting > 0 &&
      row(
        "awaiting",
        "warn",
        "clock",
        plural(t, locale, "calendar.page.unit.awaiting", r.awaiting),
        sub,
      ),
    tasks: () =>
      r.tasks > 0 &&
      row(
        "tasks",
        "task",
        "task",
        t("calendar.page.stat.tasks", {
          tasks: plural(t, locale, "calendar.page.unit.tasks", r.tasks),
        }),
        sub,
      ),
    celebrations: () =>
      r.celebrations > 0 &&
      row(
        "celebrations",
        "celebration",
        "cake",
        plural(t, locale, "calendar.page.unit.celebrations", r.celebrations),
        sub,
      ),
    holidays: () =>
      r.holidays != null &&
      row(
        "holidays",
        "holiday",
        "flag",
        plural(t, locale, "calendar.page.unit.holidays", r.holidays),
        sub,
        t("calendar.page.stat.holidayList"),
      ),
  }
  return ids
    .map((id) => rows[id]())
    .filter(Boolean)
    .map((x) => ({ ...x, range: true }))
}

/**
 * Self Servis açıkken: bakiye (kullanılabilir gün · bekleyen talep · toplam hak), sonra dönem
 * (kendi iznim · ekip · toplantı · görev · kutlama · tatil). `stats`: `leaveStats` çıktısı.
 */
export function leaveRows({ t, locale, stats, r }) {
  return [
    ...balanceRows({ t, locale, stats }),
    ...rangeRows({ t, locale, r }, [
      "myLeave",
      "team",
      "meetings",
      "tasks",
      "celebrations",
      "holidays",
    ]),
  ]
}

/** Self Servis kapalıyken izin satırları yok: toplantı · yanıt bekleyen davet · görev · kutlama · tatil. */
export function meetingRows({ t, locale, r }) {
  return rangeRows({ t, locale, r }, ["meetings", "awaiting", "tasks", "celebrations", "holidays"])
}
