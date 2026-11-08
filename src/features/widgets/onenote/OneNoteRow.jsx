import { useLocale } from "@/hooks/useLocale"
import { isolate } from "@/lib/bidi"
import { editedLabel } from "./lib/onenoteFormat"

/** Sayfanın minyatürü: kâğıt, solda defter sırtı, üç çizgi (süs; ekran okuyucuya gizli). */
export function PageThumb() {
  return (
    <span aria-hidden="true" className="on-thumb">
      <i />
      <i />
      <i />
    </span>
  )
}

/**
 * Liste satırı — minyatür, başlık (tek satır), altında "ne zaman · Defter › Bölüm". Satırın
 * tamamı okuyucuyu açar. Dar kartta defter yolu düşer (zaman kalır).
 */
export function OneNoteRow({ page, now, onOpen }) {
  const { t, locale } = useLocale()
  const title = page.title || t("onenote.untitled")
  // Mini kartta bölüm düşer (CSS), defter kalır.
  const lead = page.notebook || page.section
  return (
    <li>
      <button type="button" onClick={() => onOpen(page)} className="on-row" title={title}>
        <PageThumb />
        <span className="on-row-text">
          <span
            dir="auto"
            data-private=""
            className={page.title ? "on-row-title" : "on-row-title is-untitled"}
          >
            {title}
          </span>
          <span className="on-row-meta">
            <span className="on-row-when">{editedLabel(page.edited, locale, now)}</span>
            {lead && (
              <span className="on-row-crumb">
                {isolate(lead)}
                {page.notebook && page.section && (
                  <span className="on-crumb-section">
                    {" › "}
                    {isolate(page.section)}
                  </span>
                )}
              </span>
            )}
          </span>
        </span>
      </button>
    </li>
  )
}
