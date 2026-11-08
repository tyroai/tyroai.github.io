import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import BubbleChatIcon from "@hugeicons/core-free-icons/BubbleChatIcon"
import Copy01Icon from "@hugeicons/core-free-icons/Copy01Icon"
import TextIcon from "@hugeicons/core-free-icons/TextIcon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import NotebookTabsIcon from "@hugeicons/core-free-icons/NotebookTabsIcon"
import PencilEdit02Icon from "@hugeicons/core-free-icons/PencilEdit02Icon"
import WhatsappIcon from "@hugeicons/core-free-icons/WhatsappIcon"
import { OneNoteMailDialog } from "@/components/onenote/OneNoteMailDialog"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { formatAgo } from "@/lib/date"
import { whatsAppText, whatsAppUrl } from "@/lib/onenote/onenoteWhatsApp"
import { showResultToast } from "@/lib/refreshToast"
import { noteBody, noteTitle, STICKY_SECTION, teamsShareUrl } from "./lib/stickyNotes"
import { ColorDots } from "./ColorDots"

const ITEM = "gap-2.5 pointer-coarse:min-h-11"

/**
 * Tek yapışkan not: renkli kâğıt, metne basınca yerinde düzenlenir. Köşedeki ⋯ menüsü: Düzenle ·
 * renk · Kopyala (düz metin) · E-postayla gönder (notun kendisi, `OneNoteMailDialog`) · Teams'te
 * paylaş (Teams'in penceresi, metin hazır) · WhatsApp'ta gönder / için kopyala (`onenoteWhatsApp`) ·
 * OneNote'ta aç · Sil (5 sn "Geri al"lı, çağıranda).
 */
export function StickyCard({ note, onEdit, onColor, onDelete }) {
  const { t, locale } = useLocale()
  const [mail, setMail] = useState(false)
  const title = noteTitle(note.text)
  const html = noteBody(note.text)
  // İlk satır başlığa sığıyorsa WhatsApp'ta kalın başlık olur, sığmıyorsa metin olduğu gibi.
  const first = note.text.split("\n")[0].trim()
  const wa = () => whatsAppText({ title: first === title ? title : "", crumb: "", html })
  const teams = teamsShareUrl(note.text, note.webUrl)
  const copy = async (value, plain = false) => {
    try {
      await navigator.clipboard.writeText(value)
      showResultToast(
        plain
          ? { title: t("widgets.sticky.copied") }
          : { title: t("onenote.share.waCopied"), detail: t("onenote.share.waCopiedDetail") },
      )
    } catch {
      showResultToast({ state: "error", title: t("onenote.share.copyFailed") })
    }
  }
  const sendWa = () => {
    const text = wa()
    const { url, cut } = whatsAppUrl(text)
    window.open(url, "_blank", "noopener,noreferrer")
    if (cut) copy(text)
  }
  const icon = (glyph) => <HugeiconsIcon icon={glyph} strokeWidth={1.8} aria-hidden="true" />
  return (
    <div className="st-card" data-color={note.color} aria-busy={note.pending || undefined}>
      <button
        type="button"
        className="st-card-body"
        disabled={note.pending}
        onClick={onEdit}
        // Ad görünen metnin kendisi (WCAG 2.5.3); ne yaptığı ek açıklamada.
        aria-description={t("widgets.sticky.edit")}
      >
        <span dir="auto" data-private="" className="st-text">
          {note.text}
        </span>
        <span className="st-meta">
          {note.pending ? t("widgets.sticky.saving") : formatAgo(note.modified, locale)}
        </span>
      </button>
      {!note.pending && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="st-more"
              aria-label={t("widgets.sticky.more", { title })}
              title={t("widgets.sticky.moreShort")}
            >
              <HugeiconsIcon icon={MoreHorizontalIcon} strokeWidth={2} aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="min-w-56">
            <DropdownMenuItem className={ITEM} onSelect={onEdit}>
              {icon(PencilEdit02Icon)}
              {t("widgets.sticky.edit")}
            </DropdownMenuItem>
            <DropdownMenuLabel className="pb-1 pt-2 text-[0.6875rem] font-medium text-muted-foreground">
              {t("widgets.sticky.color")}
            </DropdownMenuLabel>
            <div className="px-2 pb-2">
              <ColorDots value={note.color} onChange={onColor} />
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem className={ITEM} onSelect={() => copy(note.text, true)}>
              {icon(TextIcon)}
              {t("widgets.sticky.copy")}
            </DropdownMenuItem>
            <DropdownMenuItem className={ITEM} onSelect={() => setMail(true)}>
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
            <DropdownMenuItem className={ITEM} onSelect={sendWa}>
              {icon(WhatsappIcon)}
              {t("onenote.share.whatsapp")}
            </DropdownMenuItem>
            <DropdownMenuItem className={ITEM} onSelect={() => copy(wa())}>
              {icon(Copy01Icon)}
              {t("onenote.share.whatsappCopy")}
            </DropdownMenuItem>
            {note.webUrl && (
              <DropdownMenuItem asChild className={ITEM}>
                <a href={note.webUrl} target="_blank" rel="noopener noreferrer">
                  {icon(NotebookTabsIcon)}
                  {t("widgets.sticky.openOneNote")}
                </a>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem variant="destructive" className={ITEM} onSelect={onDelete}>
              {icon(Delete02Icon)}
              {t("widgets.sticky.delete")}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      )}
      <OneNoteMailDialog
        open={mail}
        onClose={() => setMail(false)}
        title={title}
        crumb={STICKY_SECTION}
        html={html}
      />
    </div>
  )
}
