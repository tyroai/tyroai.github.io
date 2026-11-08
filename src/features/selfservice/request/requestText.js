import { locationLabel } from "@/lib/advanceLocations"
import { formatMoney, parseAmount } from "@/lib/amountParse"
import { onBehalfText } from "@/features/selfservice/lib/expenseHeadView"
import { leaveWorkdays } from "@/lib/requestForm"
import { expenseSummary } from "@/features/selfservice/lib/requestFormItems"
import { countText, money, moneyShort, number, range } from "../kinds"
import { capFirst } from "./formUi"

/**
 * Başlığın bağlam çipi: izinde kalan yıllık izin, avansta şirket. Masrafta çip yok: şirket formun
 * başlığında seçiliyor (`ExpenseHead`).
 */
export function requestContext(t, locale, kind, { balance, company }) {
  if (kind === "leave") {
    const remain = balance?.remain
    if (remain == null) return null
    return t("selfService.form.ctx.balance", {
      days: countText(t, locale, "selfService.days", remain),
    })
  }
  if (kind === "expense") return null
  return company ? t("selfService.form.ctx.company", { name: company }) : null
}

/** Masraf özeti metni: "3 kalem · ₺4.250 + $120" (`short`) ya da tam tutarlarla. */
export function summaryText(t, locale, rows, short = true) {
  const { count, totals } = expenseSummary(rows, locale)
  const lines = countText(t, locale, "selfService.form.lineCount", count)
  if (!totals.length) return { lines, sums: "" }
  const fmt = short ? moneyShort : money
  return { lines, sums: totals.map(([cur, sum]) => fmt(sum, cur, locale)).join(" + ") }
}

/**
 * Masraf penceresinin başlık bağlamı: gözden geçirmede akışın yeri, değilse kalem sayısı
 * ("3 kalem"); başkası adına girilirse başında kimin adına olduğu ("Kerem Aydın adına · 3
 * kalem"). Toplam burada yok: özet panelinde ve alt şeritte — aynı sayı ekranda üç kez durmasın.
 * `owners`: "Kimin adına" listesi.
 */
export function expenseContext(t, locale, { form, flow, owners }) {
  const base = flow.review
    ? t("selfService.expense.reviewing")
    : countText(t, locale, "selfService.form.lineCount", form.expense.rows.length)
  const behalf = onBehalfText(t, form.head, owners)
  return behalf ? `${behalf} · ${base}` : base
}

/**
 * Silme onayında kaybolacak olan, tek satırda: masraf "3 kalem · ₺4.150,00 · 2 fiş", izin
 * "26–30 Eki 2026 · 3,5 iş günü", avans "₺15.000,00 · Fuar · Hamburg". Boş parça yazılmaz;
 * söylenecek bir şey yoksa null.
 */
export function discardSummary(t, locale, kind, form) {
  const join = (parts) => parts.filter(Boolean).join(" · ") || null
  if (kind === "expense") {
    const { lines, sums } = summaryText(t, locale, form.expense.rows, false)
    const n = form.expense.receipts.length
    return join([
      lines,
      sums,
      n > 0 && countText(t, locale, "selfService.expense.summary.receipts", n),
    ])
  }
  const v = form.values
  if (kind === "leave") {
    if (!v.start) return null
    const days = leaveWorkdays(v.start, v.end)
    return join([
      range(v.start, v.end ?? v.start, locale),
      days != null && `${number(days, locale)} ${t("selfService.form.workdays")}`,
    ])
  }
  const got = parseAmount(String(v.amount ?? ""), locale)
  return join([
    got?.value != null && formatMoney(got.value, got.currency ?? v.currency, locale),
    v.purpose && capFirst(t(`myspace.purpose.${v.purpose}`), locale),
    v.destination && locationLabel(t, v.destination),
  ])
}
