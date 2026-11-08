import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"
import { ErrorCause } from "@/components/common/ErrorCause"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { usePhone } from "../layout/phone"
import { describe } from "../recordText"
import { ERP_ICON } from "../request/erp/erpIcon"

const ACTION =
  "inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full px-3 text-[0.75rem] font-semibold text-brand-ink transition hover:bg-brand/[0.09] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 disabled:opacity-60 pointer-coarse:h-11 pointer-coarse:px-4"

/** Yeni kaydın kısa adı: masraf ve avansta numara; izinde tür · tarih aralığı (kimliği okunmaz). */
function arrivalName(record, t, locale) {
  if (record.kind !== "leave" && record.number) return record.number
  const { title, sub } = describe(record, t, locale)
  return `${title} · ${sub}`
}

/**
 * Profil başlığının altındaki ince durum satırı — yeni talep sohbette başlatıldıktan sonra
 * (`useNewRecordWatch`): beklerken "Talebin TYRO'da… · Yenile", kayıt ERP'den gelince
 * "Yeni kayıt: HRMS-062415 · Aç" (ayrıntıyı açar). × satırı kapatır ve yoklamayı bitirir.
 * `failed`: son yoklama okunamadı — sayfa yerinde kalır, satır bunu ve nedenini (`failDetail`) söyler.
 * `via`: "erp" — talep sohbete uğramadan ERP'ye yazıldı ("ERP'ye işlendi…").
 */
export function RequestWatchLine({
  arrived,
  busy,
  failed = false,
  failDetail = null,
  via = "chat",
  onRefresh,
  onOpen,
  onDismiss,
}) {
  const { t, locale } = useLocale()
  // Telefonda sayfanın dili: çerçevesiz dolgu ve bölüm arası 16 px.
  const phone = usePhone()
  return (
    <div
      className={cn(
        "flex min-w-0 items-center gap-2 rounded-2xl border py-1 pe-1 ps-3 text-[0.8125rem] text-foreground/80",
        phone ? "mt-4 border-transparent bg-muted/60" : "mt-3 border-border/70 bg-card",
      )}
    >
      <HugeiconsIcon
        icon={arrived ? CheckmarkCircle02Icon : via === "erp" ? ERP_ICON : AiChat02Icon}
        aria-hidden="true"
        strokeWidth={1.9}
        className={cn(
          "size-4 shrink-0",
          arrived ? "text-emerald-600 dark:text-emerald-400" : "text-brand-ink",
        )}
      />
      {/* Sayfa hep LTR; Arapça cümlenin noktalaması kendi yönünde dizilsin (`dir="auto"`). */}
      <div role="status" dir="auto" className="min-w-0 flex-1 py-1 text-left leading-snug">
        {arrived ? (
          <>
            {t("selfService.watch.arrived")}{" "}
            <span className="font-semibold text-foreground [overflow-wrap:anywhere]">
              {arrivalName(arrived, t, locale)}
            </span>
          </>
        ) : (
          t(
            failed
              ? "selfService.watch.failed"
              : via === "erp"
                ? "selfService.watch.pendingErp"
                : "selfService.watch.pending",
          )
        )}
        {failed && !arrived && <ErrorCause detail={failDetail} className="mt-1.5" />}
      </div>
      {arrived ? (
        <button type="button" onClick={() => onOpen(arrived)} className={ACTION}>
          {t("selfService.watch.open")}
        </button>
      ) : (
        <button
          type="button"
          onClick={onRefresh}
          disabled={busy}
          aria-busy={busy || undefined}
          className={ACTION}
        >
          <HugeiconsIcon
            icon={RefreshIcon}
            aria-hidden="true"
            className={cn("size-3.5", busy && "animate-spin motion-reduce:animate-none")}
          />
          {t("selfService.watch.refresh")}
        </button>
      )}
      <button
        type="button"
        onClick={onDismiss}
        aria-label={t("selfService.watch.dismiss")}
        className="grid size-8 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:size-11"
      >
        <HugeiconsIcon icon={Cancel01Icon} aria-hidden="true" className="size-3.5" />
      </button>
    </div>
  )
}
