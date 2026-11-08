import { STATUS, graphPost } from "@/lib/graph"
import { photoRelPath } from "@/lib/peoplePhoto"

// Graph JSON toplu isteğinin sınırı: tek istekte en çok 20 alt istek.
const BATCH_MAX = 20

function blobFromBase64(b64, type) {
  const bin = atob(b64)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i += 1) bytes[i] = bin.charCodeAt(i)
  return new Blob([bytes], { type })
}

/**
 * İş arkadaşlarının fotoğrafları TEK toplu istekte (`/$batch`). Fotoğrafı olmayanın 404'ü toplu
 * cevabın İÇİNDE döner: tarayıcı her ayrı 404'ü konsola kırmızı satır yazıyordu (temiz profilde
 * açılışta 9 satır, Lighthouse "Best Practices"). Dokuz istek de bir olur.
 *
 * Dönen `Map(adres → sonuç)`; sonuç tekil isteğin şekliyle aynı: `{ status: "ready", blob }` ya da
 * `{ status, httpStatus }` — çağıranın yorumu (404 harf, 429/5xx yeniden dene) değişmez. Toplu
 * isteğin kendisi düşerse (belirteç, ağ) parçadaki her adres o sonucu alır.
 */
export async function fetchPhotoBatch(instance, account, addresses, size) {
  const out = new Map()
  for (let i = 0; i < addresses.length; i += BATCH_MAX) {
    const chunk = addresses.slice(i, i + BATCH_MAX)
    const res = await graphPost(instance, account, {
      path: "/$batch",
      scopes: ["User.ReadBasic.All"],
      quiet: true,
      body: {
        requests: chunk.map((address, k) => ({
          id: String(k),
          method: "GET",
          url: photoRelPath(address, size),
        })),
      },
    })
    if (res.status !== STATUS.ready) {
      for (const address of chunk) out.set(address, res)
      continue
    }
    for (const r of res.data?.responses ?? []) {
      const address = chunk[Number(r.id)]
      if (!address) continue
      // İkili gövde (görsel) toplu cevapta base64 metin olarak gelir.
      if (r.status === 200 && typeof r.body === "string") {
        const type = r.headers?.["Content-Type"] ?? r.headers?.["content-type"] ?? "image/jpeg"
        out.set(address, { status: STATUS.ready, blob: blobFromBase64(r.body, type) })
      } else {
        out.set(address, { status: STATUS.error, httpStatus: r.status })
      }
    }
    // Cevapta olmayan alt istek bir yanıt değil: geçici sayılır (önbelleğe yazılmaz, sonra denenir).
    for (const address of chunk) if (!out.has(address)) out.set(address, { status: STATUS.error })
  }
  return out
}
