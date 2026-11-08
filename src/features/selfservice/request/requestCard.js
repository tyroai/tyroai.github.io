import { formatMoney, parseAmount as readAmount } from "@/lib/amountParse"
import { SELF, titleOf } from "@/lib/expenseHead"
import { optionLabel, PROMPT_TEMPLATES } from "@/lib/promptTemplates"
import { leaveWorkdays } from "@/lib/requestForm"
import { number, range } from "../kinds"
import { capFirst } from "./formUi"
import { summaryText } from "./requestText"

const SLOTS = (key) => PROMPT_TEMPLATES[key].slots
const label = (t, locale, key, name, value) =>
  value == null ? null : capFirst(optionLabel(t, SLOTS(key)[name], value), locale)
const line = (parts) => parts.filter(Boolean).join(" · ")

/** Formdaki izin türünün adı ("Babalık izni"); ERP'nin adı farklı olabilir (TR03 "Doğum İzni"). */
export const leaveKindLabel = (t, locale, kind) => label(t, locale, "leaveRequest", "kind", kind)

/**
 * Sohbetteki talep kartının özeti (gönderim anında, kişinin dilinde): iki satır ve fiş sayısı.
 * İzin: "Yıllık izin · 26–30 Eki 2026" / "3,5 iş günü · bakiye 11 → 7,5"; avans: "₺15.000,00 ·
 * Fuar · Hamburg" / "DTRK · Banka · Belgeli"; masraf: "3 kalem · ₺4.150,00" / "Ayşe
 * Demir · TTEC · T TECH BUSINESS… · Ekim 26 | TYRO Self Servis | Ayşe Demir" (`me.name`:
 * "Kendim" yerine ad; şirket listedeki seçimi). Kartla birlikte sohbet geçmişine yazılır: düz JSON.
 */
export function requestCard(kind, { t, locale, form, owners = [], me = null, balance = null }) {
  const v = form.values
  if (kind === "leave") {
    const days = leaveWorkdays(v.start, v.end)
    const remain = v.kind === "annual" ? (balance?.remain ?? null) : null
    return {
      kind,
      facts: [
        line([label(t, locale, "leaveRequest", "kind", v.kind), range(v.start, v.end, locale)]),
        line([
          days != null && `${number(days, locale)} ${t("selfService.form.workdays")}`,
          days != null &&
            remain != null &&
            t("selfService.card.balance", {
              from: number(remain, locale),
              to: number(remain - days, locale),
            }),
        ]),
      ],
      receipts: 0,
    }
  }
  if (kind === "advance") {
    const got = readAmount(String(v.amount ?? ""), locale)
    return {
      kind,
      facts: [
        line([
          got?.value != null && formatMoney(got.value, got.currency ?? v.currency, locale),
          label(t, locale, "advance", "purpose", v.purpose),
          String(v.destination ?? "").trim(),
        ]),
        line([
          v.company,
          label(t, locale, "advance", "payment", v.payment),
          label(t, locale, "advance", "document", v.document),
        ]),
      ],
      receipts: 0,
    }
  }
  const { rows } = form.expense
  const sum = summaryText(t, locale, rows, false)
  const head = form.head
  const owner =
    head.owner === SELF
      ? me?.name || t("selfService.form.head.self")
      : (owners.find((o) => o.email === head.owner)?.name ?? head.owner)
  const company = label(t, locale, "expense", "company", head.company)
  return {
    kind,
    facts: [line([sum.lines, sum.sums]), line([owner, company, titleOf(head, form.defaultTitle)])],
    // Fişler masrafın başlığında: tek liste.
    receipts: form.expense.receipts.length,
  }
}
