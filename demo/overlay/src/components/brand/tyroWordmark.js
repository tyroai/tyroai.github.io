// Yeni "tyro" yazı logosu (Kasım 2026): yuvarlak, tek kalınlıklı özel çizim; "o" harfinin yerinde küre
// durur. Harfler yazı tipi değil, dış hat (kaynak: masaüstündeki tyro Logo Kit, `tyro-logo/outline.mjs`).
// Düzlem: x-yüksekliği 72–200, taban 200, "t" tepesi 40, "y" kuyruğu 256.

/** "tyr" harflerinin dış hattı (tek yol, `nonzero`). */
export const TYR =
  "M30 54A14 14 0 0 1 58 54V156A16 16 0 0 0 74 172H90A14 14 0 0 1 90 200H74A44 44 0 0 1 30 156Z M16 72.84L84 72.84A13.16 13.16 0 0 1 84 99.16L16 99.16A13.16 13.16 0 0 1 16 72.84Z M148.69 80.08L195.32 180.08A14 14 0 0 1 169.94 191.92L123.31 91.92A14 14 0 0 1 148.69 80.08Z M241.95 91.92L169.21 247.92A14 14 0 0 1 143.83 236.08L216.57 80.08A14 14 0 0 1 241.95 91.92Z M265.26 186A14 14 0 0 0 293.26 186V124A24 24 0 0 1 317.26 100H327.26A14 14 0 0 0 327.26 72H317.26A52 52 0 0 0 265.26 124Z"

/**
 * Kutu, eski logonun kutusuyla (`WORD_BOX`, 944 birim) aynı oranda: aynı boy sınıfında harfler eskisi
 * kadar görünür, "y"nin kuyruğu kutunun altına taşar. `scale` eski düzlemden bu düzleme çarpan
 * (bölüm eki "RM" eski düzlemde çizili).
 */
export const WORDMARK = {
  box: { x: 2.84, y: 14.3, h: 213.1 },
  scale: 213.1 / 944,
  lettersRight: 341.26,
  right: 501.26,
  // Küre x-yüksekliğinden belirgin büyük (çap 148, x-yüksekliği 128) ve harflerin ORTA hattına
  // ortalı (y 136): üstten ve alttan eşit taşar. Tabana oturtulunca yukarıda kalmış görünüyordu.
  orb: { cx: 427.26, cy: 136, r: 74 },
}
