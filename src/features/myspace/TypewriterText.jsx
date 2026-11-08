/**
 * Metni `delay` sonra harf harf açar — CSS ile: her harf kendi gecikmesiyle görünür, imleç yalnız
 * son açılan harfin ardında (`intro.css` › `.ms-type-char`). Harf başına React durumu kartı
 * (küreyle birlikte) ~45 kez yeniden çizdiriyordu, açılışın tam ortasında.
 */
export function TypewriterText({ text, delay = 0, step = 34 }) {
  return Array.from(text).map((ch, i) => (
    <span
      key={i}
      className="ms-type-char"
      style={{ "--type-at": `${delay + i * step}ms`, "--type-step": `${step}ms` }}
    >
      {ch}
    </span>
  ))
}
