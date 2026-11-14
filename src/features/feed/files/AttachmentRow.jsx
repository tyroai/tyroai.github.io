import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowUpRight01Icon from "@hugeicons/core-free-icons/ArrowUpRight01Icon"
import Download04Icon from "@hugeicons/core-free-icons/Download04Icon"
import Loading03Icon from "@hugeicons/core-free-icons/Loading03Icon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import MoreHorizontalIcon from "@hugeicons/core-free-icons/MoreHorizontalIcon"
import ViewIcon from "@hugeicons/core-free-icons/ViewIcon"
import { FileBadge } from "@/components/common/FileBadge"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useLocale } from "@/hooks/useLocale"
import { formatSize } from "@/lib/fileMeta"
import { formatFileTime } from "@/lib/filesFormat"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { AttachmentPreviewDialog } from "./AttachmentPreviewDialog"
import { ROW_MENU_REVEAL } from "./FileRow"

/**
 * E-posta ekinin ⋯ menüsü (dosya satırının menüsüyle aynı yerde ve davranışta): Önizle, İndir,
 * Postayı Outlook'ta aç. Tetik ince işaretçide satırın üstüne gelince / odakta görünür,
 * dokunmatikte her zaman.
 */
function AttachmentMenu({ item, busy, onPreview, onDownload }) {
  const { t } = useLocale()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          aria-label={t("myfiles.row.more", { name: item.name })}
          title={t("myfiles.row.moreShort")}
          className={cn(
            "grid size-8 shrink-0 place-items-center rounded-lg text-muted-foreground transition hover:bg-accent/60 hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=open]:bg-accent/60 [@media(pointer:coarse)]:size-10",
            ROW_MENU_REVEAL,
          )}
        >
          <HugeiconsIcon
            icon={busy ? Loading03Icon : MoreHorizontalIcon}
            className={cn("size-4", busy && "animate-spin motion-reduce:animate-none")}
            strokeWidth={2}
          />
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="end"
        className="w-56 p-1.5"
        // Sohbet rıhtımı Escape'i pencerede dinliyor: menüyü kapatan Escape rıhtımı kapatmasın.
        onEscapeKeyDown={(e) => e.stopPropagation()}
      >
        <DropdownMenuItem onSelect={onPreview}>
          <HugeiconsIcon icon={ViewIcon} strokeWidth={1.9} />
          {t("myfiles.row.preview")}
        </DropdownMenuItem>
        <DropdownMenuItem onSelect={() => onDownload(item)} disabled={busy}>
          <HugeiconsIcon icon={Download04Icon} strokeWidth={1.9} />
          {t("files.download")}
        </DropdownMenuItem>
        {item.webLink && (
          <DropdownMenuItem asChild>
            <a href={item.webLink} target="_blank" rel="noopener noreferrer">
              <HugeiconsIcon icon={ArrowUpRight01Icon} strokeWidth={1.9} />
              {t("myfiles.mail.openMail")}
            </a>
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * E-posta eki satırı — dosya satırıyla (`FileRow`) aynı davranış: satıra basınca büyük önizleme
 * açılır (`AttachmentPreviewDialog`; resim, PDF, yazı, HTML), ⋯ menüsünde Önizle · İndir ·
 * Postayı Outlook'ta aç. `flat` (Tümü'nün zaman çizgisi): tek meta satırı — posta glifi + konu
 * (dar ekranda yok), gönderen, göreli zaman, boyut. İndirme `onDownload` ile (üst bileşenin
 * kancası: `busy` o satırın beklediğini söyler); önizleme penceresi satırın kendi durumu.
 */
export function AttachmentRow({ item, busy, onDownload, flat = false, now }) {
  const { t, locale } = useLocale()
  const [open, setOpen] = useState(false)
  const day = !item.received
    ? ""
    : flat
      ? formatFileTime(item.received, now, locale)
      : getDateTimeFormat(locale, { day: "numeric", month: "short" }).format(
          new Date(item.received),
        )
  const meta = [item.from, day, formatSize(item.size, locale)].filter(Boolean).join(" · ")
  return (
    <li className="group/row flex min-w-0 items-center gap-1 rounded-[1.125rem] pe-1.5 transition-colors hover:bg-foreground/[0.03]">
      {/* Satırın tamamı önizler; sağda ⋯ menüsü (düğmenin kardeşi: iç içe düğme yok). */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-label={t("myfiles.mail.previewNamed", { name: item.name })}
        className="flex min-w-0 flex-1 items-center gap-3 rounded-[1.125rem] px-3 py-2.5 text-start focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
      >
        <FileBadge item={{ kind: "file", ext: item.ext }} size="md" />
        <span data-private="" className="min-w-0 flex-1">
          <span className="block truncate text-[0.875rem] font-medium leading-snug">
            {item.name}
          </span>
          {flat ? (
            <span className="mt-0.5 flex min-w-0 items-center gap-1 text-[0.75rem] leading-4 text-muted-foreground">
              <HugeiconsIcon
                icon={Mail01Icon}
                className="size-3 shrink-0 opacity-70"
                strokeWidth={1.9}
                aria-hidden="true"
              />
              {/* Dar ekranda konu sığmıyor: gönderen ve zaman kalır. */}
              {item.subject && (
                <span lang="tr" className="hidden min-w-0 truncate @[34rem]/files:inline">
                  {item.subject}
                </span>
              )}
              <span
                className={cn(
                  "truncate",
                  item.subject && "@[34rem]/files:max-w-[65%] @[34rem]/files:shrink-0",
                )}
              >
                {item.subject && <span className="hidden @[34rem]/files:inline"> · </span>}
                {meta}
              </span>
            </span>
          ) : (
            <span className="block truncate text-[0.75rem] leading-4 text-muted-foreground">
              {meta}
            </span>
          )}
          {!flat && item.subject && (
            <span
              lang="tr"
              className="block truncate text-[0.75rem] leading-4 text-muted-foreground"
            >
              {item.subject}
            </span>
          )}
        </span>
      </button>
      <AttachmentMenu
        item={item}
        busy={busy}
        onPreview={() => setOpen(true)}
        onDownload={onDownload}
      />
      {open && <AttachmentPreviewDialog item={item} onClose={() => setOpen(false)} />}
    </li>
  )
}
