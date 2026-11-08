import { useRef, useState } from "react"
import { AlertDialog } from "radix-ui"
import { HugeiconsIcon } from "@hugeicons/react"
import ArrowTurnBackwardIcon from "@hugeicons/core-free-icons/ArrowTurnBackwardIcon"
import Delete02Icon from "@hugeicons/core-free-icons/Delete02Icon"
import FloppyDiskIcon from "@hugeicons/core-free-icons/FloppyDiskIcon"
import NoteEditIcon from "@hugeicons/core-free-icons/NoteEditIcon"
import { useLocale } from "@/hooks/useLocale"
import { useReturnFocus } from "@/hooks/useReturnFocus"
import { cn } from "@/lib/utils"

// Sohbet rıhtımı Escape'i pencerede dinliyor: onayı kapatan Escape rıhtımı kapatmasın.
const keepEscape = (e) => e.stopPropagation()
// Etiket kırılmaz: uzun dillerde (ru, ar) iki düğme yan yana sığmazsa alt alta geçer. `flex-1`
// yalnız yan yanayken: dikey dizilimde yüksekliği ezer (düğme yazı boyuna çöker).
const BUTTON =
  "inline-flex h-11 items-center justify-center gap-2 whitespace-nowrap rounded-full px-4 text-[0.875rem] font-semibold transition min-[400px]:flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 focus-visible:ring-offset-2 focus-visible:ring-offset-popover pointer-coarse:h-12 [&_svg]:size-[1.125rem] [&_svg]:shrink-0"

/**
 * "Girdiklerin ne olsun?" — dolu talep formu Escape, ×, Vazgeç ya da Geri ile kapatılmak
 * istenince. Üç yol: taslak olarak saklayıp kapat (ilk odak burada: yıkıcı değil, bir sonraki
 * açılışta form kaldığı yerden döner), forma dön (Escape de), sil ve kapat. Formda ne olduğu tek
 * satırda (`summary`: "3 kalem · ₺4.150,00 · 2 fiş"; `icon`: talebin simgesi) ve açıklamaya
 * dahil, ekran okuyucu da duyurur. Kapatan iki yolda odak onayı açan öğeye dönmez (form verir).
 */
