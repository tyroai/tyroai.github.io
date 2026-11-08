import { useMemo, useState } from "react"
import { senderGroups } from "./railModel"

/**
 * Gönderen grupları. Kanal süzgeci açıkken akışta kişisel posta yok (liste yalnız o kanalı
 * çeker); gruplar o sırada SON bilinen hâlinde kalır, yoksa ray kısalır ve tıklanan satır
 * yerinden kayar. `live` = süzgeçsiz (gruplar güncel).
 */
export function useSenderGroups(personalPosts, live) {
  const next = useMemo(() => senderGroups(personalPosts), [personalPosts])
  const [kept, setKept] = useState(next)
  if (live && kept !== next) setKept(next)
  return live ? next : kept
}
