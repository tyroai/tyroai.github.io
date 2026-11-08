import { useMemo, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import { useLocale } from "@/hooks/useLocale"
import { advanceInsights } from "@/features/selfservice/lib/advanceInsights"
import { cn } from "@/lib/utils"
import { countText } from "../../../kinds"
import { ApproverRow } from "../../ApproverRow"
import { CARD } from "../../expense/summary/summaryUi"
import { AmountFigure } from "./AmountFigure"
import { MissingFields } from "./MissingFields"
import { NEED_INK, OK_INK, SECTION, TOGGLE } from "./panelUi"
import { LastAdvance, OpenAdvances, Outcomes } from "./SummaryRows"

/**
 * AVANS ÖZETİ — izin formunun etki kartının, masraf özetinin avanstaki karşılığı; canlı ve
 * yalnız formdan ve kişinin avans kayıtlarından (`features/selfservice/lib/advanceInsights`, `useAdvanceHints`):
 * tutar nasıl anlaşıldıysa, amaç · yer, talep tarihi; kapatılmamış avanslar; "Eksikler" (alana
 * götüren çipler); şirket, ödemenin ve belgenin sonucu; son avans; yönetici. ("Ne olacak?" alt
 * şeridin bilgi düğmesinde.)
 * Geniş pencerede (form ≥ 52rem) girişlerin sağında yapışık sütun, hepsi açık. Dar pencerede ve
 * telefonda girişlerin altında sıkı kart: tutar, kapatılmamış avans ve durum satırı ("2 eksik
 * alan · Ayrıntı"); ayrıntısı açılır. Tek DOM, iki boy kabın sorgusuyla (`@[52rem]/form`).
 * Telefonun özet adımında (`expanded`) ayrıntı hep açık, düğmesi yok.
 * Durum renkleri: eksik kırmızı (hafif; gönderme denenince koyulaşır), uyarı (kapatılmamış avans)
 * sarı, hazır yeşil. Eksik sayısı ekran okuyucuya kendiliğinden okunur; hata cümlesi ("Eksik ya
 * da hatalı alan: n") yalnız alt şeritte — ne yazılır ne okunur iki kez.
 */
export function AdvanceSummary({ form, idBase, hints, today, expanded = false }) {
  const { t, locale } = useLocale()
  const [open, setMore] = useState(false)
  // Telefonun özet adımında ayrıntı hep açık (`expanded`): adımın kendisi özet.
  const more = open || expanded
  const { values } = form
  const info = useMemo(() => advanceInsights(values, { locale }), [values, locale])
  const tried = form.invalid > 0
  const n = info.missing.length
  const detailsId = `${idBase}-summary-details`
  const status = n
    ? countText(t, locale, "selfService.expense.summary.missingCount", n)
    : t("selfService.advance.summary.ready")

  return (
    <section aria-label={t("selfService.advance.summary.title")} className={CARD}>
      <AmountFigure amount={info.amount} values={values} today={today} />
      <OpenAdvances list={hints.open} />
      <button
        type="button"
        aria-expanded={more}
        aria-controls={detailsId}
        onClick={() => setMore((v) => !v)}
        className={cn(TOGGLE, expanded && "hidden")}
      >
        <span
          className={cn(
            "flex min-w-0 flex-1 items-center gap-2 font-semibold",
            !n && OK_INK,
            n > 0 && NEED_INK,
          )}
        >
          {!n && (
            <HugeiconsIcon
              icon={CheckmarkCircle02Icon}
              aria-hidden="true"
              className="size-4 shrink-0"
              strokeWidth={2}
            />
          )}
          <span className="truncate">{status}</span>
        </span>
        <span className="flex shrink-0 items-center gap-1 font-semibold text-foreground/75">
          {t("selfService.form.details")}
          <HugeiconsIcon
            icon={ArrowDown01Icon}
            aria-hidden="true"
            strokeWidth={2}
            className={cn("size-3.5 transition-transform", more && "rotate-180")}
          />
        </span>
      </button>
      <div
        id={detailsId}
        className={cn(
          more ? "animate-in fade-in-0 duration-200 motion-reduce:animate-none" : "hidden",
          "@[52rem]/form:block",
        )}
      >
        <MissingFields items={info.missing} tried={tried} idBase={idBase} />
        <Outcomes company={info.company} values={values} />
        <LastAdvance last={hints.last} open={hints.open} />
        {hints.manager && (
          <div className={SECTION}>
            <ApproverRow manager={hints.manager} />
          </div>
        )}
      </div>
      <p aria-live="polite" className="sr-only">
        {tried ? "" : status}
      </p>
    </section>
  )
}
