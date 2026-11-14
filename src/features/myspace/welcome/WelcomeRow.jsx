import { HugeiconsIcon } from "@hugeicons/react"
import ArrowRight01Icon from "@hugeicons/core-free-icons/ArrowRight01Icon"
import { OrbToken } from "./WelcomeTokens"
import "./welcomeRows.css"

/**
 * Bilgi satırı (Apple'ın Hava uygulamasındaki gibi): solda simge, sağda cümle; ardışık satırların
 * arasında ince çizgi (`welcomeRows.css`). Simge ya kendi diskini taşır (hava incisi: `pearl`) ya da
 * cam diskte beyaz çizgi simgedir (avatar ve çanla aynı malzeme). `personal`: Sunum modunda rakamları gizli.
 */
export function Row({ icon, pearl, personal, children }) {
  return (
    <p className="welcome-row">
      <span aria-hidden="true" className="welcome-row-ic" data-glass={pearl ? undefined : ""}>
        {pearl ? icon : <HugeiconsIcon icon={icon} strokeWidth={1.8} />}
      </span>
      <span className="welcome-row-txt" data-private={personal ? "" : undefined}>
        {children}
      </span>
    </p>
  )
}

/**
 * TYRO'nun önerisi, satırlardan ayrı bir cam kartta: solda küre (öneriyi kimin yaptığı), ortada
 * birinci tekil davet ("… odağına ayırayım mı?"), sonda ok. Dokunulacak tek yer burası; basınca
 * hafifçe küçülür.
 */
export function Offer({ onClick, children, ...rest }) {
  // `rest`: ipucunun tetiği olarak kullanılınca (karşılama kartı) Radix'in olayları ve ref'i.
  return (
    <button type="button" className="welcome-offer" onClick={onClick} {...rest}>
      <OrbToken />
      <span className="welcome-offer-txt">{children}</span>
      <HugeiconsIcon
        icon={ArrowRight01Icon}
        strokeWidth={2.4}
        aria-hidden="true"
        className="welcome-offer-go"
      />
    </button>
  )
}
