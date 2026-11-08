import { useState } from "react"
import { useBackToClose } from "@/hooks/useBackToClose"
import { useReturnFocus } from "@/hooks/useReturnFocus"

/**
 * Talep formunun kapanışı: dolu form sormadan kapanmaz ("Girdiklerin ne olsun?" — `confirm`), ✓
 * görünürken kapatma yok sayılır (gönderim sürüyor), Geri tuşu açık onayı kapatır, telefonun özet
 * adımından girişlere döner, dolu formda sorar. Gönderildiyse odak tetiğe dönmez (sohbetin yazma
 * alanına bırakılır). `back`: açılış ve kapanışta odak yönetimi (`useReturnFocus`, açan öğe `from`).
 */
export function useRequestClose({ open, onClose, from, form, sub, steps }) {
  const [confirm, setConfirm] = useState(false)
  const back = useReturnFocus(() => from)

  const close = () => {
    sub.markClosed()
    setConfirm(false)
    onClose()
  }
  const guarded = () => form.dirty && !sub.sent.current
  const requestClose = () => {
    if (sub.done) return
    if (guarded()) setConfirm(true)
    else close()
  }
  useBackToClose(open, () => {
    if (sub.done) return false
    if (confirm) {
      setConfirm(false)
      return false
    }
    if (steps.step === "summary") {
      steps.back()
      return false
    }
    if (guarded()) {
      setConfirm(true)
      return false
    }
    close()
  })

  const onCloseAutoFocus = (e) => {
    if (sub.sent.current) e.preventDefault()
    back.onCloseAutoFocus(e)
  }
  const onOpenChange = (o) => !o && requestClose()
  return { back, confirm, setConfirm, close, requestClose, onOpenChange, onCloseAutoFocus }
}
