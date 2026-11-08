import { StationArt } from "../radioParts"
import "./stageVinyl.css"

/**
 * Halkanın yüzü bir plak, istasyonun görseli plağın etiketi. Ortadaki halka bağlanırken görsel
 * etikete küçülür ve siyah plak açılır; çalarken plak 33⅓ devirde döner, ışık yansıması ve mil
 * dönmez (ışık kaynağı yerinde). Duraklayınca plak yavaşlayıp durur, sonra görsel yeniden bütün
 * halkayı kaplar. Durum `.stage-orb[data-state]`ten okunur; hareketin hepsi CSS'te
 * (`stageVinyl.css`). Yan halkalar hiç çalmadığı için hep düz görsel görünür.
 */
export function StageVinyl({ station }) {
  return (
    <span aria-hidden="true" className="stage-art stage-vinyl">
      <span className="stage-vinyl-disc">
        <span className="stage-vinyl-kick">
          <span className="stage-vinyl-grooves" />
          <span className="stage-vinyl-label">
            <StationArt station={station} size="lg" className="size-full rounded-full" />
          </span>
        </span>
      </span>
      <span className="stage-vinyl-sheen" />
      <span className="stage-vinyl-spindle" />
    </span>
  )
}
