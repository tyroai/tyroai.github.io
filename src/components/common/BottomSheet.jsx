import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetTitle,
} from "@/components/ui/sheet"
import { useBackToClose } from "@/hooks/useBackToClose"
import { useLocale } from "@/hooks/useLocale"
import { useKeepFieldVisible } from "@/hooks/useKeepFieldVisible"
import { useSheetDrag } from "@/hooks/useSheetDrag"
import { useReturnFocus } from "@/hooks/useReturnFocus"
import { useVisualViewport } from "@/hooks/useVisualViewport"
import { sheetLift } from "@/lib/sheetLift"
import { cn } from "@/lib/utils"

/**
 * Telefonun alttan açılan çekmecesi: sayfada yer kaplamayan ayrıntı (KPI'lar, süzgeçler)
 * dokununca burada açılır. Tutamak + başlık + kapat; içerik kendi içinde kayar, alt kenar
 * güvenli alana kadar dolgulu. Ekranı aşmaz (en çok %88). Ekran klavyesi açılınca çekmece
 * klavyenin ÜSTÜNE oturur ve görünen alana sığar (`lib/sheetLift`): yazı kutulu çekmeceler
 * (Anlat, talep formu, süzgeçler) klavyenin altında kalmaz. Kapanınca odak açan öğeye döner
 * (`useReturnFocus`; `returnFocus()` başka bir hedef verebilir); çağıranın `onCloseAutoFocus`u
 * `preventDefault` ederse dokunulmaz (odak sohbete bırakılıyor). `scrollLabel`: içerikte
 * odaklanabilir öğe yoksa kayan gövde odak alır (klavyeyle kaydırılsın), bu adla bölge olur.
 * Klavye çekmeceyi küçülttüğünde odaktaki yazı alanı gövdede görünür alana kaydırılır
 * (`hooks/useKeepFieldVisible`): ne yazıldığı klavyenin altında kalmaz.
 * Tutamak ve başlıktan aşağı sürüklenince çekmece parmağı 1:1 izler; bırakınca hız + mesafe
 * karar verir, yay bulunduğu yerden sürer, yay sürerken yeniden tutulabilir (`hooks/useSheetDrag`).
 * `footer`: kaymayan alt şerit (formun gönder düğmesi), gövdenin altında. `closeOnBack`: Geri
 * tuşu çekmeceyi kapatır (`true`) ya da bu işlevi çağırır (`false` dönerse açık kalır).
 */
export function BottomSheet({
  open,
  onOpenChange,
  title,
  description,
  className,
  onOpenAutoFocus,
  onCloseAutoFocus,
  onEscapeKeyDown,
  onPointerDownOutside,
  returnFocus,
  closeOnBack,
  scrollLabel,
  footer,
  children,
}) {
  const { t } = useLocale()
  const back = useReturnFocus(returnFocus)
  useBackToClose(open && Boolean(closeOnBack), () =>
    typeof closeOnBack === "function" ? closeOnBack() : onOpenChange(false),
  )
  // Koşulsuz dinlenir (kapalıyken de): kanca değeri taze tutar, açılışta bayat konum çizilmez.
  const viewport = useVisualViewport()
  const lift = sheetLift(viewport)
  const [body, setBody] = useState(null)
  useKeepFieldVisible(body, `${viewport.height}:${viewport.offsetTop}`)
  const { contentRef, overlayRef, grip } = useSheetDrag(() => onOpenChange(false))
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        ref={contentRef}
        overlayRef={overlayRef}
        side="bottom"
        showCloseButton={false}
        style={lift}
        onOpenAutoFocus={(e) => {
          back.onOpenAutoFocus()
          onOpenAutoFocus?.(e)
        }}
        onCloseAutoFocus={(e) => {
          onCloseAutoFocus?.(e)
          back.onCloseAutoFocus(e)
        }}
        onEscapeKeyDown={onEscapeKeyDown}
        onPointerDownOutside={onPointerDownOutside}
        // Açıklama yoksa Radix'in "Description eksik" uyarısı susturulur (bağlantı da kurulmaz).
        {...(description ? {} : { "aria-describedby": undefined })}
        className={cn(
          "max-h-[88dvh] rounded-t-[1.75rem] border-x-0 bg-background pb-[max(1rem,env(safe-area-inset-bottom))] text-sm",
          className,
        )}
      >
        <div {...grip} className="shrink-0">
          <span
            aria-hidden="true"
            className="mx-auto mt-2.5 block h-1.5 w-10 rounded-full bg-foreground/15 shortest:hidden"
          />
          <div className="flex items-center justify-between gap-3 px-5 pb-2 pt-2 shortest:pt-1.5">
            <SheetTitle className="text-[1rem] font-semibold tracking-[-0.01em]">
              {title}
            </SheetTitle>
            <SheetClose
              aria-label={t("sheet.close")}
              className="-me-2 grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-foreground/[0.05] hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 pointer-coarse:size-11"
            >
              <HugeiconsIcon icon={Cancel01Icon} className="size-4" strokeWidth={2} />
            </SheetClose>
          </div>
        </div>
        {description && <SheetDescription className="sr-only">{description}</SheetDescription>}
        <div
          ref={setBody}
          {...(scrollLabel ? { tabIndex: 0, role: "region", "aria-label": scrollLabel } : {})}
          className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-5 pb-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-brand/40"
        >
          {children}
        </div>
        {footer && <div className="shrink-0 border-t border-border/60 px-5 pt-3">{footer}</div>}
      </SheetContent>
    </Sheet>
  )
}
