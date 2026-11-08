import { HugeiconsIcon } from "@hugeicons/react"
import AiChat02Icon from "@hugeicons/core-free-icons/AiChat02Icon"
import { useLocale } from "@/hooks/useLocale"
import { ActionButton } from "../actions/ActionButton"
import { LikeButton } from "../actions/LikeButton"
import { SaveButton } from "../actions/SaveButton"
import { ShareMenu } from "../actions/ShareMenu"

/**
 * Telefon okuyucusunun alt eylem çubuğu — X'in gönderi çubuğu gibi başparmağın altında, ev
 * çubuğunun üstünde: Beğen · TYRO ile özetle · Paylaş · Kaydet eşit aralıklı. Düğmeler kartın
 * satırıyla AYNI bileşenler (durum ortak depoda, `feed/actions`); burada yalnız ölçü büyür
 * (24 px ikon, 44 px hedef). Basılı durum (`aria-pressed`) dokununca titreşir (Android).
 */
export function ReaderBar({ post, onAsk }) {
  const { t } = useLocale()
  const subject = post.subject || t("feed.noSubject")
  return (
    <div
      role="group"
      aria-label={t("feed.actions.aria")}
      className="fr-bar"
      onClickCapture={(e) => {
        if (e.target.closest?.("[aria-pressed]")) navigator.vibrate?.(8)
      }}
    >
      <LikeButton post={post} className="fr-act" />
      <ActionButton
        icon={<HugeiconsIcon icon={AiChat02Icon} strokeWidth={1.7} />}
        label={t("feed.ask")}
        aria-label={t("feed.actions.askAria", { subject })}
        onClick={onAsk}
        className="fr-act"
      />
      <ShareMenu post={post} className="fr-act" align="center" />
      <SaveButton post={post} className="fr-act" />
    </div>
  )
}
