import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import BubbleChatIcon from "@hugeicons/core-free-icons/BubbleChatIcon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import Link01Icon from "@hugeicons/core-free-icons/Link01Icon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import Share08Icon from "@hugeicons/core-free-icons/Share08Icon"
import SmartPhone01Icon from "@hugeicons/core-free-icons/SmartPhone01Icon"
import WhatsappIcon from "@hugeicons/core-free-icons/WhatsappIcon"
import { ActionButton } from "@/components/common/ActionButton"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { showResultToast } from "@/lib/refreshToast"
import { pageText, shareTeamsUrl } from "@/lib/onenote/onenoteShare"
import { whatsAppText, whatsAppUrl } from "@/lib/onenote/onenoteWhatsApp"
import { OneNoteMailDialog } from "./OneNoteMailDialog"

const ITEM = "gap-2.5 pointer-coarse:min-h-11"

/**
 * Okuyucunun "Paylaş" menüsü (araç satırında Düzenle'nin ardından, simge + yazılı gri kapsül;
 * telefonun dip şeridinde yalnız simge):
 * - E-postayla gönder: notun KENDİSİ biçimiyle (`OneNoteMailDialog`; alıcının deftere erişimi yok).
 * - Teams'te paylaş: bağlantı (yalnız `webUrl` varsa).
 * - WhatsApp'ta gönder / WhatsApp için kopyala: WhatsApp biçimli metin (`*kalın*`, maddeler,
 *   ☐/☑; `lib/onenote/onenoteWhatsApp`). Adrese sığmayan uzun notta tamamı ayrıca panoya gider.
 * - Bağlantıyı kopyala · Metni kopyala.
 * Metin gerektirenler içerik inmeden kapalı.
 */
export function OneNoteShare({
  page,
  title,
  crumb,
  html,
  align = "end",
  iconOnly = false,
  className,
}) {
  const { t } = useLocale()
  const [mailOpen, setMailOpen] = useState(false)
  const teams = shareTeamsUrl({ title, crumb, webUrl: page.webUrl })
  const copy = async (value, done, detail) => {
    try {
      await navigator.clipboard.writeText(value)
      showResultToast({ title: done, detail })
    } catch {
      showResultToast({ state: "error", title: t("onenote.share.copyFailed") })
    }
  }
  const waText = () => whatsAppText({ title, crumb, html })
  const sendWhatsApp = () => {
    const text = waText()
    const { url, cut } = whatsAppUrl(text)
    // Pencere tıklamayla aynı anda açılır (açılır pencere engeline takılmasın); pano ardından.
    window.open(url, "_blank", "noopener,noreferrer")
    if (cut) copy(text, t("onenote.share.waLongTitle"), t("onenote.share.waLongDetail"))
  }
  const icon = (glyph) => <HugeiconsIcon icon={glyph} strokeWidth={1.8} aria-hidden="true" />
  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <ActionButton
            tone="soft"
            size="toolbar"
            iconOnly={iconOnly}
            aria-label={t("onenote.share.label")}
            title={t("onenote.share.label")}
            className={className}
          >
            <HugeiconsIcon icon={Share08Icon} strokeWidth={2} aria-hidden="true" />
            {!iconOnly && t("onenote.share.label")}
          </ActionButton>
        </DropdownMenuTrigger>
        <DropdownMenuContent align={align} className="min-w-60">
          <DropdownMenuItem disabled={!html} className={ITEM} onSelect={() => setMailOpen(true)}>
            {icon(Mail01Icon)}
            {t("onenote.share.mail")}
          </DropdownMenuItem>
          {teams && (
            <DropdownMenuItem asChild className={ITEM}>
              <a href={teams} target="_blank" rel="noopener noreferrer">
                {icon(BubbleChatIcon)}
                {t("onenote.share.teams")}
              </a>
            </DropdownMenuItem>
          )}
          <DropdownMenuItem disabled={!html} className={ITEM} onSelect={sendWhatsApp}>
            {icon(WhatsappIcon)}
            {t("onenote.share.whatsapp")}
          </DropdownMenuItem>
          <DropdownMenuItem
            disabled={!html}
            className={ITEM}
            onSelect={() =>
              copy(waText(), t("onenote.share.waCopied"), t("onenote.share.waCopiedDetail"))
            }
          >
            {icon(SmartPhone01Icon)}
            {t("onenote.share.whatsappCopy")}
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {page.webUrl && (
            <DropdownMenuItem
              className={ITEM}
              onSelect={() => copy(page.webUrl, t("onenote.share.linkCopied"))}
            >
              {icon(Link01Icon)}
              {t("onenote.share.copyLink")}
            </DropdownMenuItem>
          )}
          <DropdownMenuItem
            disabled={!html}
            className={ITEM}
            onSelect={() => copy(pageText(html), t("onenote.share.textCopied"))}
          >
            {icon(Copy01Icon)}
            {t("onenote.share.copyText")}
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
      <OneNoteMailDialog
        open={mailOpen}
        onClose={() => setMailOpen(false)}
        title={title}
        crumb={crumb}
        html={html}
      />
    </>
  )
}
