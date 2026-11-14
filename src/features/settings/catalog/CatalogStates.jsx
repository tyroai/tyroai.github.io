import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import SquareLock02Icon from "@hugeicons/core-free-icons/SquareLock02Icon"
import { ErrorCause } from "@/components/common/ErrorCause"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/**
 * Sekme sayısı: seçili olmayanda rozetin soluk grisi gri zeminde AA'yı tutturmuyor (4.3:1),
 * yazı biraz koyulaşır; seçilide rozetin marka mürekkebi kalır.
 */
export function Count({ n, on }) {
  return <span className={on ? undefined : "text-foreground/70"}>{n}</span>
}

/** İskelet satırlar: nabız yerine düşük opaklık (hareketi azalt'ta da sakin). */
export function SkeletonRows({ rows = 6 }) {
  const { t } = useLocale()
  return (
    <ul
      aria-busy="true"
      aria-label={t("settings.catalog.loading")}
      className="divide-y divide-border/60"
    >
      {Array.from({ length: rows }, (_, i) => (
        <li key={i} className="flex min-h-14 items-center gap-3 px-1 py-2 opacity-60">
          <span className="w-7" />
          <span className="size-9 shrink-0 rounded-[0.625rem] bg-foreground/[0.07]" />
          <span className="flex-1 space-y-1.5">
            <span className="block h-3 w-40 max-w-[60%] rounded-full bg-foreground/[0.08]" />
            <span className="block h-2.5 w-64 max-w-[80%] rounded-full bg-foreground/[0.05]" />
          </span>
        </li>
      ))}
    </ul>
  )
}

/** Boş ya da sonuçsuz liste: ikon + tek cümle + sonraki adım. */
export function ListMessage({ icon, title, action, onAction, primary = false }) {
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-12 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-foreground/[0.05] text-muted-foreground">
        <HugeiconsIcon icon={icon} className="size-5" strokeWidth={1.6} />
      </span>
      <p className="text-sm font-medium text-foreground/80">{title}</p>
      {action && (
        <button
          type="button"
          onClick={onAction}
          className={cn(
            "inline-flex h-9 items-center rounded-lg px-3.5 text-[0.8125rem] font-medium transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11",
            primary
              ? "bg-brand-fill-deep text-brand-on-brand"
              : "text-foreground/80 hover:bg-foreground/[0.05] hover:text-foreground",
          )}
        >
          {action}
        </button>
      )}
    </div>
  )
}

/** Okuma hatası: liste son kopyadan çizilir, üstte sebep + Tekrar dene. */
export function ErrorBanner({ error, onRetry }) {
  const { t } = useLocale()
  const session = error?.code === "session-expired"
  return (
    <div
      role="status"
      className="flex flex-wrap items-start gap-x-3 gap-y-2 rounded-xl bg-warning/12 px-3.5 py-3 text-[0.8125rem]"
    >
      <HugeiconsIcon
        icon={Alert02Icon}
        className="mt-0.5 size-4 shrink-0 text-warning-ink"
        strokeWidth={1.8}
      />
      <div className="min-w-0 flex-1">
        <p className="font-medium text-warning-ink">{t("settings.catalog.error.title")}</p>
        <p className="text-foreground/75">
          {t(session ? "settings.catalog.error.session" : "settings.catalog.error.body")}
        </p>
        <ErrorCause detail={error?.detail} className="mt-1.5" />
      </div>
      <button
        type="button"
        onClick={onRetry}
        className="inline-flex h-8 shrink-0 items-center rounded-lg px-3 font-medium text-foreground/85 transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
      >
        {t("settings.catalog.error.retry")}
      </button>
    </div>
  )
}

/**
 * Yönetici değil ya da sorulamadı: sebebi söyler. `unknown` = üyelik sorusu hiç sorulamadı
 * (`useIsInGroup` › UNKNOWN) — "hayır" değil; o yüzden ret metni yerine Tekrar dene. `detail`:
 * sorulamama nedeninin kodu (`useGroupFailure`).
 */
export function NotAdmin({ unknown = false, onRetry, detail }) {
  const { t } = useLocale()
  const key = unknown ? "settings.catalog.gate" : "settings.catalog.notAdmin"
  return (
    <div role="status" className="flex flex-col items-center gap-2 px-6 py-14 text-center">
      <span className="grid size-11 place-items-center rounded-full bg-foreground/[0.05] text-muted-foreground">
        <HugeiconsIcon
          icon={unknown ? Alert02Icon : SquareLock02Icon}
          className="size-5"
          strokeWidth={1.6}
        />
      </span>
      <p className="text-sm font-medium">{t(unknown ? `${key}.unknownTitle` : `${key}.title`)}</p>
      <p className="max-w-sm text-[0.8125rem] text-muted-foreground">
        {t(unknown ? `${key}.unknownBody` : `${key}.body`)}
      </p>
      {unknown && <ErrorCause detail={detail} className="mt-1" />}
      {unknown && onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="mt-1 inline-flex h-9 items-center rounded-lg px-3.5 text-[0.8125rem] font-medium text-foreground/85 transition hover:bg-foreground/[0.06] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
        >
          {t("settings.catalog.error.retry")}
        </button>
      )}
    </div>
  )
}
