import { useEffect, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { presenceState } from "@/hooks/usePresence"
import { graphPost, STATUS } from "@/lib/graph"

const REFRESH_MS = 60_000
const MAX_IDS = 100
// İzin yoksa (yönetici onayı) oturumda bir daha sorulmaz.
let denied = false

/**
 * Listede görünen kişilerin canlı durumu TEK istekle (`getPresencesByUserId`, kimliklerle — tek
 * tek adresle sormak hem yavaş hem adres UPN'den farklıysa boş). Yazarken her tuşta istek
 * gitmesin diye kısa bekleme; liste açık kaldıkça dakikada bir tazelenir. Kimlik → durum.
 */
export function usePresenceBatch(people) {
  const { instance, accounts } = useMsal()
  const account = accounts[0] ?? null
  const key = [...new Set((people ?? []).map((p) => p?.id).filter(Boolean))]
    .slice(0, MAX_IDS)
    .sort()
    .join(",")
  const [states, setStates] = useState(() => new Map())

  useEffect(() => {
    if (!key || !account || denied) return undefined
    let live = true
    let timer
    const run = async () => {
      const res = await graphPost(instance, account, {
        path: "/communications/getPresencesByUserId",
        scopes: ["Presence.Read.All"],
        body: { ids: key.split(",") },
      })
      if (!live) return
      if (res.status === STATUS.denied) {
        denied = true
        return
      }
      if (res.status === STATUS.ready) {
        setStates((prev) => {
          const next = new Map(prev)
          for (const x of res.data?.value ?? []) next.set(x.id, presenceState(x.availability))
          return next
        })
      }
      timer = setTimeout(run, REFRESH_MS)
    }
    timer = setTimeout(run, 350)
    return () => {
      live = false
      clearTimeout(timer)
    }
  }, [key, instance, account])

  return states
}
