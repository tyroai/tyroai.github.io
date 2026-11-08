import { textExcerpt } from "./onenoteHtml"

/**
 * OneNote sayfasını TYRO'ya devretmek (okuyucunun "TYRO" menüsü): özet, yapılacaklar ya da
 * hazırlık. Soru tyroOffice'e gider (`setPendingAsk`); sayfanın düz metni (görseller yok) en çok
 * `ASK_TEXT_MAX` karakter, ardından bağlantı — sohbet balonu notun tamamını taşımasın.
 */
export const ASK_MODES = ["summary", "todos", "prepare"] as const
export type AskMode = (typeof ASK_MODES)[number]

/** TYRO'ya giden metnin üst sınırı (karakter). */
export const ASK_TEXT_MAX = 2500

type T = (key: string, params?: Record<string, string | number>) => string

export interface AskPage {
  title: string
  crumb: string
  webUrl?: string | null
}

/** Sohbete gidecek soru: istek + not başlığı ve yolu + bağlantı + notun metni. */
export function askQuestion(mode: AskMode, page: AskPage, html: unknown, t: T): string {
  const text = textExcerpt(html, ASK_TEXT_MAX, "\n")
  const source = page.crumb
    ? t("onenote.ask.source", { title: page.title, crumb: page.crumb })
    : t("onenote.ask.sourceTitle", { title: page.title })
  return [t(`onenote.ask.prompt.${mode}`), source, page.webUrl ?? "", text]
    .filter(Boolean)
    .join("\n\n")
}
