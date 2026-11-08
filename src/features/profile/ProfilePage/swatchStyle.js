/** Renk noktası: düz palette tek renk, gradyanda paletin üç durağı. */
export function swatchStyle(p) {
  if (p.group === "solid") return { backgroundColor: p.swatch[0] }
  return { backgroundImage: `linear-gradient(135deg, ${p.swatch.join(", ")})` }
}
