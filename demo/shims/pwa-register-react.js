// virtual:pwa-register/react'in DEMO karşılığı: servis çalışanı yok, "yeni sürüm" kartı hiç çıkmaz.
import { useState } from "react"

export function useRegisterSW() {
  const needRefresh = useState(false)
  const offlineReady = useState(false)
  return { needRefresh, offlineReady, updateServiceWorker: async () => {} }
}
