import { textExcerpt } from "./onenoteHtml"

/**
 * OneNote sayfasını PAYLAŞMANIN bağlantı ve düz metin yolları (okuyucunun "Paylaş" menüsü):
 * Teams'in kendi "Teams'te paylaş" penceresi (kişi ya da kanal orada seçilir), bağlantıyı ve
 * metni kopyala. Bağlantı yalnız deftere erişimi olanda açılır. Notun kendisini e-postayla
 * gönderme `onenoteMail`, WhatsApp metni `onenoteWhatsApp`.
 * Saf: testli (`tests/unit/onenoteShare.test.ts`).
 */

/** "Metni kopyala"nın üst sınırı: panoya notun tamamı gider. */
export const SHARE_COPY_MAX = 100_000

export interface SharePage {
  title: string
  crumb: string
  webUrl?: string | null
}

/** Sayfanın düz metni, satır sonlarıyla. */
export const pageText = (html: unknown, max = SHARE_COPY_MAX) => textExcerpt(html, max, "\n")

/** Teams'in "Teams'te paylaş" penceresi: bağlantı önizlemeli, alıcıyı kişi seçer. */
export function shareTeamsUrl(page: SharePage): string | null {
  if (!page.webUrl) return null
  const q = new URLSearchParams({ href: page.webUrl, msgText: page.title, preview: "true" })
  return `https://teams.microsoft.com/share?${q.toString().replace(/\+/g, "%20")}`
}
