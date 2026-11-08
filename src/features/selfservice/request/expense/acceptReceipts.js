import { formatFileSize } from "@/features/chat/composerFiles"
import { MAX_ATTACHMENT_BYTES, MAX_IMAGE_BYTES, isCompressibleImage } from "@/lib/copilot"
import { notify } from "@/lib/notify"

/**
 * Fiş olabilecek dosyalar: yalnız görsel ya da PDF, boyut sınırı sohbet ekleriyle aynı (görsel
 * gönderimde küçültülür). Elenen her dosya için kişiye bildirim; dönüş kalanlar.
 */
export function acceptReceipts(picked, t) {
  return Array.from(picked ?? []).filter((f) => {
    if (!f.type.startsWith("image/") && f.type !== "application/pdf") {
      notify.error(t("selfService.form.receiptType"))
      return false
    }
    const cap = isCompressibleImage(f) ? MAX_IMAGE_BYTES : MAX_ATTACHMENT_BYTES
    if (f.size > cap) {
      notify.error(t("chat.attach.tooLarge", { name: f.name, size: formatFileSize(cap) }))
      return false
    }
    return true
  })
}

/** Sürüklenen ya da yapıştırılan şeyde dosya var mı (metin yapıştırma bozulmasın). */
export const hasFiles = (dataTransfer) => Array.from(dataTransfer?.types ?? []).includes("Files")
