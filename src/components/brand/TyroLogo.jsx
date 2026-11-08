import { useId } from "react"
import { MARK, MARK_BOX, MARK_GRADIENT } from "./tyroLogoPaths"

/** Kurumsal "t" işareti. Renkler seçili paletin `--brand-logo-*` tonları; `themeColors` ezer. */
export function TyroLogo({ size = 36, themeColors, className, ...props }) {
  const uniqueId = useId()
  const gradId = `tyro-grad-${uniqueId.replace(/:/g, "")}`

  const colors = themeColors ?? {
    gradStart: "var(--brand-logo-1)",
    gradEnd: "var(--brand-logo-2)",
    fillA: "var(--brand-logo-3)",
    fillB: "var(--brand-logo-4)",
    fillC: "var(--brand-logo-5)",
  }

  return (
    <svg
      width={size}
      height={size}
      viewBox={MARK_BOX}
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      fillRule="evenodd"
      role="img"
      aria-label="TYRO"
      {...props}
    >
      <defs>
        <linearGradient id={gradId} gradientUnits="userSpaceOnUse" {...MARK_GRADIENT}>
          <stop offset="0" stopColor={colors.gradStart} />
          <stop offset="1" stopColor={colors.gradEnd} />
        </linearGradient>
      </defs>
      <path d={MARK.left} fill={`url(#${gradId})`} />
      <path d={MARK.stem} fill={colors.fillA} />
      <path d={MARK.upper} fill={colors.fillB} />
      <path d={MARK.curve} fill={colors.fillC} />
    </svg>
  )
}

export default TyroLogo
