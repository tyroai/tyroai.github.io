import { useMemo } from "react"
import { useLocale } from "@/hooks/useLocale"
import { isolate } from "@/lib/bidi"
import { usePageContent } from "@/components/onenote/usePageContent"
import { crumbOf } from "@/lib/onenote/onenotePages"
import { editedLabel } from "./lib/onenoteFormat"
import { textExcerpt } from "@/lib/onenote/onenoteHtml"

/**
 * Geniş kartın solundaki kâğıt — en son düzenlenen sayfa: defter yolu, başlık, ilk satırları
 * (tek istek, yalnız metin; okuyucu aynı sayfayı açınca içerik bellekte hazır) ve zaman.
 * İçerik okunamazsa ön izleme yalnız düşer; başlık kalır.
 */
export function OneNoteHero({ page, now, onOpen }) {
  const { t, locale } = useLocale()
  const content = usePageContent(page.id, { images: false })
  const excerpt = useMemo(() => textExcerpt(content.raw, 260), [content.raw])
  const title = page.title || t("onenote.untitled")
  const crumb = crumbOf(page)
  const loading = content.status === "loading"
  return (
    <button type="button" onClick={() => onOpen(page)} className="on-hero" title={title}>
      <span className="on-hero-eyebrow">
        <span className="on-hero-dot" aria-hidden="true" />
        <span className="on-hero-crumb">{crumb ? isolate(crumb) : t("onenote.latest")}</span>
      </span>
      <span
        dir="auto"
        data-private=""
        className={page.title ? "on-hero-title" : "on-hero-title is-untitled"}
      >
        {title}
      </span>
      {loading ? (
        <span aria-hidden="true" className="on-hero-skeleton">
          <span className="ms-skeleton" />
          <span className="ms-skeleton" />
        </span>
      ) : (
        excerpt && (
          <span dir="auto" data-private="" className="on-hero-excerpt">
            {excerpt}
          </span>
        )
      )}
      <span className="on-hero-when">{editedLabel(page.edited, locale, now)}</span>
    </button>
  )
}
