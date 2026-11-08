import { useLocale } from "@/hooks/useLocale"
import { accentColor } from "@/lib/feedPolicy"
import { cn } from "@/lib/utils"
import { hashtag } from "../feedText"
import { ROW, ROW_OFF, ROW_ON } from "./railStyles"

/**
 * Kanallar: hashtag, gönderi sayısı ve akıştaki payı; ÇOKTAN AZA, KIRPILMADAN (ray aşağı uzar).
 * Oran çubuğu süs değil ölçü: payda akışta görünen gönderilerin toplamı, çubuklar %100 eder.
 * Sayı yoksa çubuk da yok. Seçili kanal yeniden basınca süzgeci kaldırır.
 */
export function ChannelRows({ rows, total, tag, onTagChange }) {
  const { t, locale } = useLocale()
  return (
    <ul className="flex flex-col gap-0.5">
      {rows.map((s) => {
        const on = tag === s.tag
        const share = total > 0 ? Math.round((s.count / total) * 100) : 0
        return (
          <li key={s.tag}>
            <button
              type="button"
              onClick={() => onTagChange(on ? null : s.tag)}
              aria-pressed={on}
              className={cn(ROW, "flex-col items-stretch gap-0", on ? ROW_ON : ROW_OFF)}
            >
              <span className="flex items-baseline gap-2">
                <span
                  lang={locale}
                  className={cn(
                    "min-w-0 flex-1 truncate text-[0.8125rem] font-semibold tracking-[-0.01em]",
                    !on && "text-foreground/90",
                  )}
                >
                  {hashtag(t(`feed.tag.${s.tag}`), locale)}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[0.6875rem] tabular-nums",
                    on ? "text-brand-on-soft/80" : "text-muted-foreground",
                  )}
                >
                  {s.count > 0 ? s.count : ""}
                </span>
              </span>
              {s.count > 0 && (
                <span
                  aria-hidden="true"
                  className="mt-1 block h-[3px] w-full overflow-hidden rounded-full bg-border/70"
                >
                  <span
                    className="block h-full rounded-full transition-[width] duration-500"
                    style={{ width: `${Math.max(share, 4)}%`, background: accentColor(s.accent) }}
                  />
                </span>
              )}
            </button>
          </li>
        )
      })}
    </ul>
  )
}
