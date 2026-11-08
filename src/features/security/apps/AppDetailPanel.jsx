import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { BottomSheet } from "@/components/common/BottomSheet"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { useBackToClose } from "@/hooks/useBackToClose"
import { useLocale } from "@/hooks/useLocale"
import { useReturnFocus } from "@/hooks/useReturnFocus"
import { AppDetail } from "./AppDetail"
import { AppLogo } from "./AppLogo"

/**
 * Uygulama ayrıntısının kabı: masaüstünde sağ bölme (liste arkada yerinde kalır — Entra'nın ayrıntı
 * bölmesi), telefonda tam boy alt çekmece. İkisinde de Geri tuşu kapatır, odak açan satıra döner.
 */
export function AppDetailPanel({ ctx, app, open, phone, onClose, onShowUsers }) {
  const { t } = useLocale()
  const back = useReturnFocus()
  useBackToClose(open && !phone, onClose)
  if (!app) return null
  const body = <AppDetail key={app.key} ctx={ctx} app={app} onShowUsers={onShowUsers} />

  if (phone) {
    return (
      <BottomSheet
        open={open}
        onOpenChange={(o) => !o && onClose()}
        title={app.name}
        closeOnBack
        className="h-[88dvh]"
      >
        {body}
      </BottomSheet>
    )
  }

  return (
    <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
      <SheetContent
        side="right"
        showCloseButton={false}
        onOpenAutoFocus={back.onOpenAutoFocus}
        onCloseAutoFocus={back.onCloseAutoFocus}
        className="w-full gap-0 bg-background p-0 text-sm data-[side=right]:sm:max-w-[30rem]"
      >
        <div className="flex shrink-0 items-center gap-3 border-b border-border/60 px-5 py-4">
          <AppLogo app={app.group === "other" ? null : app} name={app.name} size="lg" />
          <div className="min-w-0 flex-1">
            <SheetTitle className="truncate text-[1.0625rem] font-semibold tracking-[-0.01em]">
              {app.name}
            </SheetTitle>
            <SheetDescription className="text-xs text-muted-foreground">
              {t(`authz.ws.group.${app.group}`)}
            </SheetDescription>
          </div>
          <SheetClose
            aria-label={t("sheet.close")}
            className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
          </SheetClose>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 py-4">{body}</div>
      </SheetContent>
    </Sheet>
  )
}
