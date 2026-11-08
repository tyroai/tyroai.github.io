import { useMsal } from "@azure/msal-react"
import RefreshIcon from "@hugeicons/core-free-icons/RefreshIcon"
import SquareLock02Icon from "@hugeicons/core-free-icons/SquareLock02Icon"
import { useLocale } from "@/hooks/useLocale"
import { requestGraphScopes, STATUS } from "@/lib/graph"
import { StateRow } from "../files/FilesStates"

/**
 * Rehber okunamadı — sebep ve çare listenin yerinde. İzin yoksa "Bağlan" (izin penceresi; çoğu
 * zaman yalnız eski oturumun belirteci yenilenir), ağ ya da sunucu düştüyse "Tekrar dene".
 */
export function DirectoryStatus({ dir }) {
  const { t } = useLocale()
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  if (dir.status === STATUS.unauthenticated) return <StateRow title={t("files.signedOut")} />
  if (dir.status === STATUS.denied)
    return (
      <StateRow
        icon={SquareLock02Icon}
        tone="warn"
        title={t("find.people.deniedTitle")}
        body={t("find.people.deniedBody")}
        cause={dir.detail}
        action={t("files.connect")}
        actionTone="connect"
        onAction={async () => {
          if (!account) return
          await requestGraphScopes(instance, account, ["User.Read.All"])
          dir.retry()
        }}
      />
    )
  // Neden kodu (`dir.detail`) ErrorCause'ta; yoksa eski HTTP satırı kalır.
  const detail = dir.detail
    ? ""
    : [dir.httpStatus && `HTTP ${dir.httpStatus}`, dir.code].filter(Boolean).join(" · ")
  return (
    <StateRow
      tone="warn"
      title={t("find.people.errorTitle")}
      body={t("files.errorBody")}
      detail={detail ? t("myfiles.state.detail", { detail }) : null}
      cause={dir.detail}
      action={t("files.retry")}
      actionIcon={RefreshIcon}
      onAction={dir.retry}
      busy={dir.refreshing}
    />
  )
}
