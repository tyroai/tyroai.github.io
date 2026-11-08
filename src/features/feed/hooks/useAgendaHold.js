import { useEffect, useState } from "react"
import { STATUS } from "@/lib/graph"

const GRACE_MS = 1500

/**
 * Akışım'ın KISA BEKLEME PENCERESİ (en çok 1,5 sn): duyurular tek istekte, işaretliler ayrı
 * sorgularla geliyor. Akış önce çizilseydi işaretli posta listenin TEPESİNE sonradan girip her
 * şeyi bir kart aşağı iterdi; işaretliler gelene kadar iskelet kalır, gecikirlerse akış yine
 * açılır ve onlar sonradan katılır.
 * Kapak görselleri BEKLENMEZ: ilk ekranın kapakları 0,5–2,7 MB (Graph eki base64); beklemek
 * ana içeriği (LCP) masaüstünde 1,2 → 2,9 sn geciktirdi, telefonda pencereyi yine aşıyordu.
 */
export function useAgendaHold({ active, status, importantStatus }) {
  const [graceOver, setGraceOver] = useState(false)
  const waiting = active && status === STATUS.ready && importantStatus === "loading"
  useEffect(() => {
    if (!waiting) return undefined
    const id = setTimeout(() => setGraceOver(true), GRACE_MS)
    return () => clearTimeout(id)
  }, [waiting])
  return waiting && !graceOver
}
