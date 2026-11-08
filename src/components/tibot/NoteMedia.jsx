import { useState } from "react"
import { HugeiconsIcon } from "@hugeicons/react"
import Attachment01Icon from "@hugeicons/core-free-icons/Attachment01Icon"
import Image01Icon from "@hugeicons/core-free-icons/Image01Icon"
import { ImageLightbox } from "@/components/common/ImageLightbox"
import { useLocale } from "@/hooks/useLocale"
import { formatBytes } from "@/lib/filesFormat"
import { noteMedia } from "@/lib/tibot/tibotNotes"

/**
 * Notun ekleri, talep penceresinde: görseller notun içinde; basınca uygulamanın görüntüleyicisi
 * (`ImageLightbox`: yakınlaştırma, oklar, Escape ya da dışarı basınca kapanır; yeni sekme açılmaz,
 * kurulu uygulamada sekme kapatılamıyordu). Satır içi olmayan dosyalar çip. Adres Xurrent'in süreli bağlantısı (detayla gelir); adresi
 * olmayan ya da yüklenemeyen görsel eski satıra düşer ("Görsel ek: n (Xurrent'te)").
 * Boyut biliniyorsa (`width`/`height`) yer önceden ayrılır, görsel gelince pencere kaymaz.
 */
export function NoteMedia({ refs, attachments }) {
  const { t, locale } = useLocale()
  const [failed, setFailed] = useState(() => new Set())
  const [viewing, setViewing] = useState(null) // görüntüleyicide açık görselin anahtarı
  const { images, files, missing } = noteMedia(refs, attachments)
  const shown = images.filter((im) => !failed.has(im.key))
  const lost = missing + images.length - shown.length
  return (
    <>
      {shown.length > 0 && (
        <div className="tb-note-shots">
          {shown.map((im, i) => (
            <button
              key={im.key}
              type="button"
              aria-haspopup="dialog"
              onClick={() => setViewing(im.key)}
              className="tb-note-shot"
              aria-label={t("tibot.openImage", { n: i + 1 })}
            >
              <img
                src={im.url}
                alt=""
                width={im.w}
                height={im.h}
                loading="lazy"
                decoding="async"
                referrerPolicy="no-referrer"
                onError={() => setFailed((s) => new Set(s).add(im.key))}
              />
            </button>
          ))}
        </div>
      )}
      <ImageLightbox
        items={shown.map((im) => ({ id: im.key, url: im.url, name: im.name }))}
        activeId={viewing}
        onActiveIdChange={setViewing}
        onClose={() => setViewing(null)}
        zoomable
      />
      {files.length > 0 && (
        <ul className="tb-note-files">
          {files.map((f) => (
            <li key={f.key} className="min-w-0">
              <a
                href={f.url}
                target="_blank"
                rel="noopener noreferrer"
                referrerPolicy="no-referrer"
                className="tb-note-file"
              >
                <HugeiconsIcon icon={Attachment01Icon} strokeWidth={1.8} aria-hidden="true" />
                <span className="truncate">{f.name}</span>
                {f.size ? (
                  <span className="tb-note-file-size">{formatBytes(f.size, locale)}</span>
                ) : null}
              </a>
            </li>
          ))}
        </ul>
      )}
      {lost > 0 && (
        <p className="tb-note-images">
          <HugeiconsIcon icon={Image01Icon} strokeWidth={1.8} aria-hidden="true" />
          {t("tibot.images", { n: lost })}
        </p>
      )}
    </>
  )
}
