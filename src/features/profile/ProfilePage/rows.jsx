import { useState } from "react"
import { Link } from "react-router-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import Tick02Icon from "@hugeicons/core-free-icons/Tick02Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

/**
 * Profilin ayar dili (Apple'ın "inset grouped" listesi, sade giysiyle): küçük büyük harfli grup
 * başlığı, çerçevesiz soluk gövde, ayraçlı satırlar. Bütün bölümler bu parçalarla yazılır ki
 * yedi bölüm tek sayfa gibi okunsun.
 */

export const GROUP_LABEL =
  "text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-muted-foreground"

/** Bölüm başı: h2 + tek satır açıklama (telefonda başlık üst çubukta, burada yalnız okuyucuya). */
export function SectionHeader({ title, description, compact = false, action }) {
  return (
    <div className="flex items-start gap-4">
      <div className="min-w-0 flex-1">
        <h2 className={cn("text-base font-semibold tracking-tight", compact && "sr-only")}>
          {title}
        </h2>
        {description ? (
          <p className={cn("text-sm text-muted-foreground", !compact && "mt-1")}>{description}</p>
        ) : null}
      </div>
      {action ? <div className="shrink-0">{action}</div> : null}
    </div>
  )
}

export function Group({ label, footer, children, className, level = 3 }) {
  const { locale } = useLocale()
  const Heading = level === 2 ? "h2" : "h3"
  return (
    <section className={cn("space-y-1.5", className)}>
      {label ? (
        <Heading lang={locale} className={cn(GROUP_LABEL, "px-4")}>
          {label}
        </Heading>
      ) : null}
      <div className="divide-y divide-border/60 overflow-hidden rounded-2xl bg-muted/40 dark:bg-white/[0.04]">
        {children}
      </div>
      {footer ? (
        <div className="px-4 text-xs leading-relaxed text-muted-foreground">{footer}</div>
      ) : null}
    </section>
  )
}

/** Ayar satırı: solda ad (+ soluk tek satır), sağda değer ya da denetim. */
export function Row({ icon, label, hint, children, className, labelClassName }) {
  return (
    <div
      className={cn(
        "flex min-h-12 items-center gap-3 px-4 py-3 pointer-coarse:min-h-14",
        className,
      )}
    >
      {icon ? (
        <HugeiconsIcon
          icon={icon}
          className="size-4 shrink-0 text-muted-foreground"
          strokeWidth={1.8}
        />
      ) : null}
      <div className={cn("min-w-0 flex-1", labelClassName)}>
        <div className="text-sm text-foreground">{label}</div>
        {hint ? <div className="mt-0.5 text-xs text-muted-foreground">{hint}</div> : null}
      </div>
      {children !== undefined && children !== null ? (
        <div className="flex min-w-0 shrink-0 items-center gap-2">{children}</div>
      ) : null}
    </div>
  )
}

/** Alt sayfaya inen satır: sağda soluk değer önizlemesi + yön oku. */
export function DrillRow({ to, state, icon, label, value, onClick, onIntent, dataSection }) {
  return (
    <Link
      to={to}
      state={state}
      onClick={onClick}
      onPointerEnter={onIntent}
      onFocus={onIntent}
      data-section={dataSection}
      className="flex min-h-12 items-center gap-3 px-4 py-3 outline-none transition-colors hover:bg-foreground/[0.03] focus-visible:bg-foreground/[0.05] focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/60 active:bg-foreground/[0.06] pointer-coarse:min-h-14"
    >
      {icon ? (
        <HugeiconsIcon
          icon={icon}
          className="size-[1.125rem] shrink-0 text-muted-foreground"
          strokeWidth={1.8}
        />
      ) : null}
      <span
        className={cn(
          "truncate text-sm text-foreground",
          value ? "max-w-[62%] shrink-0" : "min-w-0 flex-1",
        )}
      >
        {label}
      </span>
      {value ? (
        <span className="min-w-0 flex-1 truncate text-end text-sm text-muted-foreground">
          {value}
        </span>
      ) : null}
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        className="size-4 shrink-0 text-muted-foreground/70 rtl:rotate-180"
        strokeWidth={2}
        aria-hidden="true"
      />
    </Link>
  )
}

const CHIP = {
  success: "bg-success/10 text-success-ink",
  warning: "bg-warning/10 text-warning-ink",
  danger: "bg-danger/10 text-danger-ink",
  muted: "bg-foreground/[0.06] text-foreground/75",
}

/** Durum çipi: durum söyler, tıklanmaz. */
export function StatusChip({ tone = "muted", children, className }) {
  return (
    <span
      className={cn(
        "inline-flex h-6 shrink-0 items-center rounded-full px-2 text-xs font-medium",
        CHIP[tone] ?? CHIP.muted,
        className,
      )}
    >
      {children}
    </span>
  )
}

/** Panoya kopyalayan sessiz ikon düğmesi; onay iki saniye sonra kendiliğinden söner. */
export function CopyButton({ value, label }) {
  const { t } = useLocale()
  const [done, setDone] = useState(false)
  async function copy() {
    try {
      await navigator.clipboard?.writeText(value)
      setDone(true)
      window.setTimeout(() => setDone(false), 2000)
    } catch {
      // Pano izni yoksa sessiz: değer ekranda okunur durumda.
    }
  }
  return (
    <button
      type="button"
      onClick={copy}
      aria-label={`${done ? t("profile.access.copied") : t("profile.access.copy")}: ${label}`}
      className="relative grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground outline-none transition hover:bg-foreground/[0.06] hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/60 pointer-coarse:size-11"
    >
      <HugeiconsIcon
        icon={done ? Tick02Icon : Copy01Icon}
        className={cn("size-4", done && "text-success-ink")}
        strokeWidth={1.8}
      />
      {/* Etiket değişimi okunmaz; onayı ekran okuyucuya canlı bölge söyler. */}
      <span className="sr-only" aria-live="polite">
        {done ? t("profile.access.copied") : ""}
      </span>
    </button>
  )
}

/** Yükleniyor: soluk iskelet satırları (hareket yok — hareketi azalt tercihine de uyar). */
export function SkeletonRows({ count = 3 }) {
  return (
    <div aria-hidden="true" className="divide-y divide-border/60">
      {Array.from({ length: count }, (_, i) => (
        <div key={i} className="flex min-h-12 items-center gap-3 px-4 py-3 opacity-60">
          <span className="h-3 w-24 rounded bg-foreground/10" />
          <span className="ms-auto h-3 w-32 rounded bg-foreground/[0.07]" />
        </div>
      ))}
    </div>
  )
}
