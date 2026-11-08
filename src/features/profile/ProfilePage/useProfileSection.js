import { useCallback, useEffect } from "react"
import { useLocation, useNavigate } from "react-router-dom"
import { useIsInGroup } from "@/hooks/useIsInGroup"
import { ADMIN_GROUP_ID } from "@/lib/constants"
import { DEFAULT_SECTION, resolveSection, searchWithTab, visibleSections } from "./sections"

// Telefonda alt sayfaya inen adımın işareti (react-router durumu `history.state.usr`'de).
export const DRILL_STATE = { profileDrill: true }
const drilled = () =>
  typeof window !== "undefined" && Boolean(window.history.state?.usr?.profileDrill)

/**
 * Adres (`?tab=`) ↔ bölüm. Masaüstünde bölüm değiştirmek gezinme değil (`replace`: üç bölüme
 * bakan kişi Geri'ye üç kez basmasın); telefonda alt sayfaya inmek bir adım, Geri köke döner.
 * Telefonda derin bağlantı (`?tab=x` ile gelinirse) kök listeyi altına yazar: Geri sayfadan
 * çıkarmaz, köke döner.
 */
export function useProfileSection(compact) {
  const navigate = useNavigate()
  const { pathname, search } = useLocation()
  const adminVerdict = useIsInGroup(ADMIN_GROUP_ID)
  const requested = new URLSearchParams(search).get("tab")
  const section = resolveSection(requested, adminVerdict, compact ? null : DEFAULT_SECTION)

  const hrefFor = useCallback(
    (id) => ({ pathname, search: searchWithTab(search, id) }),
    [pathname, search],
  )

  const select = useCallback(
    (id) => {
      if (compact) navigate(hrefFor(id), { state: DRILL_STATE })
      else navigate(hrefFor(id), { replace: true })
    },
    [compact, navigate, hrefFor],
  )

  const back = useCallback(() => {
    if (drilled()) navigate(-1)
    else navigate(hrefFor(null), { replace: true })
  }, [navigate, hrefFor])

  useEffect(() => {
    // `history.state` taze okunur: StrictMode'un ikinci koşusu adımı iki kez eklemesin.
    if (!compact || !section || drilled()) return
    navigate(hrefFor(null), { replace: true })
    navigate(hrefFor(section), { state: DRILL_STATE })
    // Yalnız düzen ya da bölüm değişince; `hrefFor` her adreste yenilenir.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [compact, section])

  return {
    section,
    select,
    back,
    hrefFor,
    adminVerdict,
    sections: visibleSections(adminVerdict),
  }
}
