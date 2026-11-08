import { useMemo } from "react"
import Attachment01Icon from "@hugeicons/core-free-icons/Attachment01Icon"
import Invoice03Icon from "@hugeicons/core-free-icons/Invoice03Icon"
import { HugeiconsIcon } from "@hugeicons/react"
import { ReceiptPrinter } from "@/components/ui/receipt-printer"
import { useLocale } from "@/hooks/useLocale"
import { titleOf } from "@/lib/expenseHead"
import { ownerOf } from "@/features/selfservice/lib/expenseHeadView"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { optionLabel, PROMPT_TEMPLATES } from "@/lib/promptTemplates"
import { parseAmount } from "@/lib/requestForm"
import { expenseSummary } from "@/features/selfservice/lib/requestFormItems"
import { countText, day, money } from "../../kinds"
import { capFirst } from "../formUi"

const COMPANY_SLOT = PROMPT_TEMPLATES.expense.slots.company
const STAMP = {
  day: "numeric",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
}

/**
 * Gözden geçirmenin sol yarısı: gönderilecek masrafın FİŞİ (`ReceiptPrinter`, EasyUI'nin
 * yazıcısı). Kâğıdın başında açıklama ve şirket, kimin adına · tarih · eklenen fiş sayısı, kalemler
 * (kategori, tutar; altında tarih ve açıklama), kalem sayısı ve para birimine göre toplam. Henüz
 * numara yok: barkodun altında "Taslak". Yazıcının "Tekrar yazdır / Kopyala" düğmeleri yok:
 * bölme fişe kalsın.
 */
export function ReviewReceipt({ form, owners }) {
  const { t, locale } = useLocale()
  const { rows, receipts } = form.expense
  const { head } = form
  const up = (key, vars) => t(key, vars).toLocaleUpperCase(locale)

  const data = useMemo(() => {
    const company = capFirst(optionLabel(t, COMPANY_SLOT, head.company), locale)
    const title = titleOf(head, form.defaultTitle)
    const owner =
      ownerOf(head, owners.owners)?.name ?? (owners.name || t("selfService.form.head.self"))
    const stamp = getDateTimeFormat(locale, STAMP).format(new Date()).replace(", ", " · ")
    const items = rows.map((r) => {
      const v = r.values
      return {
        name: v.category,
        price: money(parseAmount(v.amount, locale), v.currency ?? "TRY", locale),
        description: [day(v.date, locale, false), String(v.note ?? "").trim()]
          .filter(Boolean)
          .join(" · "),
      }
    })
    const { totals } = expenseSummary(rows, locale)
    const lines = totals.map(([cur, sum]) => ({
      label:
        totals.length > 1
          ? t("selfService.receipt.totalCur", { cur })
          : t("selfService.receipt.total"),
      value: money(sum, cur, locale),
    }))
    return { company, title, owner, stamp, items, lines }
  }, [rows, head, form.defaultTitle, owners.owners, owners.name, t, locale])

  return (
    <ReceiptPrinter
      lang={locale}
      model="TYRO · POS"
      merchant={data.title}
      merchantSubtext={data.company}
      merchantLogo={<HugeiconsIcon icon={Invoice03Icon} strokeWidth={1.9} className="size-3.5" />}
      meta={[
        { label: up("selfService.receipt.owner"), value: data.owner, strong: true },
        { label: up("selfService.receipt.date"), value: data.stamp },
        {
          label: up("selfService.receipt.files"),
          value: receipts.length
            ? countText(t, locale, "selfService.expense.summary.receipts", receipts.length)
            : "—",
          icon: Attachment01Icon,
        },
      ]}
      items={data.items}
      summary={[{ label: up("selfService.receipt.lines"), value: String(rows.length) }]}
      totals={data.lines.map((l) => ({ ...l, label: l.label.toLocaleUpperCase(locale) }))}
      barcodeText={up("selfService.receipt.draft")}
      message={t("selfService.receipt.message")}
      stamp={t("selfService.receipt.stamp")}
      showActions={false}
      statusTitle={t("selfService.receipt.status")}
      statusSubtitle={t("selfService.receipt.statusSub")}
      labels={{
        region: t("selfService.receipt.region"),
        printing: t("selfService.receipt.printing"),
        ready: t("selfService.receipt.ready"),
        idle: t("selfService.receipt.idle"),
        item: t("selfService.receipt.item"),
        price: t("selfService.receipt.price"),
      }}
    />
  )
}
