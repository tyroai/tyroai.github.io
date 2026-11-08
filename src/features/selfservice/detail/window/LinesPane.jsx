import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import { useLocale } from "@/hooks/useLocale"
import { extraValue } from "@/lib/selfServiceFields"
import { lineInFacet } from "@/features/selfservice/lib/selfServiceFilters"
import { byCategory } from "@/lib/selfServiceReport"
import { day, money } from "../../kinds"
import { describe } from "../../recordText"
import { BreakdownList } from "../../report/BreakdownList"
import { categoryIcon } from "../icons"
import { lineFacts } from "../lineFacts"

// Satırda hep görünen ek alan sayısı; fazlası "Ayrıntı"da.
const SHOWN = 3
// Sıralama ekranda görünen adla (kategorisi boş kalem "Masraf" diye görünür).
const nameOf = (l) => String(l.categoryName || l.category || "")

function Line({ line, report, match }) {
  const { t, locale } = useLocale()
  const [more, setMore] = useState(false)
  const facts = lineFacts(line, report, t, locale)
  const vendor = (line.extra ?? []).find((x) => x.key === "vendor")?.value
  const sub = [day(line.date, locale), vendor].filter((x) => x && x !== "—").join(" · ")
  const shown = more ? facts : facts.slice(0, SHOWN)
  return (
    <li className="rw-line" data-match={match || undefined}>
      <span className="rw-line-icon" aria-hidden="true">
        <HugeiconsIcon icon={categoryIcon(line)} strokeWidth={1.7} />
      </span>
      <div className="rw-line-main">
        <p className="rw-line-title" lang="tr">
          {line.categoryName || line.category || t("selfService.expense.untitled")}
          {match && <span className="sr-only"> · {t("selfService.detail.lineMatch")}</span>}
        </p>
        {sub && (
          <p data-private="" className="rw-line-sub">
            {sub}
          </p>
        )}
        {line.explanation && (
          <p data-private="" className="rw-line-note" lang="tr">
            {line.explanation}
          </p>
        )}
        {facts.length > 0 && (
          <p data-private="" className="rw-line-facts">
            {shown.map((f) => (
              <span key={f.key} title={f.title}>
                <span className="rw-k">{f.label}</span> {f.value}
              </span>
            ))}
            {facts.length > SHOWN && (
              <button
                type="button"
                aria-expanded={more}
                onClick={() => setMore((v) => !v)}
                className="rw-more"
              >
                {t(more ? "selfService.window.lineLess" : "selfService.window.lineMore")}
                <HugeiconsIcon
                  icon={ArrowDown01Icon}
                  aria-hidden="true"
                  strokeWidth={2}
                  data-open={more || undefined}
                />
              </button>
            )}
          </p>
        )}
      </div>
      <p data-private="" className="rw-line-amount">
        {money(line.amount, line.currency, locale)}
      </p>
    </li>
  )
}

/**
 * Masraf raporunun kalemleri (pencerenin sağ sütunu): başlıkta "Tarihe göre / Kategorilere göre"
 * bölmeli denetimi (birden çok kategori varsa); kategoride önce dağılım (`BreakdownList`), kalemler
 * kategori sırasında. Satır: kategori simgesi, ad, tarih · firma, açıklama, ek alanlar (ilk üçü,
 * fazlası "Ayrıntı"da), sağda tutar; en altta toplam. Kategori filtresine uyan kalem marka tonunda.
 */
export function LinesPane({ record, facet }) {
  const { t, locale } = useLocale()
  const lines = useMemo(() => record.lines ?? [], [record.lines])
  const summary = useMemo(
    () => byCategory(lines.map((l) => ({ ...l, report: record.number }))),
    [lines, record.number],
  )
  const [mode, setMode] = useState("date")
  const byCat = mode === "category" && summary.rows.length > 1
  const ordered = useMemo(
    () => (byCat ? [...lines].sort((a, b) => nameOf(a).localeCompare(nameOf(b), "tr")) : lines),
    [byCat, lines],
  )
  const report = { company: record.company, costCenter: extraValue(record.extra, "costCenter") }
  const total = describe(record, t, locale).amounts ?? []
  return (
    <section className="rw-lines">
      <div className="rw-lines-head">
        <h3 className="rw-section">{t("selfService.expense.linesTitle", { n: lines.length })}</h3>
        {summary.rows.length > 1 && (
          <div
            role="radiogroup"
            aria-label={t("selfService.detail.byCategory")}
            className="rw-segmented"
          >
            {["date", "category"].map((m) => (
              <button
                key={m}
                type="button"
                role="radio"
                aria-checked={mode === m}
                onClick={() => setMode(m)}
              >
                {t(m === "date" ? "selfService.window.byDate" : "selfService.detail.byCategory")}
              </button>
            ))}
          </div>
        )}
      </div>
      {byCat && (
        <div className="rw-mix">
          <BreakdownList breakdown={summary} kind="money" lines labelLang="tr" />
        </div>
      )}
      <ul className="rw-line-list">
        {ordered.map((l) => (
          <Line
            key={l.id}
            line={l}
            report={report}
            match={Boolean(facet) && lineInFacet(l, facet)}
          />
        ))}
      </ul>
      {total.length > 0 && (
        <p className="rw-total">
          <span>{t("selfService.detail.total")}</span>
          <strong data-private="">{total.join(" + ")}</strong>
        </p>
      )}
    </section>
  )
}
