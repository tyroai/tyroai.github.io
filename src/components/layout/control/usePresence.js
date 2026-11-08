import { useCallback, useEffect, useState } from "react"
import { useMsal } from "@azure/msal-react"
import { STATUS, requestGraphScopes } from "@/lib/graph"
import {
  PRESENCE_SCOPES,
  clearPresence,
  needsConsent,
  readPresence,
  setPresence,
  withConsent,
} from "./graphTools"
import { presenceMinutes } from "./presenceModel"

/**
 * Teams durumunun kancası: kurulunca bir kez okur (yoklama yok: panel açıkken yeterli). İzin yoksa
 * `consent`; `connect` izni kişinin dokunuşuyla ister. Seçilen durum hemen gösterilir (Graph'ın
 * okuması birkaç saniye geriden gelir).
 */
export function usePresence() {
  const { instance, accounts } = useMsal()
  const account = accounts[0]
  const [state, setState] = useState({ status: "loading", availability: null })

  const load = useCallback(async () => {
    const res = await readPresence(instance, account)
    if (res.status === STATUS.ready)
      setState({ status: "ready", availability: res.data?.availability })
    else setState({ status: needsConsent(res) ? "consent" : "error", availability: null })
  }, [instance, account])

  useEffect(() => {
    let alive = true
    readPresence(instance, account).then((res) => {
      if (!alive) return
      if (res.status === STATUS.ready)
        setState({ status: "ready", availability: res.data?.availability })
      else setState({ status: needsConsent(res) ? "consent" : "error", availability: null })
    })
    return () => {
      alive = false
    }
  }, [instance, account])

  const connect = async () => {
    if (await requestGraphScopes(instance, account, PRESENCE_SCOPES)) await load()
  }

  const choose = async (choice, duration) => {
    const res = await withConsent(instance, account, PRESENCE_SCOPES, () =>
      setPresence(instance, account, choice, presenceMinutes(duration, Date.now())),
    )
    if (res.status === STATUS.ready) setState({ status: "ready", availability: choice })
    return res
  }

  const reset = async () => {
    const res = await withConsent(instance, account, PRESENCE_SCOPES, () =>
      clearPresence(instance, account),
    )
    if (res.status === STATUS.ready) await load()
    return res
  }

  return { ...state, connect, choose, reset }
}
