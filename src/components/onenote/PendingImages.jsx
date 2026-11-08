import { HugeiconsIcon } from "@hugeicons/react"
import Cancel01Icon from "@hugeicons/core-free-icons/Cancel01Icon"
import { useLocale } from "@/hooks/useLocale"

/** Öğenin altına eklenen (henüz kaydedilmemiş) resimlerin önizlemesi; × ile kaldırılır. */
export function PendingImages({ images, onRemove }) {
  const { t } = useLocale()
  if (!images.length) return null
  return images.map((img) => (
    <figure key={img.key} className="on-ed-img">
      <img src={img.src} alt={img.alt ?? ""} width={img.width} height={img.height} />
      <button
        type="button"
        className="on-ed-img-x"
        onClick={() => onRemove(img.key)}
        aria-label={t("onenote.edit.image.remove")}
        title={t("onenote.edit.image.remove")}
      >
        <HugeiconsIcon icon={Cancel01Icon} strokeWidth={2.2} aria-hidden="true" />
      </button>
    </figure>
  ))
}
