import { useEffect, useMemo, useSyncExternalStore } from "react"
import { useMsal } from "@azure/msal-react"
import { planNames } from "@/features/rm/lib/edit/people"
import {
  ensurePeople,
  matchPeople,
  peopleState,
  subscribePeople,
} from "@/features/rm/lib/peopleDirectory"

/**
 * RM adı → Graph kişi kaydı ({ name, address, title }): kişiler, yöneticiler, PM'ler, sorumlular
 * ve iş sahipleri (`planNames`). Ağaç oturumda bir kez okunur; oturum yoksa (geliştirme
 * kestirmesi) boş döner ve avatarlar baş harfle kalır.
 */
export function useRmPeople(st) {
  const { instance, accounts } = useMsal()
  const account = accounts[0]
  const state = useSyncExternalStore(subscribePeople, peopleState)
  useEffect(() => {
    if (st && account) ensurePeople(instance, account)
  }, [st, instance, account])
  return useMemo(() => {
    if (!st || state.status !== "ready") return new Map()
    const hits = matchPeople(planNames(st), state.people)
    return new Map(Object.entries(hits))
  }, [st, state])
}
