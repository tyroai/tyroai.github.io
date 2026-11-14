import { useRef, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import ArrowDown01Icon from "@hugeicons/core-free-icons/ArrowDown01Icon"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { ownerOf } from "@/features/selfservice/lib/expenseHeadView"
import { cn } from "@/lib/utils"
import { countText } from "../../kinds"
import { NextStepsList } from "../NextStepsList"
import { SummaryHero } from "./summary/SummaryHero"
import { SummaryParts } from "./summary/SummaryParts"
import { COUNT, RULE, cell } from "./summary/summaryUi"
import { useExpenseSummary } from "./summary/useExpenseSummary"
import { attentionCount, warningCount } from "./summary/warnCount"

/** Kartın altında kapalı duran "ⓘ Ne olacak?" satırı: basınca dört adım açılır (`via`: "chat" · "erp"). */
function HowNext({ via }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  return (
    <div className={cn(RULE, "border-t")}>
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex min-h-12 w-full items-center gap-2 px-5 text-start text-[0.8125rem] font-semibold text-foreground/80 transition hover:bg-foreground/[0.025] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
      >
        <HugeiconsIcon
          icon={InformationCircleIcon}
          aria-hidden="true"
          className="size-4 shrink-0 text-brand-ink"
          strokeWidth={1.9}
        />
        {t("selfService.form.next.title")}
        <HugeiconsIcon
          icon={ArrowDown01Icon}
          aria-hidden="true"
          strokeWidth={2}
          className={cn("ms-auto size-3.5 transition-transform", open && "rotate-180")}
        />
      </button>
      {open && <NextStepsList tone="light" className="px-5 pb-4" via={via} />}
    </div>
  )
}

/**
 * TELEFONDA MASRAFIN AYRINTI DÜĞMESİ — alt şeritte Anlat'ın solunda, gövdedeki "Masraf özeti"
 * kartının ve "ⓘ Ne olacak?" düğmesinin yerine (gövde kalemlere kalsın). Eksik alan ya da uyarı
 * yoksa ⓘ; varsa sarı uyarı simgesi ve sayısı (`attentionCount`). Basınca düğmenin üstünde özet
 * kartı açılır: toplam, kalem ve fiş sayısı, tarih aralığı, eksikler (alana götüren düğmeler),
 * uyarılar ve fişler, kategoriler, yönetici (`SummaryParts`; masaüstündeki özetle aynı hesap,
 * `useExpenseSummary`) ve altta kapalı "Ne olacak?". Bir alana götüren düğmeye basılınca kart
 * kapanır, odak o alanda kalır. `owners`: "Kimin adına" listesi (başkası adına yönetici yok);
 * `history`: kişinin masraf kayıtları (ERP'de eşi olabilecek kalemler); `via`: "Gönder"in yolu.
 */
export function ExpenseDetails({ form, idBase, owners, history, via = "chat" }) {
  const { t, locale } = useLocale()
  const [open, setOpen] = useState(false)
  const jumped = useRef(false)
  const summary = useExpenseSummary({ form, idBase, history })
  const { info } = summary
  const missing = info.missing.length
  const warnings = warningCount(info)
  const attention = attentionCount(info)
  const status =
    [
      missing > 0 && countText(t, locale, "selfService.expense.summary.missingCount", missing),
      warnings > 0 && countText(t, locale, "selfService.expense.summary.warnCount", warnings),
    ]
      .filter(Boolean)
      .join(" · ") || t("selfService.expense.summary.ready")
  const label = `${t("selfService.form.details")} · ${status}`

  return (
    <Popover
      open={open}
      onOpenChange={(o) => {
        if (o) jumped.current = false
        setOpen(o)
      }}
    >
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          className={cn(
            "relative grid size-12 shrink-0 place-items-center rounded-full border shadow-xs transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=open]:bg-foreground/[0.06]",
            attention
              ? "border-warning/45 bg-warning/[0.12] text-warning-ink"
              : "border-border bg-background text-brand-ink",
          )}
        >
          <HugeiconsIcon
            icon={attention ? Alert02Icon : InformationCircleIcon}
            aria-hidden="true"
            className="size-5"
            strokeWidth={1.9}
          />
          {attention > 0 && (
            <span
              aria-hidden="true"
              className={cn(
                COUNT,
                "absolute -end-1 -top-1 bg-warning text-[oklch(0.25_0.06_60)] ring-2 ring-background",
              )}
            >
              {attention}
            </span>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="top"
        align="start"
        sideOffset={12}
        collisionPadding={12}
        aria-label={t("selfService.expense.summary.title")}
        // Alana götürülünce odak orada kalır: kart kapanırken düğmeye dönmesin.
        onCloseAutoFocus={(e) => jumped.current && e.preventDefault()}
        className="max-h-[min(var(--radix-popover-content-available-height),34rem)] w-[min(24rem,calc(100vw-1.5rem))] gap-0 overflow-y-auto overscroll-contain p-0 text-sm"
      >
        <SummaryHero side info={info} className={cell(true)} />
        <SummaryParts
          side
          summary={summary}
          idBase={idBase}
          onBehalf={Boolean(ownerOf(form.head, owners))}
          cls={() => cn(cell(true), RULE, "border-t")}
          onJump={() => {
            jumped.current = true
            setOpen(false)
          }}
        />
        <HowNext via={via} />
      </PopoverContent>
    </Popover>
  )
}
