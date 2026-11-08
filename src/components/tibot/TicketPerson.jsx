import { PersonPopover } from "@/components/common/PersonPopover"
import { RecordOwner } from "@/components/record-window/RecordHeader"
import { useLocale } from "@/hooks/useLocale"

/*
 * Talepteki kişiler basınca kişi kartını açar (`PersonPopover`: sohbet, e-posta, arama, toplantı).
 * Xurrent kişide adres yok; kart adı şirket dizininde arar (`personDirectory`, oturum önbelleği).
 * Bulamazsa kart adı ve nedenini yine gösterir.
 */

/** Talep sahibi satırı (başlığın altında): fotoğraf · ad · rol, tamamı düğme. */
export function TicketOwner({ name, role }) {
  const { t } = useLocale()
  if (!name) return null
  return (
    <PersonPopover person={{ name }} align="start">
      {(trigger) => (
        <RecordOwner
          name={name}
          role={role}
          trigger={trigger}
          openTitle={t("person.openCard", { name })}
          className="tb-owner"
        />
      )}
    </PersonPopover>
  )
}

/** Satır içindeki ad (Atanan, Talebi açan, not yazarı): yazı gibi durur, basınca kişi kartı. */
export function TicketPersonName({ name, align = "end", className }) {
  const { t } = useLocale()
  if (!name) return null
  return (
    <PersonPopover person={{ name }} align={align}>
      {(trigger) => (
        <button
          {...trigger}
          title={t("person.openCard", { name })}
          className={className ? `tb-person ${className}` : "tb-person"}
        >
          {name}
        </button>
      )}
    </PersonPopover>
  )
}
