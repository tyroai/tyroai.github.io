import { HugeiconsIcon } from "@hugeicons/react"
import ArrowExpand01Icon from "@hugeicons/core-free-icons/ArrowExpand01Icon"
import ArrowShrink01Icon from "@hugeicons/core-free-icons/ArrowShrink01Icon"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"
import { useRmText } from "../data/useRmText"
import { useRm } from "../shell/RmContext"

const SIZE = {
  md: "max-h-[min(90dvh,52rem)] w-[min(62rem,calc(100vw-2rem))]",
  xl: "h-[min(92dvh,72rem)] w-[min(90rem,calc(100vw-2rem))]",
}
const WHOLE =
  "top-0 left-0 h-dvh max-h-none w-screen translate-x-0 translate-y-0 rounded-none sm:max-h-none"

function RoundButton({ label, icon, onClick, ...rest }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      title={label}
      className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground hover:bg-foreground/[0.06] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:size-11"
      {...rest}
    >
      <HugeiconsIcon icon={icon} className="size-[1.125rem]" strokeWidth={1.8} />
    </button>
  )
}

/**
 * tyroRM düzenleme penceresi: başlık (ad, bağlam, araçlar), kayan gövde, yapışık alt şerit.
 * Telefonda tam ekran; geniş pencerede (`size="xl"`) tam ekran düğmesi (`onToggleFull`).
 * `initialFocus`: açılışta odaklanacak alanın seçicisi.
 */
export function EditWindow({
  open,
  onOpenChange,
  title,
  context,
  description,
  size = "md",
  full = false,
  onToggleFull = null,
  footer,
  bodyRef,
  initialFocus = null,
  children,
}) {
  const { rt } = useRmText()
  const { phone } = useRm()
  const whole = phone || full
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        showCloseButton={false}
        // Açılışta odak ilk işe yarayan alana (şartname focusSel); yoksa Radix ilk düğmeye verir.
        onOpenAutoFocus={(e) => {
          if (!initialFocus) return
          e.preventDefault()
          requestAnimationFrame(() => document.querySelector(initialFocus)?.focus())
        }}
        className={cn(
          "@container/edit flex max-w-none flex-col gap-0 overflow-hidden p-0 pb-0 text-sm sm:max-w-none sm:pb-0",
          whole ? WHOLE : SIZE[size],
        )}
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-border/60 px-5 py-4">
          <div className="min-w-0 flex-1">
            <DialogTitle className="truncate text-lg font-semibold leading-tight tracking-[-0.01em]">
              {title}
            </DialogTitle>
            {context ? (
              <p className="mt-0.5 truncate text-[0.8125rem] text-muted-foreground">{context}</p>
            ) : null}
            <DialogDescription className="sr-only">
              {description || context || title}
            </DialogDescription>
          </div>
          {onToggleFull && !phone ? (
            <RoundButton
              label={rt(full ? "rm.edit.exitFull" : "rm.edit.full")}
              icon={full ? ArrowShrink01Icon : ArrowExpand01Icon}
              onClick={onToggleFull}
              aria-pressed={full}
            />
          ) : null}
          <DialogClose asChild>
            <RoundButton label={rt("rm.action.close")} icon={Cancel01Icon} />
          </DialogClose>
        </div>
        <div
          ref={bodyRef}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4 @[48rem]/edit:px-6"
        >
          {children}
        </div>
        {footer ? (
          <div className="shrink-0 border-t border-border/60 bg-background px-5 py-3 pb-[max(env(safe-area-inset-bottom),0.75rem)] @[48rem]/edit:px-6">
            {footer}
          </div>
        ) : null}
      </DialogContent>
    </Dialog>
  )
}

/** Küçük gösterge karosu (Kişi ata ve tarih özeti). */
export function EditStat({ label, value, detail, tone, action }) {
  return (
    <div className="min-w-0 rounded-2xl bg-foreground/[0.035] px-3.5 py-3 dark:bg-white/[0.05]">
      <div className="text-[0.6875rem] font-medium uppercase tracking-[0.06em] text-foreground/65">
        {label}
      </div>
      <div
        className={cn(
          "mt-0.5 truncate text-lg font-semibold tabular-nums tracking-[-0.01em]",
          tone === "danger" && "text-danger-ink",
          tone === "ok" && "text-success-ink",
        )}
      >
        {value}
      </div>
      {detail || action ? (
        <div className="mt-0.5 flex min-w-0 items-center gap-1.5 text-xs text-foreground/65">
          <span className="min-w-0 truncate">{detail}</span>
          {action}
        </div>
      ) : null}
    </div>
  )
}
