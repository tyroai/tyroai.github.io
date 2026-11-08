import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { countText, money, range } from "../../../kinds"

// Rakam kutuya sığsın: en uzun satırın karakter sayısına göre kabın enine oranlı, üst sınır
// `max`. Bir karakter ~0,64em sayılır (rakam, simge, ayraç; payıyla).
const fit = (chars, max) =>
  `clamp(1.125rem, ${(100 / Math.max(chars * 0.64, 1)).toFixed(2)}cqi, ${max})`

/** Takvim ikonlu tarih aralığı ("13–16 Eki 2026"); ekran okuyucuya adıyla. */
function Period({ info, className }) {
  const { t, locale } = useLocale()
  if (!info.period) return null
  return (
    <span className={cn("inline-flex items-center gap-1.5", className)}>
      <HugeiconsIcon
        icon={Calendar03Icon}
        aria-hidden="true"
        className="size-3.5 shrink-0"
        strokeWidth={1.8}
      />
      <span className="sr-only">{t("selfService.expense.summary.period")}: </span>
      {range(info.period.from, info.period.to, locale)}
    </span>
  )
}

/**
 * Özetin büyük sayısı: para birimine göre toplamlar (çevrilmez; TRY önce), "3 kalem · 4 fiş" ve
 * kalemlerin tarih aralığı. Tutar yokken ilk kalemin para biriminde soluk sıfır ("₺0,00").
 * Yan panelde (`side`) alt alta ve büyük (birden çok para birimi alt alta), toplamın ne zaman
 * dolacağıyla; sıkı özette tek satır ("₺4.270,40 + $120,00", yanında sayılar).
 */
export function SummaryHero({ id, info, side, className }) {
  const { t, locale } = useLocale()
  const sums = info.totals.map(([cur, sum]) => [cur, money(sum, cur, locale)])
  const shown = sums.length ? sums : [[info.currency, money(0, info.currency, locale)]]
  const meta = [
    countText(t, locale, "selfService.form.lineCount", info.count),
    countText(t, locale, "selfService.expense.summary.receipts", info.receipts),
  ].join(" · ")
  const figure = cn(
    "font-semibold leading-[1.15] tracking-[-0.025em] tabular-nums",
    !sums.length && "text-muted-foreground",
  )

  if (!side) {
    const chars = shown.reduce((n, [, s]) => n + s.length + 3, 0)
    return (
      <div id={id} className={cn("@container/hero", className)}>
        <div className="flex flex-wrap items-baseline gap-x-4 gap-y-0.5">
          <p className={figure} style={{ fontSize: fit(chars, "1.5rem") }}>
            {shown.map(([cur, text], i) => (
              <span key={cur} className="whitespace-nowrap">
                {i > 0 && " + "}
                {text}
              </span>
            ))}
          </p>
          <p className="flex flex-wrap items-center gap-x-3 gap-y-0.5 text-[0.8125rem] leading-snug text-muted-foreground tabular-nums">
            <span>{meta}</span>
            <Period info={info} />
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className={cn("@container/hero", className)}>
      <p className="mb-1 text-[0.8125rem] font-medium text-muted-foreground">
        {t("selfService.form.totalLabel")}
      </p>
      <p
        className={figure}
        style={{ fontSize: fit(Math.max(4, ...shown.map(([, s]) => s.length)), "2rem") }}
      >
        {shown.map(([cur, text]) => (
          <span key={cur} className="block whitespace-nowrap">
            {text}
          </span>
        ))}
      </p>
      <div className="mt-2 text-[0.8125rem] leading-snug text-muted-foreground tabular-nums">
        <p>{meta}</p>
        <Period info={info} className="mt-0.5" />
      </div>
    </div>
  )
}
