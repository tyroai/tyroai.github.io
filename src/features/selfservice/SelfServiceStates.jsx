import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import CloudIcon from "@hugeicons/core-free-icons/CloudIcon"
import UserAccountIcon from "@hugeicons/core-free-icons/UserAccountIcon"
import { useLocale } from "@/hooks/useLocale"
import { useReconnect } from "@/hooks/useReconnect"
import { useSessionExpired } from "@/hooks/useSessionExpired"
import { cn } from "@/lib/utils"
import { usePhone } from "./layout/phone"
import { erpKind } from "@/lib/causeText"
import { StateDetail } from "./StateDetail"
import "./summary/phoneStats.css"

/** Telefon düzeninin iskeleti: kutusuz özet satırı, sekmeler, arama + Süzgeç, ayraçlı satırlar. */
function PhoneSkeleton() {
  return (
    <div aria-hidden="true" className="mt-5">
      <div className="flex h-11 items-center justify-between">
        <span className="ms-skeleton block h-6 w-24 rounded-full" />
        <span className="ms-skeleton block size-6 rounded-full" />
      </div>
      {/* Üç değerin kartı (`PhoneSummary`) kendi şeklinde. */}
      <div className="ss-stats ms-surface">
        {[0, 1, 2].map((i) => (
          <span key={i} className="ss-stat">
            <span className="ms-skeleton block h-3 w-16 rounded" />
            <span className="ms-skeleton block h-5 w-20 rounded-md" />
          </span>
        ))}
      </div>
      <span className="ms-skeleton mt-6 block h-13 rounded-2xl" />
      <div className="mt-4 flex gap-2">
        <span className="ms-skeleton block h-11 flex-1 rounded-full" />
        <span className="ms-skeleton block h-11 w-24 rounded-full" />
      </div>
      <div className="mt-6 divide-y divide-border/60">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="flex items-center justify-between py-4">
            <span className="space-y-1.5">
              <span className="ms-skeleton block h-4 w-32 rounded" />
              <span className="ms-skeleton block h-3 w-24 rounded" />
            </span>
            <span className="ms-skeleton block h-4 w-14 rounded" />
          </div>
        ))}
      </div>
    </div>
  )
}

/**
 * "Bilgilerim"in iskeleti — özet kartı (dönem çubuğuyla), sekmeler, araç çubuğu ve satırlar
 * gerçek yerlerinde (yükleme ile sonuç arasında sayfa zıplamasın). Telefonda telefonun düzeni.
 */
export function BoardSkeleton() {
  const phone = usePhone()
  if (phone) return <PhoneSkeleton />
  return (
    <div aria-hidden="true">
      <div className="ms-surface mt-4 rounded-[1.25rem] p-1.5 @[40rem]/ss:mt-5">
        <div className="flex gap-1.5 pb-1">
          <span className="ms-skeleton block h-9 w-52 rounded-full pointer-coarse:h-12" />
          <span className="ms-skeleton ms-auto block h-8 w-8 rounded-full @[40rem]/ss:w-28" />
        </div>
        <div className="ms-skeleton h-[3.75rem] rounded-2xl @[44rem]/ss:h-[6rem]" />
      </div>
      <div className="ms-skeleton mt-5 h-11 rounded-2xl @[40rem]/ss:mt-6" />
      <div className="mt-3 grid gap-4 @[52rem]/ss:grid-cols-[minmax(0,1fr)_17.5rem] @[52rem]/ss:gap-5 @[64rem]/ss:grid-cols-[minmax(0,1fr)_20rem]">
        <div className="min-w-0">
          <div className="flex gap-2">
            <span className="ms-skeleton block h-9 flex-1 rounded-full" />
            <span className="ms-skeleton block h-9 w-20 rounded-full @[30rem]/ss:w-32" />
          </div>
          <span className="ms-skeleton mt-5 block h-3 w-28 rounded" />
          <div className="mt-2 space-y-px overflow-hidden rounded-2xl">
            {[0, 1, 2, 3].map((i) => (
              <span key={i} className="ms-skeleton block h-16" />
            ))}
          </div>
        </div>
        <span className="ms-skeleton hidden h-80 rounded-2xl @[52rem]/ss:block" />
      </div>
    </div>
  )
}

const KINDS = {
  denied: { icon: CloudIcon, tone: "brand" },
  notFound: { icon: UserAccountIcon, tone: "brand" },
  error: { icon: Alert02Icon, tone: "warn" },
  signedOut: { icon: UserAccountIcon, tone: "brand" },
}

/**
 * Kayıtlar okunamadığında sebep ve çare — tek kart. "Bağlan" (Microsoft penceresi) YALNIZ işe
 * yarayacağında: izin ya da ek doğrulama gerekiyorsa, pencere kapandıysa ya da neden bilinmiyorsa.
 * ERP ortamında kullanıcı/rol eksiği, yönetici onayı ya da koşullu erişimde pencere bir şey
 * çözmez: düğme "Tekrar dene" olur (BT düzelttikten sonra), çare cümlesi `StateDetail`'de.
 */
export function SelfServiceState({ status, detail, onConnect, onRetry, busy }) {
  const { t } = useLocale()
  const kind = KINDS[status] ?? KINDS.error
  const why = status === "denied" ? erpKind(detail) : null
  const connect = status === "denied" && (why === "consent" || why === "popup" || why === null)
  // Oturumun süresi dolduysa (her sayfadaki şerit açık) kart da aynı tek çareyi sunar: "Yeniden giriş
  // yap" — çoğu zaman şifresiz, aynı sayfaya döner. Kişi iki ayrı düğme arasında seçim yapmasın.
  const expired = useSessionExpired()
  const { reconnect, busy: reconnecting } = useReconnect()
  const action = expired
    ? { label: t("session.expired.action"), run: reconnect }
    : connect
      ? { label: t("selfService.state.connect"), run: onConnect }
      : status === "denied" || status === "error"
        ? { label: t("selfService.state.retry"), run: onRetry }
        : null
  return (
    <div className="mt-6 flex flex-col items-center rounded-[1.5rem] border border-border/70 bg-card px-6 py-10 text-center @[40rem]/ss:mt-8">
      <span
        className={cn(
          "grid size-12 place-items-center rounded-2xl",
          kind.tone === "warn"
            ? "bg-amber-500/12 text-amber-700 dark:text-amber-400"
            : "bg-brand/10 text-brand-ink",
        )}
      >
        <HugeiconsIcon icon={kind.icon} className="size-6" strokeWidth={1.8} />
      </span>
      <p className="mt-4 text-[0.9375rem] font-semibold text-foreground">
        {t(`selfService.state.${status}.title`)}
      </p>
      <p className="mt-1 max-w-md text-[0.8125rem] leading-relaxed text-muted-foreground">
        {t(`selfService.state.${status}.body`)}
      </p>
      {(status === "denied" || status === "error") && <StateDetail detail={detail} />}
      {action && (
        <button
          type="button"
          onClick={action.run}
          disabled={reconnecting || undefined}
          aria-busy={busy || reconnecting || undefined}
          className="mt-5 inline-flex h-10 items-center rounded-full bg-brand-fill-deep px-5 text-[0.8125rem] font-semibold text-brand-on-brand transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:h-11"
        >
          {action.label}
        </button>
      )}
    </div>
  )
}
