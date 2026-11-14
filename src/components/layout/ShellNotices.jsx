import { useSessionExpired } from "@/hooks/useSessionExpired"
import { ServiceHealthBanner } from "./ServiceHealthBanner"
import { SessionExpiredBanner } from "./SessionExpiredBanner"

/**
 * Kabuğun her sayfadaki uyarıları, üst çubuğun altında: oturum dolduysa yalnız oturum şeridi (asıl
 * çare yeniden giriş; Microsoft'un yavaşlığını söylemek o an yanıltır), yoksa Microsoft 365 durumu.
 */
export function ShellNotices() {
  const expired = useSessionExpired()
  return (
    <>
      <SessionExpiredBanner />
      {!expired && <ServiceHealthBanner />}
    </>
  )
}
