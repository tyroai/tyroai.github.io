import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { pluralKey } from "@/lib/intl-cache"
import {
  countText,
  day,
  money,
  moneyShort,
  moneyShortOptions,
  number,
  TABS,
  totalsList,
} from "../kinds"
import { tileFacts } from "./tileFacts"

const DAYS = { maximumFractionDigits: 2 }

/**
 * Özetin üç kutusu (izin bakiyesi · dönemin masrafları · dönemin iş avansları) — geniş özet
 * kartı (`SummaryTiles`) ve telefonun üç değeri (`PhoneSummary`) aynı veriyi çizer.
 * Kutu: `{ tab, title, short, value, counter, caption, note?, hint?, progress? }`
 * (`progress`: izin kutusunda kullanılan / hak, 0–1); `off`: okunamayan
 * bölümün nedeni (anahtar), `facts`: ayrıntının verisi, `period`: "2025" / "Tüm yıllar".
 */
export function useSummaryTiles({ data, summary, year, accrual = null }) {
  const { t, locale } = useLocale()
  const facts = useMemo(() => tileFacts(data, summary, year), [data, summary, year])
  const period = year ?? t("selfService.tile.allYears")
  const [leave, expense, advance] = TABS
  const balance = data?.balance
  const ex = totalsList(summary?.expense.totals)
  const av = totalsList(summary?.advance.totals)
  // Okunamayan bölümde tutar değil "—": sıfır, "hiç masrafın yok" demek olurdu. Masraf
  // durumları okunamadıysa toplam taslak ve reddedilmiş raporları da içerebilir: yine "—".
  const statusFailed = Boolean(data?.failed?.includes("expenseStatus"))
  // Rol o tabloyu okutmuyorsa "Okunamadı" değil "Yetki yok": yenilemek çözmez, BT çözer.
  const unread = (name) =>
    data?.denied?.[name] ? "selfService.tile.denied" : "selfService.tile.failed"
  const off = {
    expense: !data?.expenses ? unread("expenses") : statusFailed && "selfService.tile.statusFailed",
    advance: !data?.advances && unread("advances"),
  }
  const firstMoney = (list, why) =>
    why
      ? "—"
      : list.length
        ? moneyShort(list[0][1], list[0][0], locale)
        : moneyShort(0, "TRY", locale)
  // Sayaç: yalnız sayı varken; birim kalıbı ("{n} gün") sayının önü ve ardı olarak bölünür.
  const moneyCounter = (list, why) => {
    if (why) return null
    const [currency, amount] = list[0] ?? ["TRY", 0]
    return { value: amount, options: moneyShortOptions(amount, currency) }
  }
  const remain = balance?.remain ?? null
  const [daysBefore, daysAfter] = t(pluralKey("selfService.days", locale, remain ?? 0), {
    n: "\u0000",
  }).split("\u0000")
  // Kısaltılmış değerin ("₺12,3 Mn") tam tutarı: ipucu ve ekran okuyucu için; kısaltma yoksa boş.
  const full = (list, why, short) => {
    if (why || !list.length) return undefined
    const exact = money(list[0][1], list[0][0], locale)
    return exact === short ? undefined : exact
  }
  const restMoney = (list) =>
    list
      .slice(1)
      .map(([c, a]) => money(a, c, locale))
      .join(" · ")
  const caption = (part, list, why) => {
    if (why) return t(why)
    const pending = part?.pending ?? 0
    const rest = restMoney(list)
    // İkinci para birimi varsa baş onun tutarı; onaydakiler yine yazılır (toplama girmiyorlar).
    const head = rest
      ? [rest, pending ? t("selfService.tile.pendingOnly", { n: pending }) : ""]
      : [t("selfService.tile.countPending", { n: part?.count ?? 0, pending })]
    // Onaydakiler ayrıca yazıldı: "toplam dışı" geri kalanlar (gönderilmemiş, reddedilen…).
    const excluded = Math.max(0, (part?.excluded.count ?? 0) - pending)
    return [...head, excluded ? t("selfService.tile.excluded", { n: excluded }) : ""]
      .filter(Boolean)
      .join(" · ")
  }
  const hint = (part, why) =>
    why === "selfService.tile.statusFailed"
      ? t("selfService.statusFailed")
      : !why && (part?.excluded.count || part?.pending)
        ? t("selfService.tile.excludedHint")
        : undefined

  const tiles = [
    {
      tab: leave,
      title: t("selfService.tile.balance"),
      short: t("selfService.tile.balanceShort"),
      value: remain != null ? countText(t, locale, "selfService.days", remain) : "—",
      counter:
        balance?.remain != null
          ? {
              value: balance.remain,
              options: DAYS,
              prefix: daysBefore,
              suffix: daysAfter ?? "",
            }
          : null,
      caption: balance
        ? t("selfService.tile.balanceCaption", {
            claim: number(balance.claim, locale),
            used: number(balance.used, locale),
          })
        : t("selfService.tile.noBalance"),
      note: accrual
        ? t("selfService.accrual.caption", {
            date: day(accrual.date, locale, false),
            n: number(accrual.days, locale),
          })
        : null,
      progress: balance?.claim > 0 ? Math.min((balance.used ?? 0) / balance.claim, 1) : null,
    },
    {
      tab: expense,
      title: t("selfService.tile.expenses", { year: period }),
      short: t("selfService.tabShort.expense"),
      value: firstMoney(ex, off.expense),
      full: full(ex, off.expense, firstMoney(ex, off.expense)),
      counter: moneyCounter(ex, off.expense),
      caption: caption(summary?.expense, ex, off.expense),
      hint: hint(summary?.expense, off.expense),
    },
    {
      tab: advance,
      title: t("selfService.tile.advances", { year: period }),
      short: t("selfService.tabShort.advance"),
      value: firstMoney(av, off.advance),
      full: full(av, off.advance, firstMoney(av, off.advance)),
      counter: moneyCounter(av, off.advance),
      caption: caption(summary?.advance, av, off.advance),
      hint: hint(summary?.advance, off.advance),
    },
  ]
  return { tiles, off, facts, period, balance }
}
