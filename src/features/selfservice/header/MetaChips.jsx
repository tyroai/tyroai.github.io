import { HugeiconsIcon } from "@hugeicons/react"
import Building03Icon from "@hugeicons/core-free-icons/Building03Icon"
import Location01Icon from "@hugeicons/core-free-icons/Location01Icon"
import UserAccountIcon from "@hugeicons/core-free-icons/UserAccountIcon"
import UserGroupIcon from "@hugeicons/core-free-icons/UserGroupIcon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

const ICONS = {
  department: UserGroupIcon,
  company: Building03Icon,
  office: Location01Icon,
  employeeType: UserAccountIcon,
}

// Çip kalıbı; iskelet de aynı boyda yer tutar (yüklenince kayma olmasın).
const CHIP = "flex h-6 min-w-0 max-w-full items-center rounded-full"

/**
 * Başlığın etiketli bilgileri, haplı değil sade yazı (`metaOf().chips`: şirket, departman, ofis, çalışan tipi): ikon
 * + değer. Etiket ekran okuyucuya `dt`'de, fareyle ipucunda; uzun değer çipin içinde kesilir,
 * tamamı ipucunda. Şirket adı düzeltildiyse ipucu kayıttaki yazımı da gösterir; kısa kod
 * yazıldıysa (`full`) ipucu ve ekran okuyucu tam adı verir. `onHero`: gradyan
 * kartın mürekkebiyle (`SelfHero`). `grid`: dar kartta iki eşit sütun (çipler düzensiz kırılmasın);
 * değer tek satır, sığmazsa kısalır: kartın boyu sabit (To-Do'nunkiyle aynı). Tamamı fare
 * ipucunda; departman ve ofis avatarın açtığı kişi kartında da.
 */
export function MetaChips({ chips, onHero = false, grid = false, className }) {
  const { t } = useLocale()
  if (!chips.length) return null
  return (
    <dl
      className={cn(
        grid
          ? "grid min-w-0 grid-cols-2 gap-x-3 gap-y-1"
          : "flex min-w-0 flex-wrap gap-x-4 gap-y-1",
        className,
      )}
    >
      {chips.map(({ key, value, raw, full }) => {
        const label = t(`selfService.profile.${key}`)
        const tip = raw
          ? `${label}: ${value}\n${t("selfService.profile.recorded", { value: raw })}`
          : `${label}: ${full ?? value}`
        return (
          <div
            key={key}
            title={tip}
            className={cn(
              grid ? "flex min-w-0 items-start" : CHIP,
              // Hap yok: küçük ikon + sade yazı (yazı koyu, ikon soluk; AA). Gradyan kartta mürekkep.
              "gap-1.5 text-[0.8125rem] @[40rem]/ss:max-w-[24rem]",
              onHero
                ? "text-[color:color-mix(in_oklch,var(--hero-ink)_90%,transparent)]"
                : "text-foreground/75",
            )}
          >
            <dt className={cn("shrink-0", grid && "pt-[0.1875rem]")}>
              <HugeiconsIcon
                icon={ICONS[key]}
                aria-hidden="true"
                className={cn(
                  "size-3.5",
                  onHero
                    ? "text-[color:color-mix(in_oklch,var(--hero-ink)_75%,transparent)]"
                    : "text-muted-foreground",
                )}
                strokeWidth={1.8}
              />
              <span className="sr-only">{label}</span>
            </dt>
            <dd lang="tr" className={cn("min-w-0 truncate", grid && "leading-snug")}>
              {full ? (
                <>
                  <span aria-hidden="true">{value}</span>
                  <span className="sr-only">{full}</span>
                </>
              ) : (
                value
              )}
            </dd>
          </div>
        )
      })}
    </dl>
  )
}

/** Yüklenirken çiplerin yeri: dar kapta, şirket adlı gerçek satır gibi iki sıraya kırılır. */
export function MetaChipsSkeleton({ className }) {
  return (
    <div aria-hidden="true" className={cn("flex min-w-0 flex-wrap gap-1.5", className)}>
      {["w-52", "w-32", "w-20"].map((w) => (
        <span key={w} className={cn(CHIP, "ms-skeleton", w)} />
      ))}
    </div>
  )
}
