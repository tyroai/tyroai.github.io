import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { AnimatedCounter } from "@/components/common/AnimatedCounter"
import { BottomSheet } from "@/components/common/BottomSheet"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"

const RING = "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
// Ayraç ilkinden sonra, yüzeyin üst ve alt payında (Self Servis özet şeridi).
const TILE =
  "relative min-w-0 rounded-2xl px-5 py-4 text-start transition-colors hover:bg-foreground/[0.03] [&:not(:first-child)]:before:absolute [&:not(:first-child)]:before:inset-y-4 [&:not(:first-child)]:before:start-0 [&:not(:first-child)]:before:w-px [&:not(:first-child)]:before:bg-border"

/**
 * Sakin özet şeridi — Self Servis'in izin/masraf/avans kutularıyla aynı dil: küçük büyük harfli ad,
 * sayaçla gelen büyük değer, tek soluk alt satır (bağlam: "En eskisi 29 gün önce"). Beş sayı, her
 * biri bir kısayol (listeyi süzer ya da sekmeyi açar).
 * Yalnız "dikkat" hâli renk alır (bekleyen talep, sorunlu kayıt > 0). Telefonda tek satır özet
 * düğmesi; dokununca alt çekmecede aynı beş satır. `loading`: değerler "—".
 *
 * @param {{ key: string, label: string, value: number, caption?: string, warn?: boolean, active?: boolean }[]} p.stats
 */
export function KpiStrip({ stats, onPick, phone, loading = false }) {
  const { t, locale } = useLocale()
  const [open, setOpen] = useState(false)
  const intl = new Intl.NumberFormat(locale)
  // Yüklenirken sayı uydurulmaz: "—" (şerit yerinde durur, sayfa zıplamaz).
  const nf = { format: (n) => (loading ? "—" : intl.format(n)) }
  if (phone) {
    const parts = stats.filter((s) => s.key !== "apps")
    // Dikkat isteyen sayı öne: dar ekranda kesilen kısım sakin sayılar olsun.
    const ordered = loading
      ? parts
      : [...parts.filter((s) => s.warn), ...parts.filter((s) => !s.warn)]
    const line = ordered.map((s, i) => (
      // Her ölçü bütün bir birim (ad + sayı, kırılmaz): sığmayan birim bir alt satıra düşer ve
      // kabın tek satır yüksekliğinde görünmez kalır — sayı ortasından kesilmez.
      <span key={s.key} className="whitespace-nowrap">
        {i > 0 && <span aria-hidden="true">· </span>}
        {s.label}{" "}
        <span className={cn(s.warn && !loading && "font-semibold text-warning-ink")}>
          {nf.format(s.value)}
        </span>
      </span>
    ))
    return (
      <>
        <button
          type="button"
          onClick={() => setOpen(true)}
          aria-haspopup="dialog"
          className={cn(
            "flex min-h-11 w-full items-center gap-2 rounded-xl bg-foreground/[0.028] px-4 text-start text-sm dark:bg-foreground/[0.05]",
            RING,
          )}
        >
          <span className="flex h-5 min-w-0 flex-1 flex-wrap gap-x-1.5 overflow-hidden leading-5 tabular-nums text-foreground/70">
            {line}
          </span>
          <HugeiconsIcon
            icon={ArrowRight01Icon}
            className="size-4 shrink-0 text-muted-foreground rtl:rotate-180"
            strokeWidth={1.8}
          />
        </button>
        <BottomSheet open={open} onOpenChange={setOpen} title={t("security.kpi.label")} closeOnBack>
          <ul className="divide-y divide-border/60 rounded-2xl bg-muted/40 dark:bg-white/[0.04]">
            {stats.map((s) => (
              <li key={s.key}>
                <button
                  type="button"
                  onClick={() => {
                    setOpen(false)
                    onPick(s.key)
                  }}
                  className={cn("flex min-h-14 w-full items-center gap-3 px-4 text-start", RING)}
                >
                  <span className="min-w-0 flex-1 text-sm">{s.label}</span>
                  <span
                    className={cn(
                      "text-base font-semibold tabular-nums",
                      s.warn && "text-warning-ink",
                    )}
                  >
                    {nf.format(s.value)}
                  </span>
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    className="size-4 text-muted-foreground rtl:rotate-180"
                    strokeWidth={1.8}
                  />
                </button>
              </li>
            ))}
          </ul>
        </BottomSheet>
      </>
    )
  }
  return (
    <div
      role="group"
      aria-label={t("security.kpi.label")}
      className="grid min-w-0 grid-cols-5 rounded-2xl bg-foreground/[0.028] dark:bg-foreground/[0.05]"
    >
      {stats.map((s) => (
        <button
          key={s.key}
          type="button"
          aria-pressed={s.active ?? false}
          onClick={() => onPick(s.key)}
          className={cn(TILE, RING, s.active && "bg-background shadow-sm dark:bg-white/[0.08]")}
        >
          <span
            lang={locale}
            className="block truncate text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-foreground/65"
          >
            {s.label}
          </span>
          {loading ? (
            <span className="ms-skeleton mt-2 block h-8 w-16 rounded-md" />
          ) : (
            <span
              className={cn(
                "mt-1.5 block truncate text-[1.75rem] font-semibold leading-tight tabular-nums tracking-[-0.025em]",
                s.warn && "text-warning-ink",
              )}
            >
              <AnimatedCounter value={s.value} locale={locale} fallback={intl.format(s.value)} />
            </span>
          )}
          <span className="mt-1.5 block min-h-[1.125rem] truncate text-[0.75rem] text-foreground/65">
            {loading ? "" : s.caption}
          </span>
        </button>
      ))}
    </div>
  )
}
