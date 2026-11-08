import { Fragment } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Search01Icon from "@hugeicons/core-free-icons/Search01Icon"
import { Button } from "@/components/ui/button"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { EntryRow } from "./EntryRow"
import { dayLabel } from "./changelogList"

/** "Son ziyaretin" ayracı: okunmamışlar ile okunmuşlar arasında ince çizgi (sohbet uygulamalarındaki "yeni" çizgisi). */
function SeenDivider() {
  const { t, locale } = useLocale()
  return (
    <li
      aria-hidden="true"
      lang={locale}
      className="flex items-center gap-3 py-3 text-[0.6875rem] font-medium uppercase tracking-[0.08em] text-brand-ink"
    >
      <span className="h-px flex-1 bg-brand/30" />
      {t("whatsNew.divider")}
      <span className="h-px flex-1 bg-brand/30" />
    </li>
  )
}

function Empty({ onClear }) {
  const { t } = useLocale()
  return (
    <div className="flex flex-col items-center gap-3 px-6 py-16 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-foreground/[0.05] text-muted-foreground">
        <HugeiconsIcon
          icon={Search01Icon}
          aria-hidden="true"
          className="size-5"
          strokeWidth={1.6}
        />
      </span>
      <p className="max-w-[30ch] text-sm text-muted-foreground">{t("whatsNew.empty")}</p>
      <Button variant="outline" onClick={onClear} className="pointer-coarse:h-11">
        {t("whatsNew.clearFilters")}
      </Button>
    </div>
  )
}

/**
 * Zaman çizgisi: gün gün gruplar. Geniş kapta tarih SOLDA yapışkan bir sütun (gün uzadıkça
 * görünür kalır), dar kapta kayıtların üstünde başlık. Tek `<h2>` iki düzeni kurar — ikinci bir
 * başlık ekran okuyucuya aynı tarihi iki kez söyletirdi. Gün sayısı çok: ağır çerçeve yok,
 * günler arası ince çizgi.
 */
export function Timeline({
  groups,
  unreadIds,
  targetId,
  terms,
  divider,
  today,
  remaining,
  onMore,
  onClear,
}) {
  const { t, locale } = useLocale()
  if (groups.length === 0) return <Empty onClear={onClear} />
  return (
    <>
      <ol className="flex flex-col">
        {groups.map((g) => {
          const day = dayLabel(g.date, locale, today)
          return (
            <li
              key={g.date}
              id={`day-${g.date}`}
              className="scroll-mt-24 border-t border-border/60 py-6 first:border-t-0 first:pt-3 @2xl/whatsnew:grid @2xl/whatsnew:grid-cols-[8rem_minmax(0,1fr)] @2xl/whatsnew:gap-x-6"
            >
              <h2 className="mb-3 flex items-baseline gap-2 @2xl/whatsnew:sticky @2xl/whatsnew:top-[var(--day-top,5rem)] @2xl/whatsnew:mb-0 @2xl/whatsnew:block @2xl/whatsnew:self-start @2xl/whatsnew:pt-1.5">
                <span className="text-sm font-semibold">{day.primary}</span>
                <span className="text-xs font-normal text-muted-foreground @2xl/whatsnew:mt-0.5 @2xl/whatsnew:block">
                  {day.secondary}
                </span>
              </h2>
              <ol className="flex min-w-0 flex-col gap-4">
                {g.items.map((e, i) => (
                  <Fragment key={e.id}>
                    <li
                      className={cn(
                        "border-t border-border/50 pt-4 first:border-t-0 first:pt-0",
                        // Ayracın hemen ardında ikinci bir çizgi çizilmez.
                        g.items[i - 1]?.id === divider && "border-t-0 pt-1",
                      )}
                    >
                      <EntryRow
                        entry={e}
                        unread={unreadIds.has(e.id)}
                        targeted={e.id === targetId}
                        terms={terms}
                      />
                    </li>
                    {e.id === divider ? <SeenDivider /> : null}
                  </Fragment>
                ))}
              </ol>
            </li>
          )
        })}
      </ol>
      {remaining > 0 && (
        <div className="flex justify-center pb-2 pt-4">
          <Button variant="outline" onClick={onMore} className="h-10 px-5 pointer-coarse:h-11">
            {t("whatsNew.more", { n: remaining })}
          </Button>
        </div>
      )}
    </>
  )
}
