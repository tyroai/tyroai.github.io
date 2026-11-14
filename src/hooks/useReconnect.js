import { useState } from "react"
import { useMsal } from "@azure/msal-react"
import { reconnectSession } from "@/lib/reconnect"

/**
 * Süresi dolan oturumdan tek tıkla dönüş — her sayfadaki şerit (`SessionExpiredBanner`) ve Self
 * Servis'in kartı aynısını kullanır (`lib/reconnect`). Kişinin seçeceği ya da anlayacağı bir şey yok.
 */
export function useReconnect() {
  const { instance } = useMsal()
  const [busy, setBusy] = useState(false)
  const reconnect = async () => {
    setBusy(true)
    await reconnectSession(instance)
  }
  return { reconnect, busy }
}
