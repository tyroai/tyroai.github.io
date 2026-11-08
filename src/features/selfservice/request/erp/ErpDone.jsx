import { useMemo } from "react"
import { AlertDialog } from "radix-ui"
import { motion, useReducedMotion } from "motion/react"
import { HugeiconsIcon } from "@hugeicons/react"
import UserSwitchIcon from "@hugeicons/core-free-icons/UserSwitchIcon"
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon"
import { useLocale } from "@/hooks/useLocale"
import { formatMoney } from "@/lib/amountParse"
import { linesTotal } from "@/features/selfservice/lib/erpPreview"
import { erpRecord } from "@/features/selfservice/lib/erpRecord"
import { cn } from "@/lib/utils"
import { FormActions } from "../../detail/FormActions"
import { countText, range } from "../../kinds"
import { leaveKindLabel } from "../requestCard"

const EASE = [0.22, 1, 0.36, 1]

const dateOf = (iso) => {
  const [y, m, d] = String(iso).split("-").map(Number)
  return new Date(y, m - 1, d)
}

const typeNameOf = (t, locale, plan) =>
  plan?.code
    ? (leaveKindLabel(t, locale, plan.kind) ?? t(`selfService.leaveType.${plan.code}`))
    : ""

/** Neyin işlendiği tek satırda: masrafta toplam ve kalem sayısı, izinde tür ve tarih, avansta tutar ve amaç, temsilcide kişi ve tarih. */
function factLine(t, locale, kind, plan) {
  if (!plan) return null
  if (kind === "delegate")
    return [plan.person.name, range(plan.start, plan.end, locale)].join(" · ")
  if (kind === "advance")
    return [
      formatMoney(plan.record.mserp_requestedamountcur, plan.record.mserp_currencycode, locale),
      t(`myspace.purpose.${plan.purpose}`),
    ].join(" · ")
  if (kind === "leave")
    return [
      typeNameOf(t, locale, plan),
      range(dateOf(plan.record.mserp_startdate), dateOf(plan.record.mserp_enddate), locale),
    ].join(" · ")
  return [
    linesTotal(plan.lines, locale),
    countText(t, locale, "selfService.form.lineCount", plan.lines.length),
  ].join(" · ")
}

/** Markanın ✓'si: dolgulu daire, çizilerek beliren tik, bir kez genişleyen hâle (TYRO'ya gönderimin imzası). */
function Tick({ calm }) {
  return (
    <span className="relative grid size-12 shrink-0 place-items-center">
      {!calm && (
        <motion.span
          aria-hidden="true"
          initial={{ opacity: 0.5, scale: 1 }}
          animate={{ opacity: 0, scale: 1.7 }}
          transition={{ duration: 0.9, ease: "easeOut", delay: 0.3 }}
          className="absolute inset-0 rounded-full bg-brand/30"
        />
      )}
      <motion.span
        initial={calm ? false : { opacity: 0, scale: 0.7 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: "spring", stiffness: 380, damping: 22 }}
        className="relative grid size-12 place-items-center rounded-full bg-brand-fill-deep text-brand-on-brand shadow-[0_10px_24px_-10px_var(--brand-via)]"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 rounded-full bg-[radial-gradient(90%_70%_at_30%_15%,rgb(255_255_255/0.3),transparent_65%)]"
        />
        <svg viewBox="0 0 24 24" aria-hidden="true" className="relative size-6">
          <motion.path
            d="M5 12.5l4.2 4.2L19 7"
            fill="none"
            stroke="currentColor"
            strokeWidth={2.6}
            strokeLinecap="round"
            strokeLinejoin="round"
            {...(calm
              ? { initial: false }
              : {
                  initial: { pathLength: 0 },
                  animate: { pathLength: 1 },
                  transition: { duration: 0.42, ease: EASE, delay: 0.14 },
                })}
          />
        </svg>
      </motion.span>
    </span>
  )
}

/**
 * ERP'ye işlendi — akış ekranının EN ALTINDA, ayrı bir pencere değil: iş listesi ✓'lerle yerinde
 * kalır, sonuç kartı altına kayarak gelir. Kartta markanın ✓'si, ERP'nin verdiği numara, neyin
 * işlendiği ve ne olacağı; altında deneme notu ve eklenemeyen fişler (kehribar). Hareket
 * azaltıldıysa durağan. `cardRef`: pencere sonucu görünür kılmak için kaydırır.
 */
