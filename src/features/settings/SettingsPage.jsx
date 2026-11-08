import "@/lib/i18n/settings"
import { useState } from "react"
import { UNKNOWN, useGroupFailure, useIsInGroup } from "@/hooks/useIsInGroup"
import { useLocale } from "@/hooks/useLocale"
import { ADMIN_GROUP_ID } from "@/lib/constants"
import { Catalog } from "./catalog/Catalog"
import { NotAdmin, SkeletonRows } from "./catalog/CatalogStates"

/**
 * Üç değerli kapı (+ sorulamadı): `undefined` = grup üyeliği henüz soruluyor (iskelet), `true` =
 * katalog, `UNKNOWN` = soru sorulamadı (ret değil; Tekrar dene kancayı yeniden kurar — sonuç
 * önbelleğe yazılmadığı için yeniden sorar), `false` = yönetici değil.
 */
function AdminGate({ onRetry }) {
  const verdict = useIsInGroup(ADMIN_GROUP_ID)
  const failure = useGroupFailure(ADMIN_GROUP_ID)
  if (verdict === undefined) return <SkeletonRows />
  if (verdict === true) return <Catalog />
  return <NotAdmin unknown={verdict === UNKNOWN} onRetry={onRetry} detail={failure} />
}

/**
 * Katalog yönetimi (asistanlar, AI ürünleri, iş uygulamaları). Profilin "Katalog" bölümünde
 * gömülü yaşar (`embedded`): sayfa başlığı profilin, burada ilk satır tür sekmeleri. `/settings`
 * adresi `/profile?tab=catalog`e yönlenir; gömülü olmayan kip yalnız kendi başlığını ekler.
 * Ayrıntı: `docs/features/profil-katalog.md`.
 */
export function SettingsPage({ embedded = false } = {}) {
  const { t } = useLocale()
  const [attempt, setAttempt] = useState(0)
  const body = <AdminGate key={attempt} onRetry={() => setAttempt((n) => n + 1)} />
  if (embedded) return <div className="flex min-h-0 w-full min-w-0 flex-1 flex-col">{body}</div>
  return (
    <div className="mx-auto flex min-h-0 w-full max-w-6xl flex-1 flex-col gap-6 overflow-y-auto px-4 py-6 lg:px-6 lg:py-8">
      <header className="space-y-1">
        <h1 className="text-xl font-semibold tracking-tight sm:text-2xl">{t("settings.title")}</h1>
        <p className="text-sm text-muted-foreground">{t("settings.subtitle")}</p>
      </header>
      {body}
    </div>
  )
}
