import { getDateTimeFormat } from "@/lib/intl-cache"

/**
 * Outlook'un okuma bölmesindeki kısa damga: "Cum 2.10.2026 09:41". Parçalar AYRI biçimlenip
 * birleşiyor: tek bir `Intl` biçimi Türkçede günü sona atıyordu ("2.10.2026 Cum 10:54"). Saat
 * dilin kendi düzeninde (EN "10:54 AM"). Uzunu (`full`) `title`da ve pencere açıklamasında.
 */
const OPTS_STAMP: Intl.DateTimeFormatOptions[] = [
  { weekday: "short" },
  { day: "numeric", month: "numeric", year: "numeric" },
  { hour: "2-digit", minute: "2-digit" },
]
const OPTS_FULL: Intl.DateTimeFormatOptions = {
  weekday: "long",
  day: "numeric",
  month: "long",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
}

export function postStamp(received: Date | null | undefined, locale: string) {
  if (!received) return { stamp: "", full: "" }
  return {
    stamp: OPTS_STAMP.map((o) => getDateTimeFormat(locale, o).format(received)).join(" "),
    full: getDateTimeFormat(locale, OPTS_FULL).format(received),
  }
}

/**
 * Okuyucu kapanınca odak son okunan gönderinin kartına döner (akış oraya kayar); kart yoksa
 * (başka bölüm, liste yenilendi) okuyucuyu açan elemana.
 */
export function returnFocusTo(e: Event, postId: string, opener: Element | null) {
  const card = document.querySelector<HTMLElement>(
    `article[data-post-id="${CSS.escape(postId)}"] button`,
  )
  const el = (card?.offsetParent ? card : opener) as HTMLElement | null
  if (el && el !== document.body && el.isConnected) {
    e.preventDefault()
    el.focus({ preventScroll: el !== card })
  }
}
