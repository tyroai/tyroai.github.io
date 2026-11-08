import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import { useLocale } from "@/hooks/useLocale"
import { locationLabel } from "@/lib/advanceLocations"
import { formatMoney } from "@/lib/amountParse"
import { PROMPT_TEMPLATES } from "@/lib/promptTemplates"
import { cn } from "@/lib/utils"
import { day } from "../../../kinds"
import { capFirst } from "../../formUi"

// Rakam kutuya sığsın (masraf özetindeki gibi): en uzun yazının karakter sayısına göre kabın
// enine oranlı, üst sınır `max`. Bir karakter ~0,64em sayılır (rakam, simge, ayraç; payıyla).
const fit = (chars, max) =>
  `clamp(1.125rem, ${(100 / Math.max(chars * 0.64, 1)).toFixed(2)}cqi, ${max})`

// Amacın varsayılanı ("İş") yer yazılmadan tek başına yazılmaz: kişinin girdiği bir şey değil.
const DEFAULT_PURPOSE = PROMPT_TEMPLATES.advance.slots.purpose.default

const sameDay = (a, b) =>
  a instanceof Date && b instanceof Date && a.toDateString() === b.toDateString()

/** Büyük sayının yazısı ve altındaki not, tutarın okunuşuna göre (`readAdvanceAmount`). */
function figure(t, locale, amount) {
  const money = (n) => formatMoney(n, amount.currency, locale)
  if (amount.state === "ok") return { text: money(amount.value) }
  if (amount.state === "ambiguous")
    return {
      text: amount.options.map(money).join(" / "),
      note: t("selfService.advance.summary.ambiguous"),
    }
  if (amount.state === "unread")
    return { text: "—", muted: true, note: t("selfService.advance.summary.unread") }
  return { text: money(0), muted: true }
}

/**
 * Özetin başı: tutar nasıl anlaşıldıysa öyle (alana "15 bin" yazılırken "₺15.000,00"; iki anlamlı
 * yazıda iki aday — seçimi tutarın altında; boşken seçili para biriminde soluk sıfır — nasıl
 * yazılabileceği tutar alanının ⓘ balonunda), altında amaç · yer ve talep tarihi ("bugün, 17 Eki"). Tuş tuş değiştiği için
 * canlı bölge değil.
 */
export function AmountFigure({ amount, values, today }) {
  const { t, locale } = useLocale()
  const f = figure(t, locale, amount)
  const chars = Math.max(4, f.text.length)
  const where = values.destination ? locationLabel(t, values.destination) : ""
  const meta = [
    values.purpose &&
      (where || values.purpose !== DEFAULT_PURPOSE) &&
      capFirst(t(`myspace.purpose.${values.purpose}`), locale),
    where,
  ]
    .filter(Boolean)
    .join(" · ")
  const date = !(values.date instanceof Date)
    ? null
    : sameDay(values.date, today)
      ? t("selfService.advance.summary.today", { day: day(values.date, locale, false) })
      : day(values.date, locale)

  return (
    <div className="@container/hero px-4 pb-3.5 pt-3.5 @[52rem]/form:px-5 @[52rem]/form:pb-4 @[52rem]/form:pt-4.5">
      <p className="mb-1 text-[0.8125rem] font-medium text-muted-foreground">
        {capFirst(t("myspace.slot.amount"), locale)}
      </p>
      <p
        className={cn(
          "text-(length:--fig-sm) font-semibold leading-[1.15] tracking-[-0.025em] tabular-nums @[52rem]/form:text-(length:--fig)",
          f.muted && "text-muted-foreground",
        )}
        style={{ "--fig": fit(chars, "2.5rem"), "--fig-sm": fit(chars, "1.75rem") }}
      >
        {f.text}
      </p>
      {f.note && (
        <p className="mt-1.5 text-pretty text-[0.8125rem] leading-snug text-muted-foreground">
          {f.note}
        </p>
      )}
      {meta && <p className="mt-2.5 text-[0.8125rem] font-medium leading-snug">{meta}</p>}
      {date && (
        <p
          className={cn(
            "flex items-center gap-1.5 text-[0.8125rem] leading-snug text-muted-foreground tabular-nums",
            meta ? "mt-1" : "mt-2.5",
          )}
        >
          <HugeiconsIcon
            icon={Calendar03Icon}
            aria-hidden="true"
            className="size-3.5 shrink-0"
            strokeWidth={1.8}
          />
          {t("selfService.advance.summary.date", { when: date })}
        </p>
      )}
    </div>
  )
}
