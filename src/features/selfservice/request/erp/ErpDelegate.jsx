import { useEffect, useId } from "react"
import { AlertDialog } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowTurnBackwardIcon from "@hugeicons/core-free-icons/ArrowTurnBackwardIcon"
import UserSwitchIcon from "@hugeicons/core-free-icons/UserSwitchIcon"
import SentIcon from "@hugeicons/core-free-icons/SentIcon"
import { InfoTip } from "@/components/common/InfoTip"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { DelegateFields } from "../delegate/DelegateFields"
import { useDelegateForm } from "../delegate/useDelegateForm"

const RULE = "border-black/[0.06] dark:border-white/[0.08]"
const BUTTON =
  "inline-flex h-12 items-center justify-center gap-2 whitespace-nowrap rounded-full px-6 text-[0.9375rem] font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-background [&_svg]:size-[1.125rem] [&_svg]:shrink-0"
const SECONDARY =
  "border border-border bg-background text-foreground/85 shadow-xs hover:bg-foreground/[0.04] hover:text-foreground focus-visible:ring-brand/40"
// Temsilcinin rengi: girişteki "Temsilci ata" düğmesi, başlık kutusu ve bu düğme aynı mor.
const VIOLET =
  "bg-violet-600 text-white shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_20px_-8px_rgb(76_29_149/0.55)] hover:bg-violet-700 focus-visible:ring-violet-500/40 active:scale-[0.98] dark:bg-violet-500 dark:hover:bg-violet-600"

const dateOf = (iso) => {
  const [y, m, d] = String(iso).split("-").map(Number)
  return new Date(y, m - 1, d)
}

/**
 * Temsilci ata — izin ERP'ye işlendikten sonra aynı pencerede: başlık (mor kutu, ad, "i"de kapsam),
 * temsilcinin ve tarihlerin karoları (`DelegateFields`; varsayılan iznin tarihleri), alt şerit:
 * Geri · Gönder. Gönderince plan `onSubmit`e gider; pencere yazımı ve sonucu kendi gösterir
 * (`ErpConfirm` + `useDelegateErp`, onaysız — form zaten bu pencerede). `plan`: işlenen iznin planı.
 */
export function ErpDelegate({ plan, onBack, onSubmit }) {
  const { t } = useLocale()
  const id = useId()
  const form = useDelegateForm({
    idBase: id,
    initial: {
      start: dateOf(plan.record.mserp_startdate),
      end: dateOf(plan.record.mserp_enddate),
    },
  })
  // Açılınca temsilci alanına odak (fareli cihazda; dokunmatikte klavye kendiliğinden açılmasın).
  useEffect(() => {
    if (window.matchMedia?.("(pointer: fine)").matches)
      document.getElementById(`${id}-who`)?.focus()
  }, [id])

  const submit = () => {
    const next = form.build()
    if (next) onSubmit(next)
  }

  return (
    <>
      <div
        className={cn("relative flex shrink-0 items-center gap-4 border-b px-7 pb-5 pt-7", RULE)}
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(60%_120%_at_8%_0%,rgb(139_92_246/0.12),transparent)]"
        />
        <span
          aria-hidden="true"
          className="relative grid size-12 shrink-0 place-items-center rounded-[0.9rem] bg-violet-500/[0.12] text-violet-700 ring-1 ring-violet-500/20 dark:bg-violet-400/[0.16] dark:text-violet-300"
        >
          <HugeiconsIcon icon={UserSwitchIcon} className="size-[1.375rem]" strokeWidth={1.9} />
        </span>
        <div className="relative min-w-0 flex-1">
          <div className="flex items-center gap-1">
            <AlertDialog.Title className="text-[1.375rem] font-semibold leading-tight tracking-[-0.02em]">
              {t("selfService.erp.delegate.title")}
            </AlertDialog.Title>
            <InfoTip text={t("selfService.erp.delegate.note")} />
          </div>
          <AlertDialog.Description className="mt-1 text-[0.9375rem] leading-snug text-muted-foreground">
            {t("selfService.erp.delegate.body")}
          </AlertDialog.Description>
        </div>
      </div>

      {/* Kısa gövde: kalıcı kaydırma oluğu sağ boşluğu soldan geniş gösteriyordu. */}
      <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-7 py-6 [scrollbar-gutter:auto]">
        <DelegateFields idBase={id} form={form} />
      </div>

      <div
        className={cn(
          "flex shrink-0 flex-col-reverse gap-2.5 border-t bg-background px-7 py-4 min-[480px]:flex-row min-[480px]:items-center",
          RULE,
        )}
      >
        <span className="hidden flex-1 min-[480px]:block" />
        <button type="button" onClick={onBack} className={cn(BUTTON, SECONDARY)}>
          <HugeiconsIcon icon={ArrowTurnBackwardIcon} aria-hidden="true" strokeWidth={2} />
          {t("selfService.erp.delegate.back")}
        </button>
        <button type="button" onClick={submit} className={cn(BUTTON, VIOLET)}>
          {t("selfService.form.send")}
          <HugeiconsIcon
            icon={SentIcon}
            aria-hidden="true"
            strokeWidth={2}
            className="rtl:-scale-x-100"
          />
        </button>
      </div>
    </>
  )
}
