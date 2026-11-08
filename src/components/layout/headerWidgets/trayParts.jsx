import { cloneElement, lazy, Suspense, useRef, useState } from "react"
import { BottomSheet } from "@/components/common/BottomSheet"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { WidgetBoundary } from "@/features/widgets/WidgetBoundary"
import { useChipLook } from "./chipLook"
import { GooBridge } from "./goo/GooBridge"
import { gooAllowed } from "./goo/gooModel"
import "./goo/goo.css"
import { TrayGlyph } from "./faces/TrayGlyph"
import { TRAY_PANEL } from "./trayIcon"
import { TRAY_BTN } from "./trayStyles"
import { LiveLabel } from "./WidgetLabels"

const HeaderWidgetBody = lazy(() => import("./HeaderWidgetBody"))
// Header'a özel pencereler, kartın kendisi yerine (Piyasa: büyük kur karoları ve header'daki
// kurlar). Piyasa burada; widget'ın kendi kaydettikleri (`TRAY_PANEL`: Tyrofy'ın
// sahnesi) kayıttan — paylaşılan kod widget klasörüne uzanmaz.
const OWN_PANEL = {
  market: lazy(() => import("./faces/MarketPanel")),
  ...Object.fromEntries(Object.entries(TRAY_PANEL).map(([id, load]) => [id, lazy(load)])),
}

/**
 * Tepsideki tek widget'ın düğmesi: yüzü (`TrayGlyph`: renkli hava, kulaklıklı küre, kadran …) ve
 * canlı küçük bilgi. Ad ekran okuyucuda yüzün önünde; görünen bilgi de adın içinde kalır
 * ("Hava durumu 21°"). `chip`: header'da seçilen görünüm — Açık, Koyu, Cam, Renkli kapsül
 * (`chipLook`); seçilmediyse çıplak ikon. `face`: ne görünsün (`faceOptions`). `as="span"`:
 * katalogdaki önizleme (düğme içinde düğme olmasın).
 */
export function TrayIcon({
  id,
  title,
  live = true,
  chip,
  face,
  as: Tag = "button",
  className,
  children,
  ref,
  ...rest
}) {
  const look = useChipLook(chip)
  return (
    <Tag
      ref={ref}
      {...(Tag === "button" ? { type: "button" } : {})}
      data-tray-icon={id}
      {...look}
      className={cn(TRAY_BTN, look["data-chip-look"] && "tray-chip", className)}
      {...rest}
    >
      <span className="sr-only">{title}</span>
      <TrayGlyph id={id} live={live} face={face} badge />
      {live && <LiveLabel id={id} face={face} />}
      {children}
    </Tag>
  )
}

/**
 * Toplu tepsinin yüzü: üstteki widget'ın ikonu ve canlı bilgisi, altında yığındaki widget
 * sayısınca nokta (iOS'un sayfa noktaları gibi; üstteki koyu). Genişlik eklemez.
 */
export function StackGlyph({ items, top, live = true, face }) {
  return (
    <span className="flex flex-col items-center gap-[3px] pt-[3px]">
      <span className="flex items-center gap-1">
        <TrayGlyph id={top} live={live} face={face} badge />
        {live && <LiveLabel id={top} face={face} />}
      </span>
      <span aria-hidden="true" className="flex gap-[3px]">
        {items.map((id) => (
          <span
            key={id}
            className={cn(
              "size-[3px] rounded-full bg-current",
              id === top ? "opacity-80" : "opacity-25",
            )}
          />
        ))}
      </span>
    </span>
  )
}

/**
 * Widget'ın kendisi, pencerenin ölçüsünde; kod gelene kadar kartın iskeleti. Header'a özel
 * penceresi olan widget'ta (`OWN_PANEL`) o pencere — tepside de toplu tepsinin sekmesinde de.
 */
export function WidgetPanel({ id, look, className }) {
  const Own = OWN_PANEL[id]
  if (Own)
    return (
      <Suspense
        fallback={
          <div aria-hidden="true" className="ms-surface ms-skeleton h-60 rounded-[1.75rem]" />
        }
      >
        <Own look={look} />
      </Suspense>
    )
  return (
    // `data-panel`: widget kendi CSS'iyle pencere boyunu değiştirebilir (ör. yapışkan notlar).
    <div data-panel={id} className={cn("h-60 text-base", className)}>
      <Suspense
        fallback={
          <div
            aria-hidden="true"
            className="ms-surface flex h-full flex-col gap-3 rounded-[1.75rem] p-5"
          >
            <span className="ms-skeleton block h-4 w-28 rounded-full" />
            <span className="ms-skeleton mt-auto block h-9 w-2/3 rounded-xl" />
            <span className="ms-skeleton block h-3 w-1/2 rounded-full" />
          </div>
        }
      >
        <WidgetBoundary id={id}>
          <HeaderWidgetBody id={id} look={look} />
        </WidgetBoundary>
      </Suspense>
    </div>
  )
}

/**
 * Tepsinin açılır yüzeyi: masaüstünde ve tablette düğmenin altında açılır pencere (ipucu
 * balonlu), telefonda alttan çekmece. Tetikleyici `trigger` (ref ve olayları alan düğme).
 * `side`: çentiğin widget yuvası pencereyi rayın soluna açar. `goo`: pencere düğmenin
 * kapsülünden sıvı gibi açılır (`GooBridge`; kendi zemini olmayan pencerede kapatılır).
 */
export function TrayOverlay({
  mobile,
  open,
  onOpenChange,
  trigger,
  tip,
  title,
  className,
  side = "bottom",
  align = "center",
  sideOffset = 8,
  goo = true,
  children,
}) {
  const triggerRef = useRef(null)
  const contentRef = useRef(null)
  const [gooOn] = useState(
    () =>
      goo &&
      typeof window !== "undefined" &&
      gooAllowed({
        userAgent: navigator.userAgent,
        reducedMotion: window.matchMedia?.("(prefers-reduced-motion: reduce)").matches,
      }),
  )
  if (mobile) {
    return (
      <>
        {/* Çekmece diyalog; düğme onu açar (Popover'ın tetikleyicisi gibi durum taşır). */}
        {cloneElement(trigger, {
          "aria-haspopup": "dialog",
          "aria-expanded": open,
          onClick: () => onOpenChange(!open),
        })}
        <BottomSheet open={open} onOpenChange={onOpenChange} title={title}>
          {children}
        </BottomSheet>
      </>
    )
  }
  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger ref={triggerRef} asChild>
            {trigger}
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>{tip ?? title}</TooltipContent>
      </Tooltip>
      <PopoverContent
        ref={contentRef}
        data-goo={gooOn && open ? "" : undefined}
        side={side}
        align={align}
        sideOffset={sideOffset}
        collisionPadding={12}
        aria-label={title}
        className={className}
      >
        {children}
      </PopoverContent>
      {gooOn && <GooBridge open={open} triggerRef={triggerRef} contentRef={contentRef} />}
    </Popover>
  )
}
