import { HugeiconsIcon } from "@hugeicons/react"
import NotebookTabsIcon from "@hugeicons/core-free-icons/NotebookTabsIcon"
import { FileBadge } from "@/components/common/FileBadge"
import { useLocale } from "@/hooks/useLocale"
import { isolate } from "@/lib/bidi"
import { formatFileTime } from "@/lib/filesFormat"
import { crumbOf } from "@/lib/onenote/onenotePages"
import { Highlighted } from "../FileRow"
import { OneNoteRowAsk } from "./OneNoteRowAsk"

const BADGE = { kind: "file", ext: "one" }

/**
 * OneNote sayfası satırı — dosya satırının (`FileRow`) dili: rozet, başlık (iki satır, aranan
 * metin vurgulu), altında "Defter › Bölüm · ne zaman". Satırın tamamı okuyucuyu açar; TYRO
 * kardeş düğme (iç içe düğme yok). Bölüm grubunun içinde (`crumb={false}`) yer başlıkta yazılı:
 * satırda yalnız zaman.
 */
export function OneNotePageRow({ page, now, query, onOpen, ask, crumb: showCrumb = true }) {
  const { t, locale } = useLocale()
  const title = page.title || t("onenote.untitled")
  const crumb = showCrumb ? crumbOf(page) : ""
  const when = page.modified ? formatFileTime(page.modified, now, locale) : ""
  return (
    <li
      data-file-row=""
      className="group/row relative flex items-start gap-1.5 rounded-[1.125rem] px-3 py-2.5 transition-colors hover:bg-foreground/[0.03] [contain-intrinsic-size:auto_4rem] [content-visibility:auto]"
    >
      <button
        type="button"
        onClick={() => onOpen(page)}
        aria-haspopup="dialog"
        className="flex min-w-0 flex-1 items-start gap-3 rounded-lg text-left outline-none focus-visible:ring-2 focus-visible:ring-brand/30 [@media(pointer:coarse)]:min-h-11"
      >
        <FileBadge item={BADGE} size="md" />
        <span className="min-w-0 flex-1">
          <span
            dir="auto"
            className="line-clamp-2 text-[0.875rem] font-medium leading-snug text-foreground [overflow-wrap:anywhere]"
          >
            <Highlighted text={title} query={query} />
          </span>
          <span className="mt-0.5 flex min-w-0 items-center gap-1 text-[0.75rem] leading-4 text-muted-foreground">
            {crumb && (
              <>
                <HugeiconsIcon
                  icon={NotebookTabsIcon}
                  className="size-3 shrink-0 opacity-70"
                  strokeWidth={1.9}
                  aria-hidden="true"
                />
                <span className="min-w-0 truncate">{isolate(crumb)}</span>
              </>
            )}
            {when && (
              <span className="truncate shrink-0 max-w-[65%]">
                {crumb ? " · " : ""}
                {when}
              </span>
            )}
          </span>
        </span>
      </button>
      <span className="flex shrink-0 items-center gap-0.5 self-center">
        <OneNoteRowAsk page={page} title={title} busy={ask.busyId === page.id} onAsk={ask.ask} />
      </span>
    </li>
  )
}
