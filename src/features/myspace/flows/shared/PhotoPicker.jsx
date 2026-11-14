import { useState } from "react"

/** Dairenin içi: fotoğraf; inmezse `fallback`. */
function Disc({ src, fallback }) {
  const [failed, setFailed] = useState(false)
  if (!src || failed) return fallback ?? null
  return (
    <img
      src={src}
      alt=""
      width="240"
      height="240"
      loading="lazy"
      decoding="async"
      className="af-city-photo"
      onError={() => setFailed(true)}
    />
  )
}

/**
 * Fotoğraflı daire ızgarası (izin türleri, sık kullanılan masraf kategorileri; şehirlerin dili).
 * `items`: `{ value, name, src, tip? }` — `tip` üstüne gelince ipucu. Seçili olan halkalı.
 * `art`: görsel saydam zeminli illüstrasyon; daireye kırpılmaz, tonlu zeminde paylı durur.
 */
export function PhotoPicker({ items, value, onPick, label, columns, art }) {
  return (
    <div
      role="group"
      aria-label={label}
      className={art ? "af-city-grid af-city-grid--art" : "af-city-grid"}
      style={columns ? { "--af-cols": columns } : undefined}
    >
      {items.map((o) => (
        <button
          key={o.value}
          type="button"
          className="af-city-item"
          aria-pressed={o.value === value}
          data-autofocus={o.value === value ? "" : undefined}
          title={o.tip}
          onClick={() => onPick(o.value)}
        >
          <span className="af-city-disc">
            <Disc src={o.src} fallback={o.fallback} />
          </span>
          <span className="af-city-name">{o.name}</span>
        </button>
      ))}
    </div>
  )
}
