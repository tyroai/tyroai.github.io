// Pastel ses küresinin saf yardımcıları ve sabit verisi (bileşen dosyası küçük kalsın).

export function clampLevel(value) {
  if (typeof value !== "number" || Number.isNaN(value)) return 0
  return Math.max(0, Math.min(1, value))
}

export function parsePercent(v) {
  const n = parseFloat(v)
  return Number.isFinite(n) ? n : 0
}

// 5-bar waveform amplitude template (relative heights, center peak)
export const WAVE_BARS = [0.35, 0.7, 1, 0.7, 0.35]

export const PARTICLES = [
  { left: "34%", top: "24%", size: 2.2, color: "rgba(245,139,108,0.82)", delay: 0, drift: -10 },
  { left: "43%", top: "30%", size: 1.4, color: "rgba(229,111,142,0.64)", delay: 0.22, drift: 8 },
  { left: "51%", top: "21%", size: 1.7, color: "rgba(255,168,127,0.72)", delay: 0.54, drift: -8 },
  { left: "60%", top: "37%", size: 1.1, color: "rgba(164,92,223,0.56)", delay: 0.86, drift: 7 },
  { left: "32%", top: "57%", size: 1.1, color: "rgba(185,118,229,0.50)", delay: 1.1, drift: -6 },
  { left: "64%", top: "74%", size: 2.6, color: "rgba(255,255,255,0.95)", delay: 0.66, drift: -9 },
  { left: "49%", top: "51%", size: 1, color: "rgba(255,190,170,0.56)", delay: 1.42, drift: 6 },
  { left: "27%", top: "36%", size: 1.6, color: "rgba(255,178,132,0.62)", delay: 1.66, drift: -7 },
  { left: "70%", top: "47%", size: 0.9, color: "rgba(255,210,230,0.66)", delay: 1.9, drift: 5 },
]
