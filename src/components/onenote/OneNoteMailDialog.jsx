import { useMemo, useState } from "react"
import { useMsal } from "@azure/msal-react"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import { Dialog } from "@/components/ui/dialog"
import { MailCompose } from "@/components/common/MailCompose"
import { useLocale } from "@/hooks/useLocale"
import { useRecentPeople } from "@/hooks/useRecentPeople"
import { sendWithConsent, unresolvedRecipients } from "@/lib/mailSend"
import { noteMail, previewHtml } from "@/lib/onenote/onenoteMail"
import { sendNoteMail } from "@/lib/onenote/sendNoteMail"
import { showResultToast } from "@/lib/refreshToast"

/**
 * Notu e-posta olarak gönderme kutusu (Paylaş › E-postayla gönder). Bağlantı değil NOTUN KENDİSİ
 * biçimiyle postanın gövdesine girer: alıcının deftere erişimi olmak zorunda değil. Kalıp dosya
 * postasıyla aynı (`MailCompose`): Kime/Bilgi son yazışılanlardan, konu sayfa adı, mesaj notun
 * üstüne. Geniş ekranda solda alıcının göreceği posta. Gönderim kişinin kendi kutusundan
 * (`lib/onenote/sendNoteMail`).
 */
export function OneNoteMailDialog({ open, onClose, title, crumb, html }) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      {open && <Body onClose={onClose} title={title} crumb={crumb} html={html} />}
    </Dialog>
  )
}

function Body({ onClose, title, crumb, html }) {
  const { t } = useLocale()
  const { instance, accounts } = useMsal()
  const suggestions = useRecentPeople(true)
  const [to, setTo] = useState([])
  const [cc, setCc] = useState([])
  const [subject, setSubject] = useState(title)
  const [message, setMessage] = useState("")
  const [sending, setSending] = useState(false)
  const [error, setError] = useState(null)
  // Önizleme mesajsız kurulur (yazarken çerçeve baştan çizilmesin); gönderimde mesajla yeniden.
  const draft = useMemo(() => noteMail({ title, crumb, html, t }), [title, crumb, html, t])
  const preview = useMemo(() => previewHtml(draft), [draft])
  const canSend = to.length > 0 && subject.trim().length > 0 && !sending && Boolean(html)

  async function send() {
    const missing = unresolvedRecipients([...to, ...cc])
    if (missing.length) {
      setError(t("files.mailNeedsAddress", { names: missing.join(", ") }))
      return
    }
    setError(null)
    setSending(true)
    const mail = noteMail({ title, crumb, html, message, t })
    const res = await sendWithConsent(instance, accounts[0], () =>
      sendNoteMail(instance, accounts[0], { to, cc, subject: subject.trim(), mail }),
    )
    setSending(false)
    if (res.ok) {
      showResultToast({
        title: t("files.mailSentTitle"),
        detail: t("onenote.mail.sentDetail", { name: title }),
      })
      onClose()
      return
    }
    setError(
      res.reason === "too-large"
        ? t("onenote.mail.tooLarge")
        : res.reason === "denied"
          ? t("files.mailDenied")
          : res.reason === "no-recipient"
            ? t("files.mailNeedsAddress", { names: "" })
            : t("files.mailFailed", { detail: res.detail || "" }),
    )
  }

  const note = [
    t("onenote.mail.note"),
    draft.droppedImages > 0 ? t("onenote.mail.dropped", { n: draft.droppedImages }) : "",
  ]
    .filter(Boolean)
    .join(" ")

  return (
    <MailCompose
      icon={Mail01Icon}
      title={t("onenote.mail.title")}
      subtitle={[title, crumb].filter(Boolean).join(" · ")}
      onClose={onClose}
      preview={
        <iframe
          title={t("onenote.mail.preview")}
          // Betik, form ve aynı köken KAPALI; görseller zaten gömülü (`data:`).
          sandbox=""
          srcDoc={`<!doctype html><meta charset="utf-8"><body style="margin:16px;background:#fff">${preview}</body>`}
          className="h-full w-full rounded-[1.375rem] bg-white ring-1 ring-border/60"
        />
      }
      to={to}
      onTo={setTo}
      cc={cc}
      onCc={setCc}
      suggestions={suggestions}
      subject={subject}
      onSubject={setSubject}
      body={message}
      onBody={setMessage}
      bodyPlaceholder={t("onenote.mail.messagePlaceholder")}
      error={error}
      note={note}
      send={{
        label: sending ? t("files.mailSending") : t("files.mailSend"),
        onClick: send,
        disabled: !canSend,
        busy: sending,
      }}
    />
  )
}
