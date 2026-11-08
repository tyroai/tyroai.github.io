import { AnimatePresence, motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import ArrowExpand01Icon from "@hugeicons/core-free-icons/ArrowExpand01Icon"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import ArrowShrink01Icon from "@hugeicons/core-free-icons/ArrowShrink01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import SentIcon from "@hugeicons/core-free-icons/SentIcon"
import { DialogDescription, DialogTitle } from "@/components/ui/dialog"
import { InfoTip } from "@/components/common/InfoTip"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { FormNarrate } from "../narrate/FormNarrate"
import { ProgressTile } from "./field/ProgressTile"
import { NextStepsTip } from "./NextStepsTip"
import { summaryText } from "./requestText"

/**
 * Masaüstü pencerenin başlığı: ikon kutusu (çevresinde doluluk halkası, `progress`), ad, tek satır
 * alt yazı + bağlam, yuvarlak düğmeler (`tools`: klavye kısayolları; geniş masrafta tam ekran; kapat).
 * `meta`: adın altında bağlam satırının yerine çizilen denetimler (masrafın başlık bilgileri hap
 * hap) — gövdede ayrı bir blok yer kaplamasın.
 */
export function RequestHeader({
  icon,
  progress = null,
  title,
  description,
  context,
  meta = null,
  onClose,
  full = null,
  onToggleFull = null,
  tools = null,
}) {
  const { t } = useLocale()
  return (
    <div className="flex shrink-0 items-center gap-3.5 border-b border-black/[0.06] px-6 pb-5 pt-6 shorter:pb-3.5 shorter:pt-4 dark:border-white/[0.08]">
      <ProgressTile icon={icon} progress={progress} />
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1">
          <DialogTitle className="text-[1.25rem] font-semibold leading-tight tracking-[-0.02em]">
            {title}
          </DialogTitle>
          {/* Açıklama "i" düğmesinde; ekran okuyucu için açıklama olarak da duruyor. */}
          <InfoTip text={description} />
        </div>
        <DialogDescription className="sr-only">{description}</DialogDescription>
        {meta ? (
          <div className="mt-2 min-w-0">{meta}</div>
        ) : (
          context && (
            <p className="mt-1 truncate text-[0.875rem] tabular-nums text-muted-foreground">
              {context}
            </p>
          )
        )}
      </div>
      {tools}
      {onToggleFull && (
        <button
          type="button"
          onClick={onToggleFull}
          aria-pressed={full}
          aria-label={t(full ? "mail.compose.shrink" : "mail.compose.expand")}
          title={t(full ? "mail.compose.shrink" : "mail.compose.expand")}
          className="me-1 grid size-8 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-foreground/70 transition hover:bg-foreground/[0.1] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
        >
          <HugeiconsIcon
            icon={full ? ArrowShrink01Icon : ArrowExpand01Icon}
            aria-hidden="true"
            className="size-4"
            strokeWidth={2}
          />
        </button>
      )}
      <button
        type="button"
        onClick={onClose}
        aria-label={t("sheet.close")}
        className="grid size-8 shrink-0 place-items-center rounded-full bg-foreground/[0.06] text-foreground/70 transition hover:bg-foreground/[0.1] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
      >
        <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" className="size-4" strokeWidth={2} />
      </button>
    </div>
  )
}

const SECONDARY =
  "h-11 shrink-0 rounded-full border border-border bg-background px-5 text-[0.8125rem] font-semibold text-foreground/85 shadow-xs transition hover:bg-foreground/[0.04] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"

/**
 * Alt şerit: ipucu ya da hata özeti, Vazgeç ve "Gönder". Masrafta telefonda toplam düğmenin
 * üstünde kendi çubuğunda (ilk tutar girilince belirir; yatay telefonda yok — toplam ayrıntı
 * kartında). Çubuk canlı bölge değil: tutar yazılırken her tuşta okunmasın.
 * `submitLabel`: birincil düğmenin başka adı (masrafta "Gözden geçir", ok simgesiyle: henüz
 * göndermez); `onBack`: gözden geçirmede "Geri" (Vazgeç'in yerinde; telefonda gönderin yanında).
 * Telefonda düğme sırası: ⓘ (yalnız simge) · Anlat (birincil düğmenin hemen solunda, her adımda
 * aşağıda) · birincil; Geri varken ⓘ yok, Anlat yalnız simge (`@container/foot`: dar şeritte
 * etiketi `FormNarrate` kendi gizler). `info`: ⓘ'nin yerine geçen düğme — masrafta ayrıntı
 * düğmesi (`ExpenseDetails`: eksik varsa sarı uyarı simgesi, yoksa ⓘ; "Ne olacak?" onun kartında).
 * Masaüstünde Anlat pencerenin başlığında. "Gönder" her formda aynı ad, akışı farklı: `erp`
 * (`{ onClick, busy }`, `features/selfservice/lib/erpDirectPolicy.js` — izin, masraf) verilmişse talebi ERP'ye yazar,
 * yoksa formu gönderir ve talep TYRO'ya (sohbete) gider. `tyro`: telefonda yöneticinin
 * "TYRO'ya gönder" simgesi (masaüstünde başlıkta).
 */
export function RequestFooter({
  form,
  kind,
  mobile,
  busy,
  formId,
  onCancel,
  lead = null,
  submitLabel = null,
  onBack = null,
  info = null,
  erp = null,
  tyro = null,
}) {
  const { t, locale } = useLocale()
  const calm = useReducedMotion()
  const expense = kind === "expense"
  // Tutar girilene kadar toplam yok (fiş önce gelen boş masraf).
  const sum = expense && mobile ? summaryText(t, locale, form.expense.rows, false) : null
  // Birincil düğme ERP'ye yazıyor mu (Devam / Gözden geçir adımında hiçbir zaman).
  const toErp = Boolean(erp) && !submitLabel
  // "Ne olacak?" ve ipucu formun yoluna göre: ERP (izin, masraf) ya da sohbet (avans, temsilci).
  const via = erp ? "erp" : "chat"
  const working = busy || (toErp && erp.busy)
  const hint = (
    <p
      aria-live="polite"
      className={cn(
        "flex min-w-0 flex-1 items-center gap-1.5 text-[0.75rem] leading-snug",
        form.invalid ? "font-medium text-danger-ink" : "text-muted-foreground",
        mobile && "justify-center text-center shortest:hidden",
      )}
    >
      {form.invalid ? (
        // Masrafın "n alan kaldı" çubuğuyla aynı işaret: kırmızı halka.
        <span
          aria-hidden="true"
          className="size-2 shrink-0 rounded-full border-[1.5px] border-danger bg-danger/15"
        />
      ) : (
        <HugeiconsIcon icon={AiChat02Icon} aria-hidden="true" className="size-3.5 shrink-0" />
      )}
      {form.invalid
        ? t("selfService.form.err.summary", { n: form.invalid })
        : t(via === "erp" ? "selfService.form.howErp" : "selfService.form.how")}
    </p>
  )
  const send = (
    <button
      type={toErp ? "button" : "submit"}
      form={toErp ? undefined : formId}
      onClick={toErp ? erp.onClick : undefined}
      aria-busy={working || undefined}
      className={cn(
        "inline-flex h-11 items-center justify-center gap-2.5 rounded-full bg-brand-fill-deep px-5 text-[0.875rem] font-semibold text-brand-on-brand shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_20px_-8px_rgb(0_0_0/0.45)] transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background pointer-coarse:h-12",
        mobile && "w-full px-4",
      )}
    >
      {submitLabel ?? t("selfService.form.send")}
      <HugeiconsIcon
        icon={working ? Loading03Icon : submitLabel ? ArrowRight01Icon : SentIcon}
        aria-hidden="true"
        className={cn(
          "size-4",
          working ? "animate-spin motion-reduce:animate-none" : "rtl:-scale-x-100",
        )}
      />
    </button>
  )
  if (mobile) {
    return (
      <div className="@container/foot flex flex-col">
        <AnimatePresence initial={false}>
          {sum?.sums && (
            <motion.div
              key="sum"
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: "auto", opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: calm ? 0 : 0.2, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden shortest:hidden"
            >
              <div className="mb-2.5 flex items-baseline justify-between gap-3 rounded-xl bg-muted/60 px-3.5 py-2.5">
                <span className="text-[0.75rem] font-medium text-muted-foreground">
                  {t("selfService.form.totalLabel")} · {sum.lines}
                </span>
                <span className="min-w-0 text-end text-[0.9375rem] font-semibold tabular-nums">
                  {sum.sums}
                </span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        {/* Hata özeti yalnız gönderme denenince; "Ne olacak?" gönderin yanındaki "i"de —
            masaüstündeki gibi, form ilk açılışta daha çok sığsın. */}
        {form.invalid > 0 && <div className="mb-2.5 shortest:hidden">{hint}</div>}
        <div className="flex items-center gap-2">
          {/* Gözden geçirmede yok: orada yerine ne olacağı sayfanın kendisinde yazıyor. */}
          {!onBack &&
            (info ?? (
              <NextStepsTip
                via={via}
                iconOnly
                className="h-12 w-12 border border-border bg-background px-0 shadow-xs pointer-coarse:h-12"
              />
            ))}
          {onBack && (
            <button type="button" onClick={onBack} className={cn(SECONDARY, "pointer-coarse:h-12")}>
              {t("selfService.expense.back")}
            </button>
          )}
          {tyro}
          <FormNarrate
            kind={kind}
            form={form}
            placement="footer"
            compact={Boolean(onBack)}
            long={!submitLabel}
          />
          <div className="min-w-0 flex-1">{send}</div>
        </div>
      </div>
    )
  }
  return (
    <div className="flex items-center gap-3">
      {form.invalid ? hint : (lead ?? <span className="flex-1" />)}
      {/* "ⓘ Ne olacak?": panellerde yer tutmasın diye adımlar bu düğmenin kartında. */}
      <NextStepsTip via={via} />
      <div className="flex shrink-0 items-center gap-2">
        <button type="button" onClick={onBack ?? onCancel} className={SECONDARY}>
          {t(onBack ? "selfService.expense.back" : "selfService.form.cancel")}
        </button>
        {send}
      </div>
    </div>
  )
}
