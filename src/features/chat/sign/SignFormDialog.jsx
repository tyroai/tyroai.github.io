import { useMemo, useState } from "react"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import PrinterIcon from "@hugeicons/core-free-icons/PrinterIcon"
import QuillWrite02Icon from "@hugeicons/core-free-icons/QuillWrite02Icon"
import { Dialog } from "@/components/ui/dialog"
import { MailCompose } from "@/components/common/MailCompose"
import { useLocale } from "@/hooks/useLocale"
import { useMe } from "@/hooks/useMe"
import { useMyManager } from "@/hooks/useMyManager"
import { useRecentPeople } from "@/hooks/useRecentPeople"
import { htmlDataUrl, htmlOf, printHtmlAttachment } from "@/lib/botFiles"
import {
  formTitleOf,
  markSignSlot,
  pdfReadyHtml,
  personalFileName,
  signedPdfName,
} from "@/features/chat/lib/signedForm"
import { FormPreview } from "./FormPreview"
import { SignaturePad } from "./SignaturePad"
import { signedHtml, useSignedFormSend } from "./useSignedFormSend"

/**
 * Sohbetteki (ve Self Servis kaydındaki) formu imzalayıp e-postayla gönderme ya da imzalı
 * yazdırma kutusu. `sign: false` → imzasız kip (masraf formu): imza alanı yok, form olduğu
 * gibi yazdırılır ya da PDF olarak gider.
 *
 * Geniş ekranda pencere iki yarıdır: solda gidecek formun önizlemesi (imza atılınca imzanın
 * düştüğü yerle), sağda imza ve posta bilgileri. Dar ekranda yalnız sağ yarı.
 *
 * Alıcı, kişinin Entra'daki yöneticisiyle önceden dolu gelir; kişi silip
 * başkasını seçebilir. Alana bir kez dokunulunca yönetici bir daha
 * yazılmaz (`editedTo`): geç gelen cevap kişinin seçimini ezmesin.
 */
export function SignFormDialog({ att, name, onClose, sign = true }) {
  return (
    <Dialog open={Boolean(att)} onOpenChange={(o) => !o && onClose()}>
      {att && <Body att={att} name={name} onClose={onClose} sign={sign} />}
    </Dialog>
  )
}

function Body({ att, name, onClose, sign }) {
  const { t } = useLocale()
  const suggestions = useRecentPeople(true)
  const manager = useMyManager(true)
  const title = useMemo(() => formTitleOf(htmlOf(att)), [att])

  const [strokes, setStrokes] = useState([])
  const [editedTo, setEditedTo] = useState(null)
  const to = editedTo ?? (manager ? [manager] : [])
  const [cc, setCc] = useState([])
  // Konu: formun türü + gönderenin adı soyadı ("Masraf Formu · Ad Soyad"). Formun kendi başlığı
  // masraf numarası taşıyabiliyor; numarayı alan kimse bilmez, ad tanınır.
  const me = useMe()
  const [subject, setSubject] = useState(() => {
    const kind = title.split(" · ")[0].trim()
    const who = (me?.fullName || me?.name || "").trim()
    const base = kind && who ? `${kind} · ${who}` : title || name
    return sign ? t("chat.sign.subject", { title: base }) : base
  })
  const [body, setBody] = useState(() =>
    t(sign ? "chat.sign.bodyDefault" : "chat.mail.bodyDefault"),
  )
  // Dosya adında sicil yerine ad soyad (PDF eki ve başlıktaki ad aynı).
  const fileName = personalFileName(name, me?.fullName || me?.name)
  const { phase, error, send } = useSignedFormSend({ att, name: fileName, onDone: onClose, sign })

  // Önizleme: gidecek PDF'in kâğıt hâli; imza yoksa imzanın geleceği yer işaretli.
  const preview = useMemo(() => {
    const html = htmlOf(att)
    if (!sign) return pdfReadyHtml(html)
    return pdfReadyHtml(
      strokes.length ? signedHtml(html, strokes) : markSignSlot(html, t("chat.sign.slot")),
    )
  }, [att, sign, strokes, t])

  const busy = phase !== "idle"
  const signed = !sign || strokes.length > 0
  const canSend = signed && to.length > 0 && subject.trim().length > 0 && !busy
  // Yazdırma imzayı gönderimle AYNI yerden alır (`signedHtml`); imzasız kipte form olduğu gibi.
  const print = () => {
    const html = htmlOf(att)
    printHtmlAttachment({ contentUrl: htmlDataUrl(sign ? signedHtml(html, strokes) : html) })
  }
  const label =
    phase === "rendering"
      ? t("chat.sign.preparing")
      : phase === "sending"
        ? t("files.mailSending")
        : t("files.mailSend")

  const pdfName = sign
    ? signedPdfName(fileName)
    : `${String(fileName || "Form").replace(/\.[^.]+$/, "") || "Form"}.pdf`

  return (
    <MailCompose
      icon={sign ? QuillWrite02Icon : Mail01Icon}
      title={t(sign ? "chat.sign.title" : "chat.mail.title")}
      subtitle={pdfName}
      onClose={onClose}
      preview={
        <FormPreview
          html={preview}
          focusSign={sign && strokes.length > 0}
          className="flex flex-1 bg-transparent px-1 pb-3 pt-1"
        />
      }
      top={
        sign && (
          <>
            <SignaturePad strokes={strokes} onChange={setStrokes} />
            <p className="text-[0.6875rem] leading-snug text-muted-foreground">
              {t("chat.sign.placement")}
            </p>
          </>
        )
      }
      to={to}
      onTo={setEditedTo}
      toHint={editedTo === null && manager ? t("chat.sign.managerHint") : null}
      cc={cc}
      onCc={setCc}
      suggestions={suggestions}
      subject={subject}
      onSubject={setSubject}
      body={body}
      onBody={setBody}
      attachment={{
        badge: "PDF",
        name: pdfName,
        meta: t(sign ? "mail.compose.signedPdf" : "mail.compose.pdf"),
      }}
      error={error}
      note={t("files.mailHandoffNote")}
      secondary={{
        icon: PrinterIcon,
        label: t(sign ? "chat.sign.print" : "chat.attach.print"),
        onClick: print,
        disabled: !signed || busy,
      }}
      send={{
        label,
        onClick: () => send({ strokes, to, cc, subject, body }),
        disabled: !canSend,
        busy,
      }}
    />
  )
}
