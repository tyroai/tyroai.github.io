import { useEffect } from "react"
import { toast } from "sonner"
import { useLocale } from "@/hooks/useLocale"
import { TRADE_SYNC_FAILED } from "@/lib/tradeAccessSync"

/** tyroTrade tablosu eşitlenemediğinde Güvenlik sayfasında uyarı (bkz. `tradeAccessSync.js`). */
export function useTradeSyncNotice() {
  const { t } = useLocale()
  useEffect(() => {
    const onFail = (e) =>
      toast.warning(t("authz.tradeSync.failed"), { description: e.detail || undefined })
    window.addEventListener(TRADE_SYNC_FAILED, onFail)
    return () => window.removeEventListener(TRADE_SYNC_FAILED, onFail)
  }, [t])
}
