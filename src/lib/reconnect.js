import { loginRequest } from "@/lib/msal"
import { clearLocalSession } from "@/lib/sessionExpiry"
import { attemptSilentSso } from "@/lib/silentSso"

/**
 * Süresi dolan oturumdan TEK çare — her sayfadaki şerit, Self Servis kartı ve Graph izin düğmeleri
 * (`lib/graph` › `requestGraphScopes`) aynısını kullanır: yerel oturum silinir (Entra oturumu açık
 * kalır) ve sessiz giriş (`prompt=none`, tam sayfa) denenir; Entra oturumu yaşıyorsa kişi şifre
 * yazmadan aynı sayfaya döner, yoksa giriş ekranı gelir.
 */
export async function reconnectSession(instance) {
  await clearLocalSession(instance)
  if (!(await attemptSilentSso(instance, loginRequest))) window.location.assign("/login")
}
