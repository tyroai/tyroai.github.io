import { HugeiconsIcon } from "@hugeicons/react"
import CheckmarkCircle02Icon from "@hugeicons/core-free-icons/CheckmarkCircle02Icon"
import Alert02Icon from "@hugeicons/core-free-icons/Alert02Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/**
 * Apple'ın "inset grouped" listesi, sade giysiyle: küçük büyük harfli grup başlığı (`lang` —
 * "YETKİLERİM" doğru yazılsın; ürün adında `titleLang="en"`: "MICROSOFT", "MİCROSOFT" değil),
 * çerçevesiz soluk gövde, ayraçlı satırlar, altta tek satır ipucu.
 */
export function InsetGroup({ id, title, hint, titleLang, children }) {
  const { locale } = useLocale()
  return (
    <section aria-labelledby={id}>
      <h3
        id={id}
        lang={titleLang ?? locale}
        className="mb-2 px-4 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"
      >
        {title}
      </h3>
      <div className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-muted/40 dark:bg-white/[0.04]">
        {children}
      </div>
      {hint ? (
        <p className="mt-2 px-4 text-xs leading-relaxed text-muted-foreground">{hint}</p>
      ) : null}
    </section>
  )
}

/**
 * Satır: solda ad, sağda değer. `stacked`: uzun değer (kapsam listesi, açıklama) adın altında
 * tam genişlikte ve soldan hizalı — oynak bir sol kenara karşı sağa dayalı liste taranamıyor.
 */
export function InsetRow({ label, children, stacked }) {
  if (stacked) {
    return (
      <div className="px-4 py-3">
        <p className="text-[0.8125rem] text-muted-foreground">{label}</p>
        <div className="mt-1.5 text-[0.8125rem] text-foreground">{children}</div>
      </div>
    )
  }
  return (
    <div className="flex min-h-12 flex-wrap items-center justify-between gap-x-4 gap-y-1 px-4 py-2.5 pointer-coarse:min-h-14">
      <span className="shrink-0 text-[0.8125rem] text-muted-foreground">{label}</span>
      <span className="min-w-0 max-w-full text-end text-[0.8125rem] font-medium text-foreground [overflow-wrap:anywhere]">
        {children}
      </span>
    </div>
  )
}

/** Kod değeri çipi (kapsam, kimlik, anahtar): eşit aralıklı, harf harf okunur. */
export function CodeChip({ children }) {
  return (
    <span className="inline-flex max-w-full items-center rounded-md bg-background px-1.5 py-0.5 text-[0.75rem] tabular-nums tracking-[0.015em] [font-variant-ligatures:none] text-foreground/90 [overflow-wrap:anywhere] dark:bg-white/[0.06]">
      {children}
    </span>
  )
}

/** Çip listesi — hep soldan. */
export function Chips({ items }) {
  if (!items?.length) return <span className="text-muted-foreground">—</span>
  return (
    <span className="flex flex-wrap gap-1">
      {items.map((x) => (
        <CodeChip key={x}>{x}</CodeChip>
      ))}
    </span>
  )
}

/**
 * Üç değerli cevap: evet · hayır · henüz çözülmedi. Çözülmemiş hâl "hayır" GİBİ çizilmez.
 * Evet sessiz başarı tonunda; hayır soluk (bir arıza değil, bir olgu).
 */
export function Verdict({ value, yes, no, pending }) {
  if (value === undefined) {
    return <span className="text-[0.8125rem] font-normal text-muted-foreground">{pending}</span>
  }
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5",
        value ? "text-success-ink" : "text-muted-foreground",
      )}
    >
      <HugeiconsIcon
        icon={value ? CheckmarkCircle02Icon : Alert02Icon}
        aria-hidden="true"
        className="size-3.5 shrink-0"
        strokeWidth={2}
      />
      {value ? yes : no}
    </span>
  )
}
