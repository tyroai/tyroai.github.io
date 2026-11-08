import { useState } from "react"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useLocale } from "@/hooks/useLocale"
import { cn } from "@/lib/utils"
import { hashtag } from "../feedText"
import { MORE, ROW, ROW_OFF, ROW_ON } from "./railStyles"

/** Kısa listede görünen gönderen sayısı; gerisi düğmeyle (uzun kuyruk rayı yutmasın). */
const VISIBLE = 6

/**
 * "#SanaÖzel" ve altında gönderene göre grupları ("agent · 5"). Üst satır Sana özel bölümüne
 * götürür; gönderen satırı akışı yerinde o göndericiye süzer, yeniden basmak süzgeci kaldırır.
 * Ad ve adres postadan okunur (Graph `from`); adres yalnız addan farklıysa ikinci satırda.
 */
export function SenderRows({
  groups,
  total,
  share,
  onOpenTab,
  active,
  onSelect,
  onClear,
  photoFor,
}) {
  const { t, locale } = useLocale()
  const [expanded, setExpanded] = useState(false)
  // Süzgeçteki gönderen kısa listenin dışında kalsa da görünür: hangi süzgeçte olduğun silinmesin.
  const pick = active ? groups.findIndex((g) => g.address === active) : -1
  const rows = expanded ? groups : groups.filter((g, i) => i < VISIBLE || i === pick)
  const hidden = groups.length - rows.length
  return (
    <div>
      <button
        type="button"
        onClick={onOpenTab}
        className={cn(ROW, "flex-col items-stretch gap-0 py-1.5", ROW_OFF)}
      >
        <span className="flex items-baseline gap-2">
          <span
            lang={locale}
            className="min-w-0 flex-1 truncate text-[0.8125rem] font-semibold tracking-[-0.01em] text-foreground/90"
          >
            {hashtag(t("feed.section.important"), locale)}
          </span>
          <span className="shrink-0 text-[0.6875rem] tabular-nums text-muted-foreground">
            {total}
          </span>
        </span>
        <span
          aria-hidden="true"
          className="mt-1 block h-[3px] w-full overflow-hidden rounded-full bg-border/70"
        >
          <span
            className="block h-full rounded-full transition-[width] duration-500"
            style={{
              width: `${Math.max(share, 4)}%`,
              background:
                "linear-gradient(90deg, var(--brand-from), var(--brand-via), var(--brand-to))",
            }}
          />
        </span>
      </button>
      <ul
        aria-label={t("feed.rail.section.senders")}
        className="ms-[1.125rem] mt-0.5 flex flex-col gap-0.5 border-s border-border/70 ps-1.5"
      >
        {rows.map((g) => {
          const on = g.address === active
          return (
            <li key={g.address}>
              <button
                type="button"
                aria-pressed={on}
                onClick={() => (on ? onClear() : onSelect(g.address))}
                className={cn(ROW, "gap-2 py-1", on ? ROW_ON : ROW_OFF)}
              >
                {/* Baş harfler dekor: düğmenin adı ad + adres + sayı. */}
                <span aria-hidden="true" className="flex shrink-0">
                  <PersonAvatar
                    name={g.name}
                    photo={photoFor(g.address)}
                    className="size-7 text-[0.625rem]"
                  />
                </span>
                <span className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-[0.8125rem] font-semibold leading-snug tracking-[-0.01em]">
                    {g.name}
                  </span>
                  {g.name !== g.address && (
                    <bdi
                      className={cn(
                        "truncate text-[0.6875rem] leading-snug",
                        on ? "text-brand-on-soft/80" : "text-muted-foreground",
                      )}
                    >
                      {g.address}
                    </bdi>
                  )}
                </span>
                <span
                  className={cn(
                    "shrink-0 text-[0.75rem] font-semibold tabular-nums",
                    on ? "text-brand-on-soft" : "text-foreground/70",
                  )}
                >
                  {g.count}
                </span>
              </button>
            </li>
          )
        })}
      </ul>
      {(hidden > 0 || expanded) && (
        <button
          type="button"
          onClick={() => setExpanded((v) => !v)}
          lang={locale}
          className={cn(MORE, "ms-[1.125rem] w-[calc(100%-1.125rem)]")}
        >
          {expanded ? t("feed.cel.showLess") : t("feed.cel.showMore", { count: hidden })}
        </button>
      )}
    </div>
  )
}
