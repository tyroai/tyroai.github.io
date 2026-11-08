import { useLocale } from "@/hooks/useLocale"

/** Microsoft'un dört karesi: giriş kurumsal Microsoft hesabıyla (Atlas'taki Slack işaretinin yeri). */
function MicrosoftMark() {
  return (
    <svg viewBox="0 0 21 21" aria-hidden="true">
      <rect x="1" y="1" width="9" height="9" fill="#f25022" />
      <rect x="11" y="1" width="9" height="9" fill="#7fba00" />
      <rect x="1" y="11" width="9" height="9" fill="#00a4ef" />
      <rect x="11" y="11" width="9" height="9" fill="#ffb900" />
    </svg>
  )
}

/**
 * BAĞLAN — Atlas'ın siyah kapsülü: beyaz yazı, solda Microsoft işareti. Basınca maskot "giriş
 * yapıyor"a geçer, düğme "Bağlanıyor…" der ve kilitlenir. Hangi hesapla girileceği görünmez,
 * düğmenin açıklamasında (`login.ssoHint`, girişteki kural).
 */
export function LoginConnect({ busy, onConnect, describedBy }) {
  const { t } = useLocale()
  return (
    <button
      type="button"
      className="login-cta"
      onClick={onConnect}
      disabled={busy}
      aria-busy={busy || undefined}
      aria-describedby={describedBy}
    >
      <MicrosoftMark />
      <span>{busy ? t("meet.connecting") : t("login.cta")}</span>
    </button>
  )
}
