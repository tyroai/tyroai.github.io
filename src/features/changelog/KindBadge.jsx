import { HugeiconsIcon } from "@hugeicons/react"
import SparklesIcon from "@hugeicons/core-free-icons/SparklesIcon"
import ChartUpIcon from "@hugeicons/core-free-icons/ChartUpIcon"
import Wrench01Icon from "@hugeicons/core-free-icons/Wrench01Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { kindText } from "./entryText"

/**
 * KAYIT TÜRÜ — ikon + renk + KELİME.
 *
 * Kelime her zaman yazılır: renk ve ikon tanımayı hızlandırır ama tek başına anlam taşımaz
 * (renk körü okuyucu, ikonu ilk kez gören). Üç ton uygulamanın durum dilinden: Yeni → marka
 * mürekkebi, İyileştirme → `success`, Düzeltme → `warning` (kırmızı DEĞİL: düzelmiş bir hata
 * kötü haber değil). İkonlar tek kavram anlatır: kıvılcım (yeni), yükselen grafik (iyileşme),
 * anahtar (tamir).
 *
 * Sabit tablo İHRAÇ EDİLMEZ: bileşen dosyasından sabit ihraç etmek fast refresh'i bozuyor.
 */
const KIND_STYLE = {
  feature: {
    icon: SparklesIcon,
    tone: "text-brand-ink",
    badge: "bg-brand-soft/70 text-brand-ink",
    tile: "bg-brand-soft/60 text-brand-ink ring-brand/15",
  },
  improvement: {
    icon: ChartUpIcon,
    tone: "text-success-ink",
    badge: "bg-success/12 text-success-ink",
    tile: "bg-success/12 text-success-ink ring-success/20",
  },
  fix: {
    icon: Wrench01Icon,
    tone: "text-warning-ink",
    badge: "bg-warning/12 text-warning-ink",
    tile: "bg-warning/12 text-warning-ink ring-warning/20",
  },
}

export function KindBadge({ kind }) {
  const { t, locale } = useLocale()
  const spec = KIND_STYLE[kind] ?? KIND_STYLE.improvement
  return (
    <span
      lang={locale}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full py-0.5 pl-1.5 pr-2 text-[0.6875rem] font-semibold",
        spec.badge,
      )}
    >
      <HugeiconsIcon icon={spec.icon} className="size-3" strokeWidth={2.2} />
      {t(`whatsNew.kind.${kind}`)}
    </span>
  )
}

/** Sayfa satırının sessiz türü: tonlu ikon + soluk kelime (çip değil — satır başına bir çip gürültü). */
export function KindLabel({ kind }) {
  const { t, locale } = useLocale()
  const spec = KIND_STYLE[kind] ?? KIND_STYLE.improvement
  return (
    <span
      lang={locale}
      className="inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground"
    >
      <HugeiconsIcon
        icon={spec.icon}
        aria-hidden="true"
        className={cn("size-3.5", spec.tone)}
        strokeWidth={2}
      />
      {kindText(t, kind, true)}
    </span>
  )
}

/** Yalnız tür simgesi (renksiz; rengi çağıranın `currentColor`ı verir) — Yenilikler penceresi. */
export function KindIcon({ kind, className }) {
  const spec = KIND_STYLE[kind] ?? KIND_STYLE.improvement
  return (
    <HugeiconsIcon icon={spec.icon} aria-hidden="true" className={className} strokeWidth={1.9} />
  )
}

/** Kartın solundaki renkli ikon kutusu — rozetle aynı tonu taşır. */
export function KindTile({ kind, className }) {
  const spec = KIND_STYLE[kind] ?? KIND_STYLE.improvement
  return (
    <span
      aria-hidden="true"
      className={cn("grid shrink-0 place-items-center rounded-lg ring-1", spec.tile, className)}
    >
      <HugeiconsIcon icon={spec.icon} className="size-3.5" strokeWidth={2} />
    </span>
  )
}
