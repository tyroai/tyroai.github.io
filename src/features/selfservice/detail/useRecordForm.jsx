import { useMemo, useState } from "react"
import { htmlDataUrl, printHtmlAttachment } from "@/lib/botFiles"
import { recordForm } from "@/features/selfservice/lib/recordForms"
import { formAllowed } from "@/lib/selfServiceStatus"
import { LazySignFormDialog } from "./LazySignFormDialog"

/**
 * Kaydın FORMU (`features/selfservice/lib/recordForms.js`) — sohbetteki izin ve masraf formunun
 * aynısı: izinde Yazdır + İmzala & Mail, masrafta Yazdır + Mail gönder. Avansın formu yok;
 * gönderilmemiş ve iptal edilmiş kayıtta da (`formAllowed`) `available` false. `dialog`: imza/mail
 * penceresi (açıkken), çağıran ağaca bir kez koyar.
 */
export function useRecordForm(record, person) {
  const [open, setOpen] = useState(false)
  const form = useMemo(() => recordForm(record, person), [record, person])
  const att = useMemo(
    () =>
      form
        ? { contentType: "text/html", name: form.name, contentUrl: htmlDataUrl(form.html) }
        : null,
    [form],
  )
  const available = Boolean(att) && formAllowed(record)
  const sign = record.kind === "leave"
  return {
    available,
    sign,
    print: () => att && printHtmlAttachment(att),
    send: () => setOpen(true),
    dialog:
      open && att ? (
        <LazySignFormDialog att={att} name={att.name} sign={sign} onClose={() => setOpen(false)} />
      ) : null,
  }
}
