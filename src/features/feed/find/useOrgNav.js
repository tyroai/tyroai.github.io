import { useCallback } from "react"
import { useSearchParams } from "react-router-dom"
import { rememberQuery } from "@/lib/filesNav"
import { withOrg } from "@/lib/findScope"

/** Organizasyonda bir kişiye geç: Kişiler kapsamı, `forg` geçmişe yazılır, arama boşalır. */
export function useOrgNav() {
  const [params, setParams] = useSearchParams()
  return useCallback(
    (id) => {
      rememberQuery("")
      setParams(withOrg(params, id))
    },
    [params, setParams],
  )
}
