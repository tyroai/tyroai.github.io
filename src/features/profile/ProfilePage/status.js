import { UNKNOWN } from "@/hooks/useIsInGroup"
import { useMyProfileDetails } from "@/hooks/useMyProfileDetails"
import { getPermission, notificationsSupported } from "@/lib/notify/browserNotify"

/** Bölümlerin ve telefon kök önizlemelerinin ortak okumaları (bir şey bir yerde hesaplanır). */

/** Katalog yönetiminin üç değerli cevabı → etiket ve ton. `undefined` = cevap bekleniyor. */
export function manageState(verdict, t) {
  if (verdict === true) return { label: t("profile.manage.open"), tone: "success" }
  if (verdict === UNKNOWN) return { label: t("profile.manage.unknown"), tone: "warning" }
  if (verdict === undefined) return { label: "…", tone: "muted" }
  return { label: t("profile.manage.closed"), tone: "muted" }
}

/** Bildirim izni; tarayıcı desteklemiyorsa ayrı bir hâl. */
export function permissionState() {
  return notificationsSupported() ? getPermission() : "unsupported"
}

export function permissionLabel(state, t) {
  return t(`settings.notify.status.${state}`)
}

/** Kimliğin ikinci satırı: unvan, yoksa departman, yoksa hiç (uydurma yok). */
export function useIdentityLine() {
  const { details } = useMyProfileDetails()
  return details?.jobTitle || details?.department || ""
}
