import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import Clock01Icon from "@hugeicons/core-free-icons/Clock01Icon"
import { useLocale } from "@/hooks/useLocale"
import { openTotals } from "@/features/selfservice/lib/advanceInsights"
import { formatMoney } from "@/lib/amountParse"
import { cn } from "@/lib/utils"
import { countText, day } from "../../../kinds"
import { capFirst } from "../../formUi"
import { choiceIcon } from "../advanceLooks"
import { SECTION } from "./panelUi"

/** Bir bilgi satırı: ikon · metin (+ altında not). */
function Row({ icon, note, className, children }) {
  return (
    <div className={cn("flex items-start gap-3 py-1", className)}>
      <HugeiconsIcon
        icon={icon}
        aria-hidden="true"
        className="mt-0.5 size-4 shrink-0 text-muted-foreground"
      />
      <div className="min-w-0 flex-1 text-[0.8125rem] leading-snug">
        <p className="font-medium">{children}</p>
        {note && <p className="mt-0.5 text-[0.75rem] text-muted-foreground">{note}</p>}
      </div>
    </div>
  )
}

/**
 * Kapatılmamış avanslar (ERP'nin mahsup edilmemiş kalanı): tek avansta numara · yer · kalan,
 * birden çokta sayı ve para birimine göre toplamlar. Bilgi verir; formu engellemez.
 */
export function OpenAdvances({ list }) {
  const { t, locale } = useLocale()
  if (!list.length) return null
  const first = list[0]
  const text =
    list.length === 1
      ? t("selfService.advance.openOne", {
          what: [
            first.number,
            first.location,
            t("selfService.advance.left", {
              amount: formatMoney(first.balance, first.currency, locale),
            }),
          ]
            .filter(Boolean)
            .join(" · "),
        })
      : countText(t, locale, "selfService.advance.openMany", list.length, {
          amounts: openTotals(list)
            .map(([cur, n]) => formatMoney(n, cur, locale))
            .join(" + "),
        })
  return (
    <p
      role="note"
      className={cn(
        SECTION,
        "flex items-start gap-2.5 bg-warning/[0.1] text-[0.8125rem] leading-snug text-warning-ink",
      )}
    >
      <HugeiconsIcon icon={Alert02Icon} aria-hidden="true" className="mt-0.5 size-4 shrink-0" />
      <span className="min-w-0">{text}</span>
    </p>
  )
}

/**
 * Seçimlerin sonucu: yansıtma şirketi (kod · unvan), ödemenin ve belgenin ne demek olduğu.
 * Şirket seçilmemişse satırı yok: "Eksikler" çipi zaten söylüyor. Ödeme ve belge sonucu karoda
 * yalnız ⓘ balonunda (`Segmented`); burada her boyda yazılı.
 */
export function Outcomes({ company, values }) {
  const { t, locale } = useLocale()
  if (!company && !values.payment && !values.document) return null
  const name = company ? [company.code, company.title].filter(Boolean).join(" · ") : null
  return (
    <div className={cn(SECTION, "py-2.5")}>
      {company && (
        <Row icon={Building03Icon} note={capFirst(t("myspace.slot.company"), locale)}>
          <span className="line-clamp-2" title={name}>
            {name}
          </span>
        </Row>
      )}
      {values.payment && (
        <Row icon={choiceIcon(values.payment)}>
          {t(`selfService.advance.effect.${values.payment}`)}
        </Row>
      )}
      {values.document && (
        <Row icon={choiceIcon(values.document)}>
          {t(`selfService.advance.effect.${values.document}`)}
        </Row>
      )}
    </div>
  )
}

/**
 * Son avans (iptal, ret ve taslak sayılmaz): tutar · amaç · yer, altında "Son avansın: tarih ·
 * numara" — tutarı yazarken karşılaştırılacak gerçek kayıt. Kapatılmamışsa yazılmaz: üstteki
 * uyarı aynı kaydı söylüyor (`open`).
 */
export function LastAdvance({ last, open = [] }) {
  const { t, locale } = useLocale()
  if (!last?.amount || open.some((a) => a.id === last.id)) return null
  const purpose = last.purposeKey
    ? capFirst(t(`myspace.purpose.${last.purposeKey}`), locale)
    : last.purpose
  const what = [formatMoney(last.amount, last.currency || "TRY", locale), purpose, last.location]
    .filter(Boolean)
    .join(" · ")
  const when = [last.date && day(last.date, locale), last.number].filter(Boolean).join(" · ")
  return (
    <div className={cn(SECTION, "py-2.5")}>
      <Row icon={Clock01Icon} note={t("selfService.advance.summary.last", { what: when })}>
        {what}
      </Row>
    </div>
  )
}
