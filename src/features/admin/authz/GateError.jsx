import { ErrorCause } from "@/components/common/ErrorCause"

/**
 * Yetki listesi okunamadığında kapının hata şeridi: çare cümlesi, neden kodu (`ErrorCause`) ve
 * ham teknik ayrıntı (katlı). Liste boşaltılmaz; elde olan son hâl şeridin altında kalır.
 */
export function GateError({ ctx }) {
  const { t, error, errorKey, errorDetail } = ctx
  return (
    <div className="rounded-xl border border-amber-500/30 bg-amber-500/[0.07] px-4 py-3">
      <p className="text-[0.8125rem] font-medium text-foreground">{t(errorKey)}</p>
      <ErrorCause detail={errorDetail} className="mt-1.5" />
      <details className="mt-1.5">
        <summary className="cursor-pointer text-[0.75rem] text-muted-foreground">
          {t("authz.error.detail")}
        </summary>
        <p className="mt-1 text-[0.6875rem] leading-relaxed text-muted-foreground [overflow-wrap:anywhere]">
          {String(error.message ?? error)}
        </p>
      </details>
    </div>
  )
}
