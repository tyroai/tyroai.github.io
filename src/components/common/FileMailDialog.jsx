import { useState } from "react"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import { useMsal } from "@azure/msal-react"
import { Dialog } from "@/components/ui/dialog"
import { MailCompose } from "@/components/common/MailCompose"
import { fileMeta } from "@/lib/fileMeta"
import { useRecentPeople } from "@/hooks/useRecentPeople"
import { sendWithConsent, unresolvedRecipients } from "@/lib/mailSend"
import { MAX_ATTACHMENT_BYTES, sendFileMail } from "@/lib/sendFileMail"
import { showResultToast } from "@/lib/refreshToast"
import { useLocale } from "@/hooks/useLocale"

/**
 * Dosyayı e-posta ile gönderme kutusu.
 *
 * Posta KULLANICININ KENDİ kutusundan, doğrudan Graph ile gider ve dosya
 * gerçek bir ek olarak eklenir; Gönderilmiş Öğeler'de de durur.
 *
 * Bir süre ikinci bir yol vardı: görevi tyroOffice ajanına devretmek.
 * Kaldırıldı, çünkü ölçüldü — ajan üzerinden gönderim ~90 saniye, buradan
 * birkaç saniye sürüyor. İki yolun tek farkı hızdı ve yavaş olanı seçmek
 * için bir sebep kalmamıştı. Devir mantığı panelin diğer iki menü öğesinde
 * (özetle / üzerinde çalış) yaşamaya devam ediyor.
 *
 * Bunun iki bedeli var ve ikisi de görünür: ek en fazla ~3 MB olabilir
 * (Graph'ın tek istek sınırı) ve alıcının TAM ADRESİ gerekir — adı çözecek
 * bir ajan yok. Bkz. `src/lib/sendFileMail.js`.
 */

export function FileMailDialog({ item, onClose }) {
  return (
    <Dialog open={Boolean(item)} onOpenChange={(o) => !o && onClose()}>
      {item && <Body item={item} onClose={onClose} />}
    </Dialog>
  )
}

function Body({ item, onClose }) {
  const { t, locale } = useLocale()
  const { instance, accounts } = useMsal()
  const suggestions = useRecentPeople(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  const [to, setTo] = useState([])
  const [cc, setCc] = useState([])

  // Konu ve mesaj HAZIR gelir — "hızlı" olan bu. İkisi de düzenlenebilir,
  // çünkü kullanıcı ajana ne gittiğini görmeli ve gerekirse tek kelimeyi
  // değiştirebilmeli.
  const [subject, setSubject] = useState(() => item.name.replace(/\.[^.]+$/, ""))
  const [body, setBody] = useState(() => t("files.mailBodyDefault"))

  const canSend = to.length > 0 && subject.trim().length > 0 && !sending
  const tooLarge = item.size != null && item.size > MAX_ATTACHMENT_BYTES

  /**
   * Doğrudan gönderim — asistanı hiç karıştırmadan, dosyanın kendisini eke
   * koyarak. Alıcı ADRESİ olmayan satırlar gönderilmez: Exchange'in
   * çözemeyeceği bir adı yollamak, sessizce yanlış kişiye ulaşmak demektir.
   */
  async function sendDirect() {
    const missing = unresolvedRecipients([...to, ...cc])
    if (missing.length) {
      setError(t("files.mailNeedsAddress", { names: missing.join(", ") }))
      return
    }
    setError(null)
    setSending(true)
    const res = await sendWithConsent(instance, accounts[0], () =>
      sendFileMail(instance, accounts[0], { item, to, cc, subject: subject.trim(), body }),
    )
    setSending(false)
    if (res.ok) {
      showResultToast({
        title: t("files.mailSentTitle"),
        detail: t("files.mailSentDetail", { name: item.name }),
      })
      onClose()
      return
    }
    setError(
      res.reason === "too-large"
        ? t("files.mailTooLarge")
        : res.reason === "denied"
          ? t("files.mailDenied")
          : res.reason === "no-recipient"
            ? t("files.mailNeedsAddress", { names: to.map((p) => p.name).join(", ") })
            : res.reason === "no-file"
              ? t("files.mailNoFile")
              : // Graph'ın kendi cümlesi teşhis için tek kaynak: olduğu gibi.
                t("files.mailFailed", { detail: res.detail || "" }),
    )
  }

  const ext = item.name.match(/\.([a-z0-9]{1,5})$/i)?.[1] ?? "file"

  // TEK yol: doğrudan gönderim. Ajana devreden ikinci bir düğme ölçülüp kaldırıldı (~90 sn'ye
  // karşı birkaç saniye): aynı işi iki hızda yapan iki düğme yavaş olanı seçtiriyordu.
  return (
    <MailCompose
      icon={Mail01Icon}
      title={t("files.mailTitle")}
      subtitle={item.name}
      onClose={onClose}
      layerProps={{ "data-files-layer": "" }}
      to={to}
      onTo={setTo}
      cc={cc}
      onCc={setCc}
      suggestions={suggestions}
      subject={subject}
      onSubject={setSubject}
      body={body}
      onBody={setBody}
      attachment={{ badge: ext, name: item.name, meta: fileMeta(item, locale) }}
      error={error ?? (tooLarge ? t("files.mailTooLarge") : null)}
      note={t("files.mailHandoffNote")}
      send={{
        label: sending ? t("files.mailSending") : t("files.mailSend"),
        onClick: sendDirect,
        disabled: !canSend || tooLarge,
        busy: sending,
        title: tooLarge ? t("files.mailTooLarge") : undefined,
      }}
    />
  )
}
