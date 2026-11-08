import { useState } from "react"
import { PersonAvatar } from "@/components/common/PersonAvatar"
import { useLocale } from "@/hooks/useLocale"
import { formatAgo } from "@/lib/date"
import { cn } from "@/lib/utils"
import { FeedMarks } from "../FeedMarks"
import { MORE, ROW, ROW_OFF } from "./railStyles"

/** Kısa listede görünen sabit posta sayısı. */
const VISIBLE = 4

/**
 * Sabitlenenler: Outlook'ta sabitlediğin postalar, en yeni üstte. Satır postayı açar. Sabit
 * işareti bölüm başlığında; satırda yalnız öteki işaretler (bayrak, yüksek önem) görünür.
 */
export function PinnedRows({ items, onOpen, photoFor }) {
  const { t, locale } = useLocale()
  const [expanded, setExpanded] = useState(false)
  const rows = expanded ? items : items.slice(0, VISIBLE)
  const hidden = items.length - rows.length
  return (
    <>
      <ul className="flex flex-col gap-0.5">
        {rows.map((p) => (
          <li key={p.id}>
            <button
              type="button"
              onClick={() => onOpen(p.id)}
              className={cn(ROW, "items-start gap-2 py-1.5", ROW_OFF)}
            >
              <span aria-hidden="true" className="mt-0.5 flex shrink-0">
                <PersonAvatar
                  name={p.author}
                  photo={photoFor(p.address)}
                  className="size-7 text-[0.625rem]"
                />
              </span>
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="line-clamp-2 text-[0.8125rem] font-semibold leading-snug tracking-[-0.01em] text-foreground/90">
                  {p.subject || t("feed.noSubject")}
                </span>
                <span className="mt-0.5 flex min-w-0 items-center gap-1 text-[0.6875rem] leading-snug text-muted-foreground">
                  <span className="min-w-0 truncate">{p.author}</span>
                  <span aria-hidden="true">·</span>
                  <span className="shrink-0">{formatAgo(p.received, locale)}</span>
                </span>
              </span>
              <FeedMarks
                post={{ flag: p.flag, importance: p.importance }}
                className="mt-0.5 shrink-0 flex-nowrap"
              />
            </button>
          </li>
        ))}
      </ul>
      {(hidden > 0 || expanded) && (
        <button type="button" onClick={() => setExpanded((v) => !v)} lang={locale} className={MORE}>
          {expanded ? t("feed.cel.showLess") : t("feed.cel.showMore", { count: hidden })}
        </button>
      )}
    </>
  )
}
