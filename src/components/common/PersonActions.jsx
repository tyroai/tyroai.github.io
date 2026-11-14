import { HugeiconsIcon } from "@hugeicons/react"
import BubbleChatIcon from "@hugeicons/core-free-icons/BubbleChatIcon"
import Call02Icon from "@hugeicons/core-free-icons/Call02Icon"
import CalendarAdd01Icon from "@hugeicons/core-free-icons/CalendarAdd01Icon"
import Mail01Icon from "@hugeicons/core-free-icons/Mail01Icon"
import { useLocale } from "@/hooks/useLocale"
import { teamsChat } from "@/lib/celebrate"
import { cn } from "@/lib/utils"
import "./personCard.css"
import "./personParts.css"

/**
 * Kişi kartının dört eylemi — Sohbet · E-posta · Ara · Toplantı (Outlook'un kişi kartının satırı).
 * Kişi kartı ve Self Servis'in Ekibim bölmesi paylaşır. Dört eşit karo (Denetim Merkezi'nin
 * kutucukları gibi yumuşak zemin): simge üstte, ad altta; dokunmatikte 56 px.
 *
 * Eylemler BAĞLANTI, uygulama içi işlem değil: Teams'in belgelenmiş derin bağlantıları
 * (`/l/chat`, `/l/call`, `/l/meeting/new`) ve Outlook web'in yazma bağlantısı — yeni kapsam yok,
 * tıklama anında ağ turu yok, açılır pencere engelleyicisine takılmaz. Adres yoksa hiçbiri
 * çizilmez: hedefsiz bir düğme yalan söyler.
 */
export function PersonActions({ address, upn, className }) {
  const { t } = useLocale()
  if (!address) return null
  const id = upn || address
  return (
    <div className={cn("pc-actions", className)}>
      <Action
        href={teamsChat(id)}
        icon={BubbleChatIcon}
        label={t("person.chat")}
        title={t("person.chatTitle")}
      />
      <Action
        href={`https://outlook.office.com/mail/deeplink/compose?to=${encodeURIComponent(address)}`}
        icon={Mail01Icon}
        label={t("person.mail")}
        title={t("person.mailTitle")}
      />
      <Action
        href={`https://teams.microsoft.com/l/call/0/0?users=${encodeURIComponent(id)}`}
        icon={Call02Icon}
        label={t("person.call")}
        title={t("person.callTitle")}
      />
      <Action
        href={`https://teams.microsoft.com/l/meeting/new?attendees=${encodeURIComponent(id)}`}
        icon={CalendarAdd01Icon}
        label={t("person.meet")}
        title={t("person.meetTitle")}
      />
    </div>
  )
}

function Action({ href, icon, label, title }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      // Adı görünen etiket (sesle "Toplantı" diyen bulsun); uzun açıklama ipucunda.
      title={title}
      className="pc-act"
    >
      <HugeiconsIcon icon={icon} strokeWidth={1.8} aria-hidden="true" />
      <span>{label}</span>
    </a>
  )
}
