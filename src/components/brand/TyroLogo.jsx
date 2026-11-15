import { useId } from "react"
import { useLogoOrb } from "@/lib/logoOrb"
import { OrbGlyph } from "./TyroOrbGlyph"

/**
 * Markanın tek başına işareti: yuvarlak gözlü küre (demo/overlay; kaynaktaki "t" işaretinin yerine
 * geçer, imzası aynı). `themeColors` verilirse tek renk çizilir (`currentColor`, gözler delik):
 * renkli bir zeminin üstüne konan kullanımlar için.
 */
export function TyroLogo({ size = 36, themeColors, className, ...props }) {
  const uid = `tyro-orb-${useId().replace(/:/g, "")}`
  const orbStyle = useLogoOrb()
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 256 256"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      role="img"
      aria-label="tyro"
      {...props}
    >
      <OrbGlyph cx={128} cy={128} r={122} id={uid} mono={Boolean(themeColors)} variant={orbStyle} />
    </svg>
  )
}

export default TyroLogo
