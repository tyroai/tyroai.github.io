import { HugeiconsIcon } from "@hugeicons/react"
import AddSquareIcon from "@hugeicons/core-free-icons/AddSquareIcon"
import Share03Icon from "@hugeicons/core-free-icons/Share03Icon"
import { TyroAppIcon } from "@/components/brand/TyroAppIcon"
import { BottomSheet } from "@/components/common/BottomSheet"
import { useLocale } from "@/hooks/useLocale"
import { usePwaInstall } from "@/hooks/usePwaInstall"
import { setInstallGuide } from "@/lib/pwaInstall"

const STEPS = [
  { icon: Share03Icon, title: "pwa.ios.step1", hint: "pwa.ios.step1Hint" },
  { icon: AddSquareIcon, title: "pwa.ios.step2", hint: "pwa.ios.step2Hint" },
]

/**
 * iPhone/iPad Safari'nin kurulum tarifi: Safari sayfaya kurulum penceresi açtırmıyor, kişi
 * Paylaş › Ana Ekrana Ekle'yi kendisi seçer. İki adım, Safari'deki simgelerin biçimiyle. Kabukta
 * tek örnek (`DashboardLayout`, yalnız iPhone/iPad Safari'de iner); kullanıcı menüsü ve Anasayfa
 * kartı `setInstallGuide(true)` ile açar.
 */
export default function IosInstallGuide() {
  const { t } = useLocale()
  const { guide } = usePwaInstall()
  const close = () => setInstallGuide(false)

  return (
    <BottomSheet
      open={guide}
      onOpenChange={(open) => !open && close()}
      title={t("pwa.ios.title")}
      closeOnBack
      footer={
        <button
          type="button"
          onClick={close}
          className="h-11 w-full rounded-xl bg-brand-fill-deep text-[0.875rem] font-semibold text-brand-on-brand transition hover:brightness-110 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/50"
        >
          {t("pwa.ios.done")}
        </button>
      }
    >
      <div className="flex items-center gap-3 pb-1">
        <TyroAppIcon className="size-12" />
        <p className="text-[0.8125rem] leading-snug text-muted-foreground">
          {t("pwa.promo.bodyIos")}
        </p>
      </div>
      <ol className="mt-3 flex flex-col gap-2 pb-2">
        {STEPS.map((step, i) => (
          <li key={step.title} className="flex items-center gap-3 rounded-2xl bg-muted/60 p-3">
            <span className="relative grid size-11 shrink-0 place-items-center rounded-xl bg-card text-foreground shadow-sm ring-1 ring-foreground/5">
              <HugeiconsIcon icon={step.icon} className="size-5" strokeWidth={1.8} />
              <span className="absolute -start-1.5 -top-1.5 grid size-5 place-items-center rounded-full bg-brand-fill-deep text-[0.625rem] font-bold text-brand-on-brand">
                {i + 1}
              </span>
            </span>
            <span className="flex min-w-0 flex-col">
              <span className="text-[0.875rem] font-semibold leading-snug">{t(step.title)}</span>
              <span className="text-[0.75rem] leading-snug text-muted-foreground">
                {t(step.hint)}
              </span>
            </span>
          </li>
        ))}
      </ol>
    </BottomSheet>
  )
}
