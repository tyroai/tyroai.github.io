import type { NoteImageRef } from "./tibotModel"

/** Notun eki (`textAttachments`, akışın `detail` işlemi): adres süreli ve imzalı (1–2 gün). */
export type NoteAttachment = {
  key?: string | null
  filename?: string | null
  inline?: boolean | null
  size?: number | null
  expiringUrl?: string | null
}
export type NoteImage = { key: string; url: string; w?: number; h?: number; name?: string }
export type NoteFile = { key: string; url: string; name: string; size?: number }

/**
 * Ek adresi yalnız https ve Xurrent'in kendi deposundansa kullanılır (bugün
 * `storage.4me.com`). Nottan ya da veriden gelen yabancı bir adres çizilmez, açılmaz.
 */
export function safeAttachmentUrl(url: unknown): string | null {
  if (typeof url !== "string" || !url) return null
  try {
    const u = new URL(url)
    const host = u.hostname.toLowerCase()
    if (u.protocol !== "https:") return null
    return host.endsWith(".4me.com") || host.endsWith(".xurrent.com") ? u.href : null
  } catch {
    return null
  }
}

/**
 * Notun ekleri: metindeki görseller sırayla ve anahtarla eşlenmiş adresleriyle (`images`),
 * satır içi olmayan dosyalar (`files`) ve adresi bulunamayan görsel sayısı (`missing`: eski
 * "Görsel ek: n (Xurrent'te)" satırına düşer).
 */
export function noteMedia(
  refs: NoteImageRef[],
  attachments: NoteAttachment[] | null | undefined,
): { images: NoteImage[]; files: NoteFile[]; missing: number } {
  const list = (attachments ?? []).filter((a): a is NoteAttachment & { key: string } => !!a?.key)
  const byKey = new Map(list.map((a) => [a.key, a]))
  const images: NoteImage[] = []
  let missing = 0
  for (const ref of refs) {
    const att = byKey.get(ref.key)
    const url = safeAttachmentUrl(att?.expiringUrl)
    if (url)
      images.push({ key: ref.key, url, w: ref.w, h: ref.h, name: att?.filename ?? undefined })
    else missing += 1
  }
  const used = new Set(refs.map((r) => r.key))
  const files: NoteFile[] = []
  for (const a of list) {
    if (a.inline || used.has(a.key)) continue
    const url = safeAttachmentUrl(a.expiringUrl)
    if (!url) continue
    const name = a.filename || a.key.split("/").pop() || a.key
    files.push(a.size ? { key: a.key, url, name, size: a.size } : { key: a.key, url, name })
  }
  return { images, files, missing }
}
