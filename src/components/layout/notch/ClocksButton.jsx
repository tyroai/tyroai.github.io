import "@/lib/i18n/notchInd"
import { forwardRef } from "react"
import { useLocale } from "@/hooks/useLocale"
import { fitText } from "@/lib/notchIndicator"
import { useClockIndicator } from "../headerWidgets/faces/useAwayCity"
import { RailButton } from "./RailButton"

/**
 * Saatler yuvasının düğmesi: rozet yerinde dünya saatinin iğnelenen ya da ilk uzak şehrinin saati
 * (yerel saat zaten ekranda). Ayrı ve hafif dosya: yerleşik yuvalar ilk pakette, widget
 * göstergelerinin tamamı (`SlotIndicator`) tembel widget yuvasıyla iner.
 */
export const ClocksButton = forwardRef(function ClocksButton({ label, ...props }, ref) {
  const { t } = useLocale()
  const ind = useClockIndicator(null)
  return (
    <RailButton
      ref={ref}
      label={label}
      srSuffix={ind ? t("notchInd.suffix", { value: ind.sr }) : undefined}
      value={fitText(ind?.text)}
      {...props}
    />
  )
})
