import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import PrinterIcon from "@hugeicons/core-free-icons/PrinterIcon"
import { useLocale } from "@/hooks/useLocale"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { detailItems } from "../detail/KindFields"
import { useRecordForm } from "../detail/useRecordForm"
import { leaveProgress } from "../detail/window/progressModel"
import { countText, day, range } from "../kinds"
import { describe } from "../recordText"
import { StatusPill } from "../StatusPill"

const BACK = { weekday: "long", day: "numeric", month: "short" }
const MAX_FACTS = 5

/** Panelin bilgileri: kayıtta BULUNAN alanlar (uydurma yok), en çok beş satır. */
function factsOf(record, t, locale) {
  const facts = []
  if (record.kind === "leave") {
    facts.push([t("selfService.field.date"), range(record.start, record.end, locale)])
    const back = leaveProgress(record)?.steps.find((s) => s.id === "back")?.date
    if (back)
      facts.push([t("selfService.window.leave.back"), getDateTimeFormat(locale, BACK).format(back)])
  } else {
    if (record.number) facts.push([t("selfService.field.number"), record.number])
    if (record.date) facts.push([t("selfService.field.date"), day(record.date, locale)])
    if (record.kind === "expense" && record.lines?.length)
      facts.push([
        t("selfService.cards.lines"),
        countText(t, locale, "selfService.expense.lines", record.lines.length),
      ])
  }
  for (const item of detailItems(record, t, locale)) {
    if (facts.length >= MAX_FACTS) break
    if (item.wide || typeof item.value !== "string") continue
    facts.push([item.label, item.value])
  }
  return facts
}

/**
 * SEÇİLİ KAYIT — listenin yanındaki panel (Kartlar düzeni, geniş kap): satıra basınca kaydın özeti
 * burada görünür; tam ayrıntı ve form var olan kayıt penceresinde ("Formu aç"). Eylemler gerçek
 * olanlar: Formu aç (kayıt penceresi), Yazdır (formu olan kayıtta, `useRecordForm`), TYRO'ya sor.
 * İçerik kayıt değişince yumuşakça yenilenir (`key`).
 */
export function RecordAside({ ref, record, person, onOpen, onAsk }) {
  const { t, locale } = useLocale()
  const form = useRecordForm(record, person)
  const { title, value, amounts } = describe(record, t, locale)
  // Çok para birimli masrafta başlıkta ilk tutar; gerisi altında küçük satır.
  const lead = amounts?.length ? amounts[0] : value
  const rest = amounts?.slice(1) ?? []
  const facts = factsOf(record, t, locale)
  return (
    <aside ref={ref} aria-label={t("selfService.cards.picked")} className="ssc-aside">
      <div className="ssc-aside-in">
        <p className="ssc-eyebrow">{t("selfService.cards.picked")}</p>
        <h3 data-private="" title={title} className="ssc-aside-title">
          {title}
          {lead && lead !== "—" ? ` · ${lead}` : ""}
        </h3>
        {rest.length > 0 && (
          <p data-private="" className="ssc-kpi-note">
            {rest.map((a) => `+ ${a}`).join("  ")}
          </p>
        )}
        <StatusPill status={record.status} className="self-start" />
        {facts.length > 0 && (
          <dl data-private="" className="ssc-facts ssc-aside-facts">
            {facts.map(([label, text]) => (
              <div key={label}>
                <dt>{label}</dt>
                <dd title={text}>{text}</dd>
              </div>
            ))}
          </dl>
        )}
        <div className="ssc-actions">
          <button type="button" className="ssc-btn" onClick={() => onOpen(record)}>
            {t("selfService.cards.openForm")}
          </button>
          {form.available && (
            <button
              type="button"
              className="ssc-btn"
              aria-label={t("selfService.form.printAria")}
              onClick={form.print}
            >
              <HugeiconsIcon icon={PrinterIcon} strokeWidth={1.9} aria-hidden="true" />
              {t("selfService.form.print")}
            </button>
          )}
          {onAsk && (
            <button type="button" className="ssc-btn" onClick={() => onAsk(record)}>
              <HugeiconsIcon icon={AiChat02Icon} strokeWidth={1.9} aria-hidden="true" />
              {t("selfService.askTyro")}
            </button>
          )}
        </div>
      </div>
      {form.dialog}
    </aside>
  )
}
