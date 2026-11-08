import { useCallback, useMemo } from "react"
import { useSearchParams } from "react-router-dom"
import { ROLES } from "@/features/security/lib/authzPeople"

/** Sekmeler (URL `tab`); "app" = Sistem, eski bağlantılar ve `/authorizations` yönlendirmesi için. */
export const TABS = ["users", "apps", "requests", "app"]

/**
 * Sayfanın URL durumu: sekme + Kişiler listesinin araması (`q`), rolü (`role`) ve uygulamaları
 * (`app`, tekrarlı). Paylaşılan bağlantı aynı listeyi açar; Geri tuşu geçmişi şişirmesin diye
 * değişiklikler yerinde yazılır (`replace`).
 */
export function useSecurityParams() {
  const [params, setParams] = useSearchParams()
  const rawTab = params.get("tab")
  const rawRole = params.get("role")
  const q = params.get("q") ?? ""
  const appsKey = params.getAll("app").join("\n")
  const apps = useMemo(() => (appsKey ? appsKey.split("\n") : []), [appsKey])

  // `patch`: { tab?, q?, role?, apps? } — boş değer anahtarı siler (temiz URL).
  const update = useCallback(
    (patch) =>
      setParams(
        (prev) => {
          const next = new URLSearchParams(prev)
          for (const [key, value] of Object.entries(patch)) {
            if (key === "apps") {
              next.delete("app")
              for (const a of value ?? []) next.append("app", a)
            } else if (!value || (key === "role" && value === "all")) next.delete(key)
            else next.set(key, value)
          }
          return next
        },
        { replace: true },
      ),
    [setParams],
  )

  return {
    tab: TABS.includes(rawTab) ? rawTab : "users",
    q,
    role: ROLES.includes(rawRole) ? rawRole : "all",
    apps,
    update,
  }
}
