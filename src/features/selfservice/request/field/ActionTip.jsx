import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Küçük düğmenin balonu (masraf kaleminin ikonları, avansın öneri çipleri): fareyle üstüne gelince
 * ya da klavye odağında kısa açıklama. Dokunmatikte balon yok; bilgi düğmenin adında da var.
 */
export function ActionTip({ label, children }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>{children}</TooltipTrigger>
      <TooltipContent side="top" className="text-[0.75rem]">
        {label}
      </TooltipContent>
    </Tooltip>
  )
}
