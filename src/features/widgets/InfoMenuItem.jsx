import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import InformationCircleIcon from "@hugeicons/core-free-icons/InformationCircleIcon"
import { DropdownMenuItem } from "@/components/ui/dropdown-menu"
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip"

/**
 * Kart menüsünün "Ne işe yarar?" satırı: üstüne gelince ya da klavyede üstündeyken widget'ın ne
 * yaptığı, özellikleri ve faydası yanda balonda (`widgets.info.<id>`). Seçmek menüyü kapatmaz,
 * balonu açıp kapatır — dokunmatikte üstüne gelme yok, dokunuş açar. Balon açıkken satır ekran
 * okuyucuya açıklamasıyla okunur (Radix `aria-describedby`).
 */
export function InfoMenuItem({ text, label, className }) {
  const [open, setOpen] = useState(false)
  return (
    <Tooltip open={open} onOpenChange={setOpen}>
      <TooltipTrigger asChild>
        <DropdownMenuItem
          className={className}
          onSelect={(e) => {
            e.preventDefault()
            setOpen((v) => !v)
          }}
        >
          <HugeiconsIcon icon={InformationCircleIcon} strokeWidth={1.8} />
          {label}
        </DropdownMenuItem>
      </TooltipTrigger>
      <TooltipContent side="right" align="start" className="max-w-64 text-[0.75rem] leading-snug">
        {text}
      </TooltipContent>
    </Tooltip>
  )
}
