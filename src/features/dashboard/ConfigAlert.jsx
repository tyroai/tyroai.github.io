import { HugeiconsIcon } from "@hugeicons/react"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import Logout03Icon from "@hugeicons/core-free-icons/Logout03Icon"
import { LazyErrorCause } from "@/components/common/LazyErrorCause"
import { useSessionExpired } from "@/hooks/useSessionExpired"
import { useSignOut } from "@/hooks/useSignOut"
import { useLocale } from "@/hooks/useLocale"
import { DV_SESSION_EXPIRED } from "@/lib/dataverse"

/**
 * KATALOG OKUNAMADI ŞERİDİ — "soramadık ≠ veri yok".
 *
 * Katalog Dataverse'ten okunamadığında liste son Dataverse önbelleğinde kalır ya da
 * boştur (pakete gömülü yedek liste yok — `catalogMerge.js`); şerit bunun neden
 * olduğunu söyler. Şerit yalnızca çekim DÜŞTÜĞÜNDE çizilir; başarılı okumada tek
 * piksel değişmez.
 *
 * ⚠️ MANŞET HATANIN KODUNDAN SEÇİLİR. Tek bir "yetkiniz kısıtlı,
 * yöneticinize sorun" cümlesi sahadaki en sık hatada YANLIŞTI: belirtecin
 * süresi dolmuştu ve çözüm kullanıcının kendisindeydi. Süresi dolmuş
 * oturumda düğme var (çıkış → giriş), yetki hatasında YOK — basılacak bir
 * şey yok.
 *
 * ⚠️ Gövde MÜREKKEPTE, `muted` DEĞİL: orada yazan şey kullanıcının yapacağı
 * iş, sayfanın en okunması gereken cümlesi. Ham `Error.message` silinmez
 * (bir destek turunda tek teşhis kaynağı odur) ama KAPALI başlar.
 */
export function ConfigAlert({ error }) {
  const { t } = useLocale()
  // ⚠️ `instance.logoutRedirect` DOĞRUDAN çağrılmaz: paylaşılan çıkış
  // `markSignedOut()`u redirect'ten önce yazıyor ve o işaret olmadan sessiz
  // SSO kullanıcıyı /login'de anında geri içeri alırdı — yani "çıkış yap ve
  // tekrar gir" düğmesi hiçbir şey yapmamış gibi görünürdü.
  const signOut = useSignOut()
  const sessionExpired = useSessionExpired()
  const expired = error.code === DV_SESSION_EXPIRED
  // Oturum uyarısı zaten her sayfanın üstünde (`SessionExpiredBanner`): aynı cümle iki kez yazılmasın.
  if (expired && sessionExpired) return null
  const kind = expired ? "expired" : "generic"
  return (
    <div
      role="status"
      className="col-span-full flex items-start gap-2.5 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3 py-3 text-[0.8125rem] leading-snug"
    >
      <HugeiconsIcon
        icon={Alert02Icon}
        aria-hidden="true"
        className="mt-px size-4 shrink-0 text-amber-600 dark:text-amber-400"
        strokeWidth={2}
      />
      <div className="flex min-w-0 flex-col gap-1.5">
        <span className="font-semibold text-foreground">
          {t(`launcher.agents.alert.${kind}.title`)}
        </span>
        <span className="text-foreground/85">{t(`launcher.agents.alert.${kind}.body`)}</span>
        <LazyErrorCause detail={error.detail} className="mt-0" />
        {expired && (
          <button
            type="button"
            onClick={signOut}
            className="mt-0.5 inline-flex w-fit items-center gap-1.5 rounded-lg bg-foreground px-2.5 py-1.5 text-[0.75rem] font-medium text-background transition hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HugeiconsIcon icon={Logout03Icon} className="size-3.5" strokeWidth={2} />
            {t("launcher.agents.alert.expired.action")}
          </button>
        )}
        {error.message && (
          <details className="mt-0.5">
            <summary className="w-fit cursor-pointer text-[0.6875rem] text-muted-foreground hover:text-foreground">
              {t("launcher.agents.alert.detail")}
            </summary>
            <p className="mt-1 break-words font-mono text-[0.6875rem] text-muted-foreground">
              {error.message}
            </p>
          </details>
        )}
      </div>
    </div>
  )
}