export function DiscardConfirm({
  open,
  onKeep,
  onKeepDraft,
  onDiscard,
  fallback,
  summary = null,
  icon = null,
}) {
  const { t } = useLocale()
  const closing = useRef(false)
  const save = useRef(null)
  const back = useReturnFocus(null, fallback)
  // Onay kapanırken üst bileşen özeti boşaltır: kapanış animasyonunda kutu yerinde kalsın.
  const [shown, setShown] = useState(summary)
  if (open && summary !== shown) setShown(summary)
  const leave = (fn) => () => {
    closing.current = true
    fn()
  }
  return (
    <AlertDialog.Root open={open} onOpenChange={(o) => !o && onKeep()}>
      <AlertDialog.Portal>
        <AlertDialog.Overlay className="fixed inset-0 z-[60] bg-black/30 backdrop-blur-[2px] data-open:animate-in data-open:fade-in-0 data-closed:animate-out data-closed:fade-out-0" />
        <AlertDialog.Content
          onEscapeKeyDown={keepEscape}
          onOpenAutoFocus={(e) => {
            closing.current = false
            back.onOpenAutoFocus()
            e.preventDefault()
            save.current?.focus()
          }}
          onCloseAutoFocus={(e) => {
            if (closing.current) e.preventDefault()
            back.onCloseAutoFocus(e)
          }}
          className="fixed left-1/2 top-1/2 z-[60] w-[calc(100vw-2rem)] max-w-[25rem] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-[1.5rem] bg-popover p-6 text-popover-foreground shadow-[0_32px_64px_-24px_rgb(0_0_0/0.45),0_12px_24px_-12px_rgb(0_0_0/0.18)] ring-1 ring-foreground/10 duration-200 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-open:slide-in-from-bottom-2 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 dark:shadow-[0_32px_64px_-24px_rgb(0_0_0/0.8)]"
        >
          {/* Üstte markanın sakin hâlesi: karar yıkıcı değil, taslak güvende. */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[radial-gradient(75%_100%_at_12%_0%,color-mix(in_oklab,var(--brand-via)_14%,transparent),transparent)]"
          />
          <span
            aria-hidden="true"
            className="relative mb-5 grid size-12 place-items-center rounded-2xl bg-brand/[0.1] text-brand-ink shadow-[0_10px_24px_-12px_var(--brand-via)] ring-1 ring-brand/20 animate-in zoom-in-75 fade-in-0 duration-300 motion-reduce:animate-none"
          >
            <HugeiconsIcon icon={NoteEditIcon} className="size-[1.375rem]" strokeWidth={1.9} />
          </span>
          <AlertDialog.Title className="relative text-[1.125rem] font-semibold tracking-[-0.015em]">
            {t("selfService.form.discard.title")}
          </AlertDialog.Title>
          <AlertDialog.Description asChild>
            <div className="relative mt-1.5">
              <p className="text-[0.875rem] leading-relaxed text-muted-foreground">
                {t("selfService.form.discard.body")}
              </p>
              {shown && (
                <div className="mt-4 flex items-center gap-3 rounded-2xl bg-muted/70 px-3.5 py-3 ring-1 ring-inset ring-black/[0.04] dark:ring-white/[0.06]">
                  {icon && (
                    <span
                      aria-hidden="true"
                      className="grid size-9 shrink-0 place-items-center rounded-xl bg-background text-foreground/70 shadow-xs ring-1 ring-black/[0.06] dark:ring-white/[0.08]"
                    >
                      <HugeiconsIcon icon={icon} className="size-[1.125rem]" strokeWidth={1.8} />
                    </span>
                  )}
                  <div className="min-w-0 leading-snug">
                    <div className="text-[0.75rem] text-foreground/70">
                      {t("selfService.form.discard.lost")}
                    </div>
                    <div className="truncate text-[0.875rem] font-semibold tabular-nums">
                      {shown}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </AlertDialog.Description>
          <div className="relative mt-6 space-y-2.5">
            <AlertDialog.Action
              ref={save}
              onClick={leave(onKeepDraft)}
              className={cn(
                BUTTON,
                "w-full bg-brand-fill-deep text-brand-on-brand shadow-[inset_0_1px_0_rgb(255_255_255/0.18),0_8px_20px_-8px_rgb(0_0_0/0.45)] hover:brightness-110 active:scale-[0.98]",
              )}
            >
              <HugeiconsIcon icon={FloppyDiskIcon} aria-hidden="true" strokeWidth={2} />
              {t("selfService.form.discard.keepDraft")}
            </AlertDialog.Action>
            <div className="flex flex-col-reverse gap-2.5 min-[400px]:flex-row min-[400px]:flex-wrap-reverse">
              <AlertDialog.Cancel
                className={cn(
                  BUTTON,
                  "border border-border bg-background text-foreground shadow-xs hover:bg-foreground/[0.04]",
                )}
              >
                <HugeiconsIcon icon={ArrowTurnBackwardIcon} aria-hidden="true" strokeWidth={2} />
                {t("selfService.form.discard.keep")}
                <kbd
                  aria-hidden="true"
                  className="hidden rounded-md border border-border bg-muted px-1.5 py-px font-sans text-[0.6875rem] font-medium leading-4 text-foreground/70 pointer-fine:inline"
                >
                  Esc
                </kbd>
              </AlertDialog.Cancel>
              <AlertDialog.Action
                onClick={leave(onDiscard)}
                className={cn(
                  BUTTON,
                  "border border-danger/25 bg-danger/[0.06] text-danger-ink hover:bg-danger/[0.1]",
                )}
              >
                <HugeiconsIcon icon={Delete02Icon} aria-hidden="true" strokeWidth={2} />
                {t("selfService.form.discard.confirm")}
              </AlertDialog.Action>
            </div>
          </div>
        </AlertDialog.Content>
      </AlertDialog.Portal>
    </AlertDialog.Root>
  )
}
