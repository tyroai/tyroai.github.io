import { useSearchParams } from "react-router-dom"
import { useMsal } from "@azure/msal-react"
import { restoreFilesParams, stashFilesParams } from "@/lib/filesNav"
import { sourceForTag } from "@/lib/feedPolicy"
import { markOpened } from "@/features/feed/lib/forYouSession"
import { FEED_SECTIONS, PERSONAL } from "./feedSections"

/**
 * Keşfet'in adresteki durumu: bölüm (`?sec=`), kanal (`?tag=`), gönderen (`?from=`) ve açık
 * gönderi (`?post=`). Adreste, çünkü bir gönderi paylaşılabiliyor, geri düğmesi pencereyi
 * kapatıyor ve sekme yer imlenebiliyor. Filtre değiştirmek bir gezinme değil (`replace`);
 * gönderi açmak öyle (push): geri tuşu pencereyi kapatsın, kullanıcıyı Keşfet'ten atmasın.
 */
export function useFeedNav() {
  const { accounts } = useMsal()
  const [params, setParams] = useSearchParams()
  const rawTag = params.get("tag")
  const tag = sourceForTag(rawTag) ? rawTag : null
  // "#SanaÖzel" (`?tag=personal`): Popüler'i yerinde işaretli kişisel postalara daraltır. Kanal
  // değil, istemcide filtrelenir; sunucuya etiket gitmez. `&from=` tek göndericiye daraltır.
  const personalOnly = rawTag === PERSONAL
  const fromAddress = personalOnly ? (params.get("from") ?? "").toLowerCase() : ""
  const openId = params.get("post")
  // Eski dar ekran görünümleri (`?view=`) kalktı; yer imindeki `?view=congrats` tebrik listesini açar.
  const congratsLink = params.get("view") === "congrats"
  const section = FEED_SECTIONS.some((x) => x.id === params.get("sec"))
    ? params.get("sec")
    : "agenda"

  function setTag(next) {
    const p = new URLSearchParams(params)
    if (next) p.set("tag", next)
    else p.delete("tag")
    p.delete("from")
    p.delete("post")
    setParams(p, { replace: true })
  }
  /** Gönderen satırı (sağ ray, Trendler): Popüler'i yerinde o göndericinin kişisel postalarına daraltır. */
  function setFrom(address) {
    const p = new URLSearchParams(params)
    p.set("tag", PERSONAL)
    p.set("from", address)
    p.delete("post")
    setParams(p, { replace: true })
  }
  /**
   * Açarken push, kapatırken `replace`: kapanış geçmişe ikinci bir kayıt eklemesin, yoksa bir açıp
   * kapatma iki geri tuşu ederdi. Önceki/sonraki gezinmesi `replace: true` ile çağırır.
   */
  function setOpen(id, replace = false) {
    const p = new URLSearchParams(params)
    if (id) {
      // Sana özel'in "Sıradaki"si bu oturumda açılan postayı sıradan çıkarır.
      markOpened(accounts[0]?.homeAccountId, id)
      p.set("post", id)
      setParams(p, { replace })
      return
    }
    p.delete("post")
    setParams(p, { replace: true })
  }
  /** Bölüm adresten okunur, adrese yazılır; tanınmayan değer sessizce Popüler'e düşer. */
  function setSection(next) {
    // Dosyalarım'ın f* parametreleri başka bölümde adreste durmaz; dönünce geri gelir
    // (`lib/filesNav.js`, yalnız bellekte).
    let p = new URLSearchParams(params)
    if (section === "docs" && next !== "docs") p = stashFilesParams(p)
    if (next === "docs" && section !== "docs") p = restoreFilesParams(p)
    if (section === "important" && next !== "important") p.delete("mark")
    if (next === "agenda") p.delete("sec")
    else p.set("sec", next)
    setParams(p, { replace: true })
  }

  return {
    params,
    section,
    tag,
    personalOnly,
    fromAddress,
    openId,
    congratsLink,
    setTag,
    setFrom,
    setOpen,
    setSection,
  }
}
