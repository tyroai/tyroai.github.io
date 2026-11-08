import { lazy, Suspense } from "react"
import { ErrorCause } from "@/components/common/ErrorCause"
import { UNKNOWN, useGroupFailure } from "@/hooks/useIsInGroup"
import { useLocale } from "@/hooks/useLocale"
import { ADMIN_GROUP_ID } from "@/lib/constants"
import { LOADERS } from "./adminLoaders"
import { Group, Row, SkeletonRows, StatusChip } from "./rows"

// Yönetim araçları yalnız yöneticide iner: öteki herkesin profil paketi küçük kalır.
const SettingsPage = lazy(() => LOADERS.catalog().then((m) => ({ default: m.SettingsPage })))
const MascotStudioCard = lazy(() => LOADERS.orb().then((m) => ({ default: m.MascotStudioCard })))

function Loading() {
  return (
    <Group>
      <SkeletonRows count={4} />
    </Group>
  )
}

/**
 * Yönetim bölümleri (Katalog · Orb Stüdyosu). Kesin "evet"te çizilir; cevap beklenirken iskelet,
 * sorulamadıysa sebebi söylenir ("hayır" değil). Kesin "hayır" bu bölüme hiç gelmez
 * (`resolveSection` varsayılana düşürür).
 */
export function AdminSection({ id, adminVerdict }) {
  const { t } = useLocale()
  const failure = useGroupFailure(ADMIN_GROUP_ID)
  if (adminVerdict === UNKNOWN) {
    return (
      <Group footer={t("profile.manage.unknownHint")}>
        <Row label={t("profile.manage")}>
          <StatusChip tone="warning">{t("profile.adminUnknown")}</StatusChip>
        </Row>
        {failure ? (
          <div className="px-4 pb-3">
            <ErrorCause detail={failure} className="mt-0" />
          </div>
        ) : null}
      </Group>
    )
  }
  if (adminVerdict !== true) return <Loading />
  return (
    <Suspense fallback={<Loading />}>
      {id === "catalog" ? <SettingsPage embedded /> : <MascotStudioCard />}
    </Suspense>
  )
}
