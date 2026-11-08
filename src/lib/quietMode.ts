/**
 * Kendiliğinden gelen bildirimler susturulsun mu: Odak modu ya da Sunum modu açıkken evet.
 * Kişinin kendi istediği uyarı (odak sayacının alarmı, deneme bildirimi) bu kapıdan geçmez.
 *
 * İki modun kaydını içe aktarmaz: bildirim modülü ilk pakette, kayıtlar (`lib/focusMode`,
 * `lib/presentMode`) Denetim Merkezi'nin düğmesiyle gelir. Sunum modu kök öğedeki
 * `data-present`ten, Odak modu bitiş anından okunur (anahtar `focusMode` ile aynı — testli).
 */
export const FOCUS_MODE_KEY = "tyro-focus-mode-v1"

export function interruptsMuted(): boolean {
  if (typeof document !== "undefined" && document.documentElement.hasAttribute("data-present"))
    return true
  try {
    const until = JSON.parse(localStorage.getItem(FOCUS_MODE_KEY) ?? "null")?.until
    return typeof until === "number" && until > Date.now()
  } catch {
    return false
  }
}
