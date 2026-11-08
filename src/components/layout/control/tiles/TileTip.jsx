import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Kutucuğun ana düğmesine ipucu: aracın ne işe yaradığı (fareyle üstüne gelince ya da klavyeyle
 * gelince; dokunmatikte açılmaz, düzenlerken kutucuk `inert`). Widget'ta katalogdaki kısa açıklama
 * (`widgets.catalog.<id>`), yerleşiklerde kendi cümlesi (`control.*.hint`).
 */
export function TileTip({ hint, title, children }) {
  if (!hint) return children
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      {/* `title`: küçük kutucukta ad görünmüyor — ipucunun başında. */}
      <TooltipContent className="flex-col items-start gap-0.5">
        {title && <span className="font-semibold">{title}</span>}
        <span>{hint}</span>
      </TooltipContent>
    </Tooltip>
  )
}
