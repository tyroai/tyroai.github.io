import { useLocale } from "@/hooks/useLocale"
import { NOTCH_SLOT_MAX } from "@/lib/notchSlots"
import { notify } from "@/lib/notify"
import {
  HEADER_MAX,
  addHeaderWidget,
  removeHeaderWidget,
  useHeaderWidgets,
} from "../headerWidgets/headerStore"
import { setNotchSlots, useNotchSlots } from "../notch/notchSlotStore"

/**
 * Widget'ın kalıcı yeri (iğne menüsü ve kutucuğun sağ tık menüsü ortak): header'da ve/veya
 * çentikte göster. Doluysa söyler; çentiğin son öğesi bırakılamaz (ray boş kalmaz — çentiğin
 * kuralı: `notchLocked`).
 */
export function usePinToggles(id) {
  const { t } = useLocale()
  const { items } = useHeaderWidgets()
  const slots = useNotchSlots()
  const inHeader = items.includes(id)
  const inNotch = slots.includes(id)
  return {
    inHeader,
    inNotch,
    notchLocked: inNotch && slots.length <= 1,
    toggleHeader: () => {
      if (inHeader) removeHeaderWidget(id)
      else if (!addHeaderWidget(id)) notify.info(t("headerWidgets.full", { n: HEADER_MAX }))
    },
    toggleNotch: () => {
      if (inNotch) setNotchSlots(slots.filter((x) => x !== id))
      else if (slots.length >= NOTCH_SLOT_MAX) notify.info(t("notch.full", { n: NOTCH_SLOT_MAX }))
      else setNotchSlots([...slots, id])
    },
  }
}
