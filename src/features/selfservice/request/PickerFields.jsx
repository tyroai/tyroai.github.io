import { useState } from "react"
import { createPortal } from "react-dom"
import { HugeiconsIcon } from "@hugeicons/react"
import Calendar03Icon from "@hugeicons/core-free-icons/Calendar03Icon"
import { DatePickerBody } from "@/features/myspace/SlotPickers"
import { Popover, PopoverAnchor, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { useLocale } from "@/hooks/useLocale"
import { useMediaQuery } from "@/hooks/useMediaQuery"
import { getDateTimeFormat } from "@/lib/intl-cache"
import { cn } from "@/lib/utils"
import { CONTROL } from "./formUi"

const DATE = { weekday: "short", day: "numeric", month: "short", year: "numeric" }
// Sohbet rıhtımı Escape'i pencerede dinliyor: seçiciyi kapatan Escape rıhtımı kapatmasın.
const keepEscape = (e) => e.stopPropagation()

/**
 * Tarih alanı: düğme + açılır ay ızgarası (sohbet cümlesinin takvimi). `open`/`onOpenChange`
 * dışarıdan verilebilir: izin formunda başlangıç seçilince bitiş kendiliğinden açılır.
 * Ad, etiket + seçili gün (`aria-labelledby` kendini de anar). `trigger(open)`: düğmenin yerine
 * başka bir tetik (avansın tarih karosu); adı, durumu ve hata bağını kendisi taşır. Kısa ekranda
 * (yatay telefon) dokunmatik takvim alanın ne altına ne üstüne sığar: ekranın tepesinde, ortada
 * açılır. Yine de sığmazsa kutu kendi içinde kayar; ay başlığı ve okları üstte kalır.
 */
export function DateField({
  id,
  labelId,
  value,
  min,
  onPick,
  open,
  onOpenChange,
  error,
  errorId,
  format = DATE,
  trigger,
}) {
  const { t, locale } = useLocale()
  const [own, setOwn] = useState(false)
  const shown = open ?? own
  const setShown = onOpenChange ?? setOwn
  const short = useMediaQuery("(max-height: 500px)")
  return (
    <Popover open={shown} onOpenChange={setShown}>
      <PopoverTrigger asChild>
        {trigger ? (
          trigger(shown)
        ) : (
          <button
            id={id}
            type="button"
            aria-labelledby={`${labelId} ${id}`}
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? errorId : undefined}
            className={CONTROL}
          >
            <HugeiconsIcon
              icon={Calendar03Icon}
              aria-hidden="true"
              className="size-4 shrink-0 text-muted-foreground"
              strokeWidth={1.8}
            />
            <span className={cn("min-w-0 flex-1 truncate", !value && "text-muted-foreground")}>
              {value
                ? getDateTimeFormat(locale, format).format(value)
                : t("selfService.form.pickDate")}
            </span>
          </button>
        )}
      </PopoverTrigger>
      {/* Kısa ekranın çapası ekranın tepesinde, gövdede (çekmecenin kayması etkilemesin). Tetikten
          sonra çizilir: Radix çapayı en son bağlanan öğeden alıyor. */}
      {short &&
        createPortal(
          <PopoverAnchor
            aria-hidden="true"
            className="pointer-events-none fixed inset-x-3 top-1.5 h-0"
          />,
          document.body,
        )}
      <PopoverContent
        align={short ? "center" : "start"}
        sideOffset={6}
        collisionPadding={12}
        onEscapeKeyDown={keepEscape}
        // Radix içeriği "dialog": adı alanın etiketi ("Tarih", "Kalem 3 · Tarih").
        aria-labelledby={labelId}
        // İlk odak takvimin günü (seçili, yoksa bugün): oklarla hemen gezilir.
        onOpenAutoFocus={(e) => {
          const day = e.currentTarget?.querySelector?.("[data-day][tabindex='0']")
          if (!day) return
          e.preventDefault()
          day.focus()
        }}
        className="max-h-(--radix-popover-content-available-height) w-[17rem] gap-0 overflow-y-auto overscroll-contain p-0 pointer-coarse:w-[21rem]"
      >
        <DatePickerBody
          roomy
          value={value}
          min={min}
          rangeFrom={min}
          onPick={(d) => {
            setShown(false)
            onPick(d)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
