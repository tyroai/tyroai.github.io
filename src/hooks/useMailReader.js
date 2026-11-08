import { useEffect, useMemo, useState } from "react"
import { useLocale } from "@/hooks/useLocale"
import { useMailBody } from "@/hooks/useMailBody"
import { useMailImages } from "@/hooks/useMailImages"
import { STATUS } from "@/lib/graph"
import { readerFrameDoc } from "@/lib/mailFrame"
import { inlineCidImages, sealUnloadableImages, stripNetworkHints, unifyBold } from "@/lib/mailHtml"

/**
 * Bir postayı okumaya hazırlar: tam gövde, gövdedeki HER `cid:` için gömülü görsel ve
 * çerçevenin belgesi. Keşfet'in okuma bölmesi ile çentiğin posta kartı ve büyük okuyucusu
 * aynı yolu kullanır — postanın kendi tasarımı beyaz kâğıtta, görseller çözülmüş.
 *
 * Dönen: `{ body, html, waiting, failed }` — `html` çerçeveye verilecek belge (yoksa null).
 * `images`: gömülü görseller de insin mi (varsayılan `enabled`). Telefon okuyucusunun komşu
 * sayfası görselleri gövdeden sonra, gecikmeyle alır (her biri ayrı istek).
 * `hold`: gövdede gömülü görsel varsa çerçeve görseller inene dek (en çok `HOLD_MAX`) verilmez —
 * görseller sonradan gelince `srcDoc` değişir, çerçeve baştan yüklenir ve okurken kaydırma başa
 * sıçrar. Telefon okuyucusu kullanır; bekleyen sayfa özet metnini gösterir (`waiting`).
 */
const HOLD_MAX = 5000
const CID = /\bcid:/i

export function useMailReader(id, enabled, images = enabled, { hold = false } = {}) {
  const { t } = useLocale()
  const body = useMailBody(id, enabled)
  // Kart TEK kapak ister (`hero`); okuyucu gövdedeki her `cid:` için görsel (`body`).
  const inline = useMailImages(id, enabled && images, "body")

  // Bağımlılık `body?.html` değil: isteğe bağlı zincir bağımlılık olarak izlenemiyor.
  const bodyHtml = body?.html ?? null
  const html = useMemo(() => {
    if (!bodyHtml) return null
    // Sıra önemli: önce `cid:` eşlemesi (gömülü görsel `data:` olur), sonra ağa çıkan
    // görünmez etiketler, en sonda geriye kalan görsellerin mühürlenmesi.
    const { html: sealedHtml, sealed } = sealUnloadableImages(
      stripNetworkHints(inlineCidImages(unifyBold(bodyHtml), inline ?? [])),
    )
    return readerFrameDoc(sealedHtml, {
      note: sealed ? t("feed.imagesSealed", { count: sealed }) : null,
    })
  }, [bodyHtml, inline, t])

  const fetchingImages = enabled && images
  const [expired, setExpired] = useState(null)
  const holding = hold && Boolean(bodyHtml) && CID.test(bodyHtml) && !inline && expired !== id
  useEffect(() => {
    if (!holding || !fetchingImages) return undefined
    // Görseller takılırsa gövde görselsiz açılır (mühürlü kutularla).
    const timer = window.setTimeout(() => setExpired(id), HOLD_MAX)
    return () => window.clearTimeout(timer)
  }, [holding, fetchingImages, id])

  return {
    body,
    html: holding ? null : html,
    waiting: body === null || holding,
    failed: Boolean(body?.status && body.status !== STATUS.ready),
  }
}
