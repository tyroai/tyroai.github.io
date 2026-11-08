import { lazy, Suspense, useRef, useState } from "react"
import { useIsMobile } from "@/hooks/use-mobile"
import { useLocale } from "@/hooks/useLocale"

const loadPicker = () => import("./NotchSlotPicker")
const NotchSlotPicker = lazy(loadPicker)

/**
 * "Çentiği düzenle" düğmesi — rayda değil, Anasayfa'nın düzenleme çubuğunda (`BoardEditBar`):
 * rayın üstündeki kalem garip duruyordu (ürün sahibi). Görünüşü çağıran verir (`className`,
 * `children`). Seçici ilk basışta iner (üstüne gelince önden istenir); bir kez inince mount kalır ki
 * kapanış hareketi ve odağın düğmeye dönüşü işlesin. Masaüstü/tablette düğmenin altında açılır
 * pencere, telefonda alttan çekmece.
 */
export function NotchEditButton({ className, children }) {
  const { t } = useLocale()
  const ref = useRef(null)
  const mobile = useIsMobile()
  const [open, setOpen] = useState(false)
  const [loaded, setLoaded] = useState(false)
  return (
    <>
      <button
        ref={ref}
        type="button"
        title={t("notch.edit")}
        aria-haspopup="dialog"
        aria-expanded={open}
        data-state={open ? "open" : "closed"}
        onPointerEnter={loadPicker}
        onFocus={loadPicker}
        onClick={() => {
          setLoaded(true)
          setOpen((v) => !v)
        }}
        className={className}
      >
        {children}
      </button>
      {loaded && (
        <Suspense fallback={null}>
          <NotchSlotPicker
            anchor={ref}
            opener={ref}
            open={open}
            onOpenChange={setOpen}
            mobile={mobile}
            side="bottom"
          />
        </Suspense>
      )}
    </>
  )
}
