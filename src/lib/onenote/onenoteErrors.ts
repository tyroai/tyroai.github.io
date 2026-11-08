/**
 * OneNote sayfa listesi neden okunamadı: hesabın KENDİSİ büyük ya da yavaş mı (çare: bölüm bölüm
 * okumak)? Saf: testli (`tests/unit/onenoteErrors.test.ts`). Ekrandaki neden cümlesi merkezî
 * (`lib/causeText` › bigAccount · drive); burada yalnız karar ve zincirli kod var.
 */
import { STATUS } from "@/lib/graphRequest"
import type { GraphFailure } from "@/lib/graphRequest"

/**
 * Hesap büyüklüğü kodları (Microsoft'un OneNote hata kodları): 20266 çok bölüm · 10008 / 10013
 * kütüphanede çok öğe · 30103 kaynak tüketimi. Sade sorgu aynı hatayı verir, çare bölüm bölüm okumak.
 */
export const BIG_ACCOUNT_CODES: ReadonlySet<string> = new Set(["20266", "10008", "10013", "30103"])

const part = (detail: string, word: string): boolean =>
  new RegExp(`(^| · )${word}( · |$)`).test(detail)

/**
 * Hesabın KENDİSİ büyük ya da yavaş: Graph kodu, sunucu / zaman aşımı durumu ya da bizim süre
 * sınırımız. `network`: Microsoft hata sayfasını CORS başlığı olmadan dönerse tarayıcı bunu ağ
 * hatası sayar; bölüm bölüm denemek ucuz. Çevrimdışı (`offline`) değil: orada denemek boşuna.
 */
export function isBigAccount(failure: GraphFailure): boolean {
  if (failure.status !== STATUS.error) return false
  const detail = failure.detail ?? ""
  return (
    BIG_ACCOUNT_CODES.has(failure.code ?? "") ||
    failure.httpStatus === 500 ||
    failure.httpStatus === 504 ||
    failure.httpStatus === 408 ||
    failure.error === "timeout" ||
    part(detail, "timeout") ||
    part(detail, "network")
  )
}

/**
 * İlk yolun hatası ve onu izleyen yedek yolun hatası tek satır neden kodunda: "Graph · HTTP 400 ·
 * 20266 · → timeout". Kodun ilk parçaları (servis, HTTP durumu, Graph kodu) ilk hatanın kalır,
 * yani ekrandaki cümle asıl nedeni söyler.
 */
export function chainDetail(first?: string, then?: string): string | undefined {
  if (first && then) return `${first} · → ${then.replace(/^Graph · /, "")}`.slice(0, 220)
  return first || then || undefined
}
