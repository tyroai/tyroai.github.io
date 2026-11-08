import {
  compressImageFile,
  loadSdk,
  prewarmToken,
  sendMessage,
  startConversation,
} from "@/lib/copilot"
import { ymd } from "@/lib/leaveDays"
import { parseReaderReply } from "./receiptReading"

/**
 * Fiş okuyucu ajan (Copilot Studio "TYRO - Voucher Reader", `docs/integrations/tyro-reader.md`):
 * her fiş için yeni konuşma ve tek mesaj — görsel (küçültülmüş, döndürülmüşse döndürülmüş) +
 * "GÖREV: fis-oku / BUGÜN: …"; cevap tek JSON (`parseReaderReply`). Konuşmalar ayrı: bir fişin
 * okuması ötekine karışmasın. Bağlantı kişinin kendi oturumuyla (öteki asistanlar gibi).
 */

/** Ajanın şema adı (Copilot Studio › Ayarlar › Gelişmiş › Meta veriler; sır değil). */
export const READER_SCHEMA = import.meta.env.VITE_RECEIPT_READER_SCHEMA || "crfc1_tyroVoucherReader"
const TIMEOUT_MS = 60_000

/** İlk okuma beklemesin: SDK ve oturum belirteci önceden (sessiz, popup açmaz). */
export function warmReader() {
  loadSdk().catch(() => {})
  prewarmToken().catch(() => {})
}

const dataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onerror = () => reject(reader.error ?? new Error("read failed"))
    reader.onload = () => resolve(reader.result)
    reader.readAsDataURL(file)
  })

const withTimeout = (work, ms) =>
  Promise.race([
    work,
    new Promise((_, reject) => setTimeout(() => reject(new Error("timeout")), ms)),
  ])

/** Tek fiş → okuma nesnesi (`parseReaderReply`) ya da null; bağlantı hatasında fırlatır. */
export function readReceipt(file, { rotate = 0, today = new Date() } = {}) {
  const work = (async () => {
    const out = await compressImageFile(file, { rotate })
    const [url, client] = await Promise.all([
      dataUrl(out),
      (async () => {
        let got = null
        for await (const chunk of startConversation(READER_SCHEMA))
          if (chunk.done) got = chunk.client
        return got
      })(),
    ])
    if (!client) throw new Error("no conversation")
    const attachment = {
      contentType: out.type || "application/octet-stream",
      name: out.name,
      contentUrl: url,
    }
    let reply = ""
    for await (const chunk of sendMessage(client, `GÖREV: fis-oku\nBUGÜN: ${ymd(today)}`, [
      attachment,
    ])) {
      if (chunk.transient || !chunk.text) continue
      // Akışta metin her parçada baştan gelir; son (final) mesaj tam cevaptır.
      reply = chunk.text
    }
    return parseReaderReply(reply)
  })()
  return withTimeout(work, TIMEOUT_MS)
}