export function ErpResult({ kind, state, cardRef }) {
  const { t, locale } = useLocale()
  const calm = useReducedMotion()
  const number = state.result?.number ?? null
  const failed = state.result?.failedFiles ?? []
  const facts = factLine(t, locale, kind, state.plan)
  return (
    <motion.div
      ref={cardRef}
      initial={calm ? false : { opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.36, ease: EASE }}
      className="scroll-mb-4 space-y-3"
    >
      <div className="flex items-center gap-4 rounded-2xl bg-brand/[0.06] px-4 py-4 ring-1 ring-inset ring-brand/15">
        <Tick calm={calm} />
        <div className="min-w-0 flex-1">
          {number && (
            <p className="text-[1.25rem] font-semibold leading-tight tracking-[-0.01em] tabular-nums [overflow-wrap:anywhere]">
              {number}
            </p>
          )}
          {facts && (
            <p
              className={cn(
                "tabular-nums",
                number ? "mt-0.5 text-[0.875rem] text-foreground/75" : "text-[1rem] font-semibold",
              )}
            >
              {facts}
            </p>
          )}
          <AlertDialog.Description className="mt-1 text-[0.8125rem] leading-snug text-muted-foreground">
            {t(
              kind === "delegate"
                ? "selfService.erp.done.bodyDelegate"
                : "selfService.erp.done.body",
            )}
          </AlertDialog.Description>
        </div>
      </div>
      {/* Deneme yazımı (`DELEGATE.demo`): hiçbir yere istek gitmedi, yazılmış sanılmasın. */}
      {state.result?.demo && (
        <p className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/12 px-3 py-1 text-[0.8125rem] font-medium text-amber-800 ring-1 ring-inset ring-amber-500/25 dark:text-amber-200">
          {t("selfService.erp.demo")}
        </p>
      )}
      {failed.length > 0 && (
        <p className="rounded-xl bg-amber-500/10 px-3.5 py-3 text-[0.875rem] text-amber-800 dark:text-amber-200">
          {t("selfService.erp.done.filesFailed", { names: failed.map((f) => f.name).join(", ") })}
        </p>
      )}
    </motion.div>
  )
}

/**
 * İşlendikten sonra alt şeridin düğmeleri (soldan sağa): Kapat · Kaydı göster · Temsilci ata
 * (izinde, mor — temsilci penceresinin rengi) · kayıt ayrıntısının form düğmeleri (`FormActions`:
 * izinde Yazdır + İmzala & Mail, masrafta Yazdır + Mail gönder; renkli olan en sağda). Biçim
 * pencerenin şeridinden gelir (`look`: `base` · `primary` · `delegate`). `onShow(record)`:
 * "Kaydı göster" — pencere kapanır, kaydın ayrıntısı hemen açılır (az önce yazılan hâliyle).
 * Kapanış formu da kapatır (`useErpSubmit.cancel`).
 */
export function ErpDoneActions({
  kind,
  state,
  person,
  okRef,
  look,
  onDelegate = null,
  onShow = null,
}) {
  const { t, locale } = useLocale()
  const typeName = typeNameOf(t, locale, state.plan)
  // Temsilcinin yazdırılacak ya da imzalanacak bir formu yok.
  const record = useMemo(
    () => (kind === "delegate" ? null : erpRecord(kind, state.plan, state.result, { typeName })),
    [kind, state.plan, state.result, typeName],
  )
  const delegate = kind === "leave" && onDelegate
  return (
    <>
      <AlertDialog.Cancel ref={okRef} className={record || onShow ? look.base : look.primary}>
        {t("selfService.close")}
      </AlertDialog.Cancel>
      <span className="hidden flex-1 min-[480px]:block" />
      {onShow && (
        <button
          type="button"
          onClick={() => onShow(record)}
          className={record ? look.base : look.primary}
        >
          <HugeiconsIcon icon={ViewIcon} aria-hidden="true" strokeWidth={1.9} />
          {t("selfService.erp.done.show")}
        </button>
      )}
      {delegate && (
        <button type="button" onClick={onDelegate} className={look.delegate}>
          <HugeiconsIcon icon={UserSwitchIcon} aria-hidden="true" strokeWidth={2} />
          {t("selfService.erp.delegate.open")}
        </button>
      )}
      {record && (
        <FormActions record={record} person={person} base={look.base} primary={look.primary} />
      )}
    </>
  )
}
