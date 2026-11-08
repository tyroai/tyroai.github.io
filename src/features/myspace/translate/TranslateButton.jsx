import { useEffect, useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import TranslateIcon from "@hugeicons/core-free-icons/TranslateIcon"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { onDeviceTranslateReady } from "@/lib/onDeviceTranslate"
import { TranslateResult } from "./TranslateResult"
import { useTranslate } from "@/hooks/useTranslate"

/**
 * Soru kutusunda "Çevir": kutudaki metni CİHAZDA çevirir (`lib/onDeviceTranslate`), sonuç kutunun
 * altında açılır. Tarayıcı cihazda çeviremiyorsa (Safari, Firefox, telefon) metin çeviri isteğiyle
 * sohbete bırakılır (`onPark`) — bir asistan turu.
 */
export function TranslateButton({ text, onPark }) {
  const { t } = useLocale()
  const [open, setOpen] = useState(false)
  const tr = useTranslate()
  const label = t("myspace.translate.action")
  // Destek kutu ilk dolduğunda sorulur: basıldığında yanıt çoktan bellidir.
  useEffect(() => {
    onDeviceTranslateReady()
  }, [])

  async function onOpenChange(next) {
    if (!next) {
      setOpen(false)
      tr.reset()
      return
    }
    if (!(await onDeviceTranslateReady())) {
      onPark(t("myspace.translate.prompt", { text: text.trim() }))
      return
    }
    setOpen(true)
    tr.run(text.trim())
  }

  return (
    <Popover open={open} onOpenChange={onOpenChange}>
      <PopoverTrigger asChild>
        <button
          type="button"
          aria-label={label}
          title={label}
          className="grid size-9 shrink-0 place-items-center rounded-full text-muted-foreground transition hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand/40 data-[state=open]:bg-accent data-[state=open]:text-foreground"
        >
          <HugeiconsIcon icon={TranslateIcon} className="size-[1.125rem]" strokeWidth={1.8} />
        </button>
      </PopoverTrigger>
      <PopoverContent
        align="end"
        sideOffset={8}
        className="w-80 gap-2.5 rounded-2xl p-3 text-[0.8125rem]"
      >
        <TranslateResult text={text.trim()} tr={tr} onPark={onPark} />
      </PopoverContent>
    </Popover>
  )
}
